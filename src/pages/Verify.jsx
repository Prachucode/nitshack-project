import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import abi from "../utils/abi.json";
import { credentialAPI } from "../services/credentialAPI";
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Calendar, 
  Building2, 
  Lock, 
  FileText, 
  ExternalLink, 
  Award,
  Layers,
  Database
} from "lucide-react";
import "../Verify.css";

const CONTRACT_ADDRESS = "0xC8e4689704E74e62C59D7Fc20C74f7D0803157e9";

const Verify = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || "");
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [_isUUIDLookup, setIsUUIDLookup] = useState(false);
  const [actualCredentialId, setActualCredentialId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [privacyRules, setPrivacyRules] = useState(null);

  // Parse ID and privacy rules from URL
  useEffect(() => {
    const parseId = async () => {
      if (!searchId) return;

      setLoading(true);
      setFetchError(null);
      setPrivacyRules(null);

      try {
        // 1. Try to decode as Base64 JSON token (new private link format)
        // Format: Base64({ id: "123", rules: [...] })
        let decodedId = null;
        let decodedRules = null;
        let isToken = false;

        try {
          // Check if it looks like a token (not a number, not a UUID)
          if (!/^\d+$/.test(searchId) && !searchId.includes("-")) {
            const decoded = JSON.parse(atob(searchId));
            if (decoded && decoded.id) {
              decodedId = decoded.id;
              decodedRules = decoded.rules || null;
              isToken = true;
              console.log('Decoded private token:', { id: decodedId, rules: decodedRules });
            }
          }
        } catch {
          // Not a valid base64 token, continue to standard checks
        }

        const idToLookup = isToken ? decodedId : searchId;

        // Set privacy rules if found in token
        if (decodedRules) {
          setPrivacyRules(decodedRules);
        }

        // 2. Check if it's a UUID format (contains hyphens)
        const isUUID = idToLookup.toString().includes("-");
        setIsUUIDLookup(isUUID);

        if (isUUID) {
          try {
            const result = await credentialAPI.getCredentialByUUID(idToLookup);
            if (result) {
              setActualCredentialId(result.credentialId);
            } else {
              setFetchError("Credential not found. Invalid verification link.");
            }
          } catch (error) {
            console.error("UUID lookup failed:", error);
            setFetchError("Failed to verify credential. Please try again.");
          }
        } else {
          // Use as direct ID (number)
          setActualCredentialId(parseInt(idToLookup));
        }
      } catch (err) {
        console.error("Error parsing ID:", err);
        setFetchError("Invalid verification link.");
      } finally {
        setLoading(false);
      }
    };

    parseId();
  }, [searchId]);
  const {
    data: credentialData,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: "getCredential",
    args: actualCredentialId ? [BigInt(actualCredentialId)] : undefined,
    query: {
      enabled: !!actualCredentialId,
    },
  });

  // Check if issuer is authorized
  const {
    data: isTrustedIssuer,
    isLoading: isIssuerCheckLoading
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: "isAuthorizedIssuer",
    args: credentialData?.issuer ? [credentialData.issuer] : undefined,
    query: {
      enabled: !!credentialData?.issuer,
    },
  });

  // Auto-trigger verification when URL contains an ID
  useEffect(() => {
    if (id) {
      setSearchId(id);
      setSearched(true); // Auto-trigger search for URL-based access
    }
  }, [id]);

  // Trigger blockchain fetch when actualCredentialId is ready
  useEffect(() => {
    if (actualCredentialId && searched) {
      fetchFromBlockchain();
    }
  }, [actualCredentialId, searched]);

  const fetchFromBlockchain = async () => {
    setLoading(true);
    setMetadata(null);

    try {
      const result = await refetch();

      if (result.error) {
        setFetchError(
          "Invalid Credential ID - This credential does not exist on the blockchain"
        );
        setLoading(false);
        return;
      }

      if (result.data) {
        if (
          result.data.student ===
          "0x0000000000000000000000000000000000000000" ||
          result.data.id === 0n
        ) {
          setFetchError(
            "Invalid Credential ID - This credential does not exist"
          );
          setLoading(false);
          return;
        }

        const ipfsHash = result.data.ipfsHash;
        if (ipfsHash) {
          fetchMetadata(ipfsHash);
        } else {
          setFetchError("No IPFS hash found for this credential");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching credential:", err);
      setFetchError("Invalid Credential ID - This credential does not exist");
      setLoading(false);
    }
  };

  const handleSearch = async (credentialId) => {
    if (!credentialId) return;

    if (credentialId !== id) {
      navigate(`/verify/${credentialId}`, { replace: true });
    }

    setFetchError(null);
    setSearched(true);

    // The UUID lookup useEffect will handle setting actualCredentialId
    // and then the fetchFromBlockchain useEffect will trigger
  };

  const fetchMetadata = async (ipfsHash) => {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const response = await axios.get(url);
      setMetadata(response.data);
    } catch (err) {
      console.error("IPFS Fetch Error:", err);
      setFetchError("Failed to load credential metadata from IPFS");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const _copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Extract PDF hash from metadata.image (format: "ipfs://hash")
  const getPdfHash = () => {
    if (!metadata || !metadata.image) return null;
    return metadata.image.replace("ipfs://", "");
  };

  // Filter metadata based on privacy rules
  const getFilteredMetadata = () => {
    if (!metadata) return null;

    // If no privacy rules, return full metadata
    if (!privacyRules || privacyRules.length === 0) {
      return metadata;
    }

    // Create a filtered copy of metadata
    // Remove attributes completely so they can't be inspected
    const filtered = { ...metadata };

    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      filtered.attributes = metadata.attributes.filter(attr => {
        const fieldName = attr.trait_type || attr.key;
        return privacyRules.includes(fieldName);
      });
    }

    return filtered;
  };

  // Check if PDF should be accessible
  const _isPdfAccessible = () => {
    // PDF is not accessible if privacy rules are applied
    return !privacyRules || privacyRules.length === 0;
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        {/* Header */}
        <div className="verify-header text-center">
          <h1 className="verify-title">Verify Credential</h1>
          <p className="verify-subtitle">
            Check credential validity on the blockchain
          </p>
        </div>

        {/* Search Console */}
        <div className="search-section">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-input-wrapper">
              <div className="search-input-box">
                <Search size={18} className="search-box-icon" />
                <input
                  type="text"
                  placeholder="Enter credential ID or verification link"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="search-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchId}
                className="search-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {fetchError && searched && (
          <div className="error-card">
            <div className="error-icon-box">
              <AlertCircle size={28} />
            </div>
            <div className="error-content">
              <h3>Credential Not Found</h3>
              <p>{fetchError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <h3>Verifying...</h3>
            <p>Fetching credential data...</p>
          </div>
        )}

        {/* Credential Verified Card */}
        {credentialData &&
          credentialData.student !==
          "0x0000000000000000000000000000000000000000" &&
          !loading && (
            <div
              className={`credential-result-card ${credentialData.revoked ? "revoked" : "valid"}`}
            >
              {/* Status Header Banner */}
              <div className="verification-status-banner">
                <div className="status-badge-wrap">
                  {credentialData.revoked ? (
                    <div className="status-pill status-revoked">
                      <ShieldAlert size={18} />
                      <span>REVOKED</span>
                    </div>
                  ) : (
                    <div className="status-pill status-valid">
                      <CheckCircle2 size={18} />
                      <span>VERIFIED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credential Identity Header */}
              <div className="credential-identity-header">
                <div className="credential-icon-badge">
                  <Award size={32} />
                </div>
                <div className="credential-title-section">
                  <h2 className="credential-main-title">
                    {metadata?.name || `Credential #${credentialData.id.toString()}`}
                  </h2>
                  <div className="credential-id-row">
                    <span className="token-id-badge">ID: #{credentialData.id.toString()}</span>
                    {credentialData.issuer && (
                      <span className="issuer-addr-badge" title={credentialData.issuer}>
                        Issuer: {formatAddress(credentialData.issuer)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Credential Details Grid */}
              <div className="credential-details-grid">
                {/* Certificate Type */}
                {metadata && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <Layers size={14} />
                      <span>Type</span>
                    </div>
                    <div className="detail-value">
                      {metadata.certificateType?.replace(/_/g, " ") || "Standard"}
                    </div>
                  </div>
                )}

                {/* Issue Date */}
                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={14} />
                    <span>Issued</span>
                  </div>
                  <div className="detail-value">
                    {formatDate(credentialData.issueDate)}
                  </div>
                </div>

                {/* Issuer Status */}
                <div className="detail-item full-width">
                  <div className="detail-label">
                    <Building2 size={14} />
                    <span>Issuer Status</span>
                  </div>
                  <div className="detail-value">
                    {isIssuerCheckLoading ? (
                      <span className="issuer-loading">
                        <span className="spinner-small"></span> Checking...
                      </span>
                    ) : isTrustedIssuer ? (
                      <span className="issuer-trusted">
                        <CheckCircle2 size={16} />
                        <span>Authorized Issuer</span>
                      </span>
                    ) : (
                      <span className="issuer-unknown">
                        <AlertCircle size={16} />
                        <span>Unregistered Issuer</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Attributes Section */}
              {metadata && getFilteredMetadata()?.attributes && getFilteredMetadata().attributes.length > 0 && (
                <div className="attributes-section">
                  <div className="attributes-header-row">
                    <h3 className="section-title">Attributes</h3>
                    {privacyRules && (
                      <span className="selective-badge">
                        <Lock size={12} />
                        <span>Filtered</span>
                      </span>
                    )}
                  </div>
                  <div className="attributes-grid">
                    {getFilteredMetadata().attributes.map((attr, index) => (
                      <div key={index} className="attribute-card">
                        <div className="attribute-label">{attr.trait_type || attr.key}</div>
                        <div className="attribute-value">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons & Document Access */}
              <div className="action-buttons-wrap">
                {!privacyRules && metadata && getPdfHash() && (
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${getPdfHash()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn primary"
                  >
                    <FileText size={16} />
                    <span>View Document (PDF)</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                {privacyRules && (
                  <div className="action-btn-disabled-info">
                    <Lock size={18} className="lock-icon" />
                    <div>
                      <strong>Document Viewing Restricted</strong>
                      <p>Document access restricted by student privacy settings.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Notice Banner */}
              {privacyRules && privacyRules.length > 0 && (
                <div className="privacy-notice-banner">
                  <Lock size={18} className="privacy-icon" />
                  <div>
                    <strong>Privacy Mode Active</strong>
                    <p>Only selected attributes are shown.</p>
                  </div>
                </div>
              )}

              {/* Metadata Details Collapsible */}
              {metadata && (
                <div className="metadata-section">
                  <details className="metadata-details">
                    <summary className="metadata-summary">
                      <Database size={15} />
                      <span>View Raw Metadata</span>
                    </summary>
                    <pre className="metadata-json">
                      {JSON.stringify(getFilteredMetadata(), null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

        {/* Empty State */}
        {!searched && !loading && (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Search size={36} />
            </div>
            <h3>Verify a Credential</h3>
            <p>
              Enter a credential ID or paste a verification link to check its validity.
            </p>
            <div className="example-text">
              <span>Quick Test: Try credential ID</span>
              <button 
                type="button" 
                className="example-id-pill"
                onClick={() => { setSearchId("6"); }}
              >
                #6
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;
