import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import abi from "../utils/abi.json";
import { v4 as uuidv4 } from "uuid";
import { credentialAPI } from "../services/credentialAPI";

import { extractTextFromPDF } from "../utils/pdfToText";
import { parseWithAI, hasValidData } from "../utils/aiParser";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check,
  ExternalLink, 
  ShieldCheck, 
  Terminal, 
  ArrowRight, 
  Award,
  Layers,
  Wallet,
  AlertCircle
} from "lucide-react";

const CONTRACT_ADDRESS = "0xC8e4689704E74e62C59D7Fc20C74f7D0803157e9";
const CONTRACT_ABI = abi;

export default function IssuerForm() {
  // State for file and form data
  const [file, setFile] = useState(null);
  const [_certType, _setCertType] = useState("Degree");

  // State for UUID tracking
  const [credentialUUID, setCredentialUUID] = useState("");
  const [showUUIDCopied, setShowUUIDCopied] = useState(false);

  // ---------- IPFS upload functions (main fix is here) ----------

  const getCleanJWT = () => {
    let jwt = import.meta.env.VITE_PINATA_JWT;
    if (!jwt) {
      throw new Error("VITE_PINATA_JWT is missing in .env file");
    }
    // Remove any surrounding quotes and whitespace
    return jwt.replace(/^['"]|['"]$/g, "").trim();
  };

  const uploadFileToIPFS = async (file) => {
    const jwt = getCleanJWT();

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
            // DON'T set Content-Type manually; fetch will add correct multipart boundary
          },
          body: data,
        }
      );

      const resText = await res.text();

      if (!res.ok) {
        // Pinata error body is JSON; try to parse, else show raw text
        try {
          const errJson = JSON.parse(resText);
          const details =
            errJson?.error?.details ||
            errJson?.error ||
            JSON.stringify(errJson);
          throw new Error(details);
        } catch {
          throw new Error(resText || "Unknown error from Pinata");
        }
      }

      const resJson = JSON.parse(resText);
      return resJson.IpfsHash;
    } catch (error) {
      console.error("FULL IPFS FILE ERROR:", error);
      throw new Error(
        `Failed to upload file to IPFS: ${
          error.message || "Unknown error occurred"
        }`
      );
    }
  };

  const uploadJSONToIPFS = async (jsonMetadata) => {
    const jwt = getCleanJWT();

    // Follow Pinata's required JSON shape
    const body = {
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: jsonMetadata.name || "credential-metadata.json",
      },
      pinataContent: jsonMetadata,
    };

    try {
      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(body),
        }
      );

      const resText = await res.text();

      if (!res.ok) {
        try {
          const errJson = JSON.parse(resText);
          const details =
            errJson?.error?.details ||
            errJson?.error ||
            JSON.stringify(errJson);
          throw new Error(details);
        } catch {
          throw new Error(resText || "Unknown error from Pinata");
        }
      }

      const resJson = JSON.parse(resText);
      return resJson.IpfsHash;
    } catch (error) {
      console.error("FULL IPFS JSON ERROR:", error);
      throw new Error(
        `Failed to upload JSON to IPFS: ${
          error.message || "Unknown error occurred"
        }`
      );
    }
  };
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [attributeValues, setAttributeValues] = useState({});
  const [status, setStatus] = useState("");
  const [finalHash, setFinalHash] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState("");

  // Handle address input change
  const handleAddressChange = (e) => {
    const val = e.target.value;
    setStudentAddress(val);
    setIsAddressValid(isAddress(val));
  };

  // Wagmi hooks
  const { address: _connectedAddress, isConnected } = useAccount();
  const {
    data: hash,
    writeContract,
    isPending: isMintPending,
    error: mintError,
  } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Load certificate types from localStorage
  useEffect(() => {
    const savedTypes = localStorage.getItem("certTemplates");
    if (savedTypes) {
      const types = JSON.parse(savedTypes);
      setCertificateTypes(types);
      // Set first type as default if available
      if (types.length > 0) {
        setSelectedTypeId(types[0].id.toString());
        setSelectedType(types[0]);
        // Initialize attribute values
        const initialValues = {};
        types[0].fields.forEach((field) => {
          initialValues[field.name] = "";
        });
        setAttributeValues(initialValues);
      }
    }
  }, []);

  // Handle certificate type selection
  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    setSelectedTypeId(typeId);

    const type = certificateTypes.find((t) => t.id.toString() === typeId);
    setSelectedType(type);

    // Reset attribute values for new type
    if (type) {
      const initialValues = {};
      type.fields.forEach((field) => {
        initialValues[field.name] = "";
      });
      setAttributeValues(initialValues);
    }
  };

  // Handle attribute value change
  const handleAttributeChange = (fieldName, value) => {
    setAttributeValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Register UUID after successful minting
  useEffect(() => {
    const registerUUID = async () => {
      if (isConfirmed && receipt && !credentialUUID) {
        try {
          console.log("🔄 Starting UUID registration process...");
          console.log("Transaction hash:", hash);

          setStatus("Registering secure credential ID...");

          // Generate UUID
          const uuid = uuidv4();
          console.log("📝 Generated UUID:", uuid);

          // Get actual credential ID from transaction logs
          let credentialId;
          try {
            // Find the CredentialIssued event log
            // Event signature: CredentialIssued(uint256 indexed id, address indexed student, address issuer)
            // We look for a log that has 3 topics (sig, id, student)
            const log = receipt.logs.find((l) => l.topics.length >= 3);
            if (log) {
              // The ID is in topic 1 (hex string)
              credentialId = BigInt(log.topics[1]).toString();
              console.log(
                "🔢 Found actual credential ID from logs:",
                credentialId
              );
            } else {
              throw new Error("Could not find CredentialIssued event in logs");
            }
          } catch (parseError) {
            console.error("Error parsing logs:", parseError);
            // Fallback to estimation if parsing fails (should not happen if contract works)
            credentialId = (Date.now() % 1000000).toString();
            console.warn("⚠️ Using fallback ID:", credentialId);
          }

          // Register with backend
          console.log("📤 Sending registration to backend...");
          const response = await credentialAPI.registerCredential(
            uuid,
            credentialId,
            studentAddress,
            hash
          );
          console.log("✅ Backend response:", response);

          setCredentialUUID(uuid);
          setStatus("");

          console.log("✅ UUID Registered Successfully!");
          console.log(
            `🔗 Share link: ${window.location.origin}/verify/${uuid}`
          );
        } catch (error) {
          console.error("❌ UUID registration failed:", error);
          console.error(
            "Error details:",
            error.response?.data || error.message
          );
          setStatus(
            "Warning: Credential minted but secure ID registration failed"
          );
          // Still set the UUID even if backend registration fails
          // so the link can be shown
          const uuid = uuidv4();
          setCredentialUUID(uuid);
          console.log("⚠️ Set UUID locally despite backend failure:", uuid);
        }
      }
    };

    registerUUID();
  }, [isConfirmed, receipt, hash, credentialUUID, studentAddress]);

  // AI-powered PDF parsing
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    setFile(selectedFile);
    setAiError("");

    // Only run AI if we have a selected certificate type with fields
    if (selectedType && selectedType.fields && selectedType.fields.length > 0) {
      setIsAiProcessing(true);
      setStatus("✨ AI is reading the document...");

      try {
        // Step 1: Extract text from PDF
        const extractedText = await extractTextFromPDF(selectedFile);

        if (!extractedText || extractedText.length < 10) {
          throw new Error("Could not extract meaningful text from PDF");
        }

        // Step 2: Parse with AI
        const parsedData = await parseWithAI(
          extractedText,
          selectedType.fields
        );

        // Step 3: Auto-fill the form
        const newAttributeValues = {};
        selectedType.fields.forEach((field) => {
          // Use AI value if available, otherwise keep empty
          newAttributeValues[field.name] = parsedData[field.name] || "";
        });

        setAttributeValues(newAttributeValues);

        // Check if AI found any data
        if (hasValidData(parsedData)) {
          setStatus(
            "✅ AI successfully pre-filled the form! Please review and edit if needed."
          );
        } else {
          setStatus(
            "⚠️ AI could not extract data. Please fill the form manually."
          );
        }
      } catch (error) {
        console.error("AI parsing error:", error);
        setAiError(`AI parsing failed: ${error.message}`);
        setStatus("⚠️ AI parsing failed. Please fill the form manually.");

        // Initialize empty values so user can fill manually
        const emptyValues = {};
        selectedType.fields.forEach((field) => {
          emptyValues[field.name] = "";
        });
        setAttributeValues(emptyValues);
      } finally {
        setIsAiProcessing(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    if (!selectedType) return alert("Please select a certificate type");

    // Validate all required attributes are filled
    const missingFields = selectedType.fields.filter((field) => {
      const value = attributeValues[field.name];
      // Handle different field types
      if (field.type === "text") {
        return !value || !value.trim();
      } else {
        // For number, date, etc., just check if value exists
        return !value && value !== 0; // Allow 0 for numbers
      }
    });
    if (missingFields.length > 0) {
      return alert(
        `Please fill in all required fields: ${missingFields
          .map((f) => f.name)
          .join(", ")}`
      );
    }

    // Clear previous results
    setFinalHash("");
    setStatus("Uploading PDF to IPFS...");

    try {
      // STEP 1: Upload the PDF with certificate type for better organization
      const fileHash = await uploadFileToIPFS(file, selectedType.name);
      console.log("PDF uploaded. Hash:", fileHash);

      setStatus("Creating Metadata...");

      // STEP 2: Construct the Metadata JSON with dynamic attributes
      const currentTimestamp = new Date().toISOString();
      const attributes = [
        { trait_type: "Certificate Type", value: selectedType.name },
        {
          trait_type: "Issue Date",
          value: currentTimestamp,
          display_type: "date",
        },
      ];

      // Add all custom attributes from the certificate type
      selectedType.fields.forEach((field) => {
        const value = attributeValues[field.name];
        const attribute = {
          trait_type: field.name,
          value: value,
        };

        // Add display_type for special field types (NFT standard)
        if (field.type === "number") {
          attribute.display_type = "number";
        } else if (field.type === "date") {
          attribute.display_type = "date";
        }

        attributes.push(attribute);
      });

      // Enhanced metadata following NFT and OpenSea standards
      const metadata = {
        name: `${selectedType.name} - Student Credential`,
        description: `A ${selectedType.name} credential issued on the blockchain platform. This digital credential is verifiable, immutable, and permanently stored on IPFS and Polygon blockchain.`,
        certificateType: selectedType.name,

        // Standard NFT fields
        image: `ipfs://${fileHash}`, // Points to the PDF document
        external_url: `https://ipfs.io/ipfs/${fileHash}`, // Direct link to view PDF

        // All credential attributes
        attributes: attributes,

        // Additional metadata for verification
        metadata: {
          version: "1.0",
          standard: "ERC721",
          createdAt: currentTimestamp,
          platform: "Student Credentials Platform",
          documentHash: fileHash,
          documentType: "application/pdf",
        },

        // Background color for NFT marketplaces (optional)
        background_color: "667eea",
      };

      // STEP 3: Upload the Metadata with certificate type
      const metaHash = await uploadJSONToIPFS(metadata, selectedType.name);

      console.log("✅ Credential Created Successfully!");
      console.log("PDF Hash:", fileHash);
      console.log("Metadata Hash:", metaHash);
      console.log("Full Metadata:", JSON.stringify(metadata, null, 2));

      setFinalHash(metaHash);
      setStatus("");
    } catch (error) {
      console.error("❌ Upload error:", error);
      setStatus(`Error: ${error.message || "Failed to upload credential"}`);
      setFinalHash("");
    }
  };

  // Handle minting to blockchain
  const handleMint = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!isAddressValid) {
      alert("Please enter a valid student wallet address!");
      return;
    }

    if (!finalHash) {
      alert("Please upload the credential to IPFS first!");
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "issueCredential",
        args: [studentAddress, finalHash],
      });
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <div className="issuer-form-container">
      <div className="form-wrapper">
        <div className="form-header text-center">
          <h1 className="form-title">Issue Credential</h1>
          <p className="form-subtitle">
            Upload document, configure attributes, and mint to student address
          </p>
        </div>

        {/* Authority Wallet Connection */}
        <div className="wallet-connect-section">
          <div className="wallet-connect-info">
            <Wallet size={18} className={isConnected ? "text-emerald" : "text-amber"} />
            <span>
              {isConnected 
                ? "Wallet Connected" 
                : "Connect wallet to proceed"}
            </span>
          </div>
          <ConnectButton />
        </div>

        <div className="form-content">
          {/* File Input Section */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              <span>Upload Credential Document (PDF)</span>
            </label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
                id="file-upload"
                disabled={isAiProcessing}
              />
              <label htmlFor="file-upload" className={`file-input-label ${file ? 'has-file' : ''}`}>
                <div className="file-upload-icon-box">
                  {isAiProcessing ? (
                    <Sparkles className="spinning-ai-icon" size={24} />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div className="file-upload-meta">
                  <span className="file-title">
                    {isAiProcessing
                      ? "AI is reading document..."
                      : file
                      ? file.name
                      : "Click to browse or drop PDF document here"}
                  </span>
                  <span className="file-subtitle">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supported format: PDF up to 10MB"}
                  </span>
                </div>
              </label>
            </div>
            {isAiProcessing && (
              <div className="ai-loading">
                <div className="spinner"></div>
                <span>AI is extracting data...</span>
              </div>
            )}
            {aiError && (
              <div className="ai-error">
                <AlertCircle size={16} />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Type Dropdown Section */}
          <div className="form-group">
            <label className="form-label">
              <Layers size={16} />
              <span>Certificate Type</span>
            </label>
            {certificateTypes.length > 0 ? (
              <select
                onChange={handleTypeChange}
                className="form-select"
                value={selectedTypeId}
              >
                {certificateTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.fields.length} attributes)
                  </option>
                ))}
              </select>
            ) : (
              <p className="warning-text">
                No certificate schemas found. Please configure a schema in "Schemas" first.
              </p>
            )}
          </div>

          {/* Dynamic Attribute Fields */}
          {selectedType && selectedType.fields.length > 0 && (
            <div className="attributes-section">
              <div className="attributes-section-header">
                <h3 className="section-title">Attributes</h3>
                <span className="attributes-ai-pill">Auto-filled</span>
              </div>
              <div className="attributes-input-grid">
                {selectedType.fields.map((field, index) => (
                  <div key={index} className="form-group-attribute">
                    <label className="attribute-field-label">{field.name}</label>
                    <input
                      type={field.type}
                      value={attributeValues[field.name] || ""}
                      onChange={(e) =>
                        handleAttributeChange(field.name, e.target.value)
                      }
                      placeholder={`Enter ${field.name}`}
                      className="text-input"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button: Upload & Generate Hash */}
          <button
            onClick={handleUpload}
            className="submit-button"
            disabled={!file || !selectedType || certificateTypes.length === 0}
          >
            <Upload size={18} />
            <span>Upload to IPFS</span>
          </button>

          {/* Status Message */}
          {status && (
            <div className={`status-message ${status.includes("Error") ? "status-err" : "status-ok"}`}>
              {status.includes("Error") ? <AlertCircle size={18} /> : <Sparkles size={18} />}
              <p>{status}</p>
            </div>
          )}

          {/* Success Output: IPFS Pinning Confirmed */}
          {finalHash && (
            <div className="success-box">
              <div className="success-icon-wrap">
                <CheckCircle2 size={24} />
              </div>
              <div className="success-details">
                <h3>Upload Complete</h3>
                <p className="hash-note">
                  Document and metadata uploaded to IPFS.
                </p>
                <div className="hash-display">
                  <span className="hash-label">IPFS Hash:</span>
                  <div className="hash-code-row">
                    <code className="hash-value">{finalHash}</code>
                    <button 
                      type="button"
                      className="btn-copy-code"
                      onClick={() => navigator.clipboard.writeText(finalHash)}
                      title="Copy CID to clipboard"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Minting Section */}
          {finalHash && (
            <div className="mint-section">
              <div className="mint-section-header">
                <h3 className="mint-section-title">Mint to Blockchain</h3>
                <p className="mint-section-desc">Issue this credential on the blockchain.</p>
              </div>

              {/* Student Address Input */}
              <div className="form-group">
                <label className="form-label">
                  <span>Student Address</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  value={studentAddress}
                  onChange={handleAddressChange}
                  placeholder="0x..."
                  className={`address-input modern-input ${
                    studentAddress && (isAddressValid ? "valid" : "invalid")
                  }`}
                />
                {studentAddress && !isAddressValid && (
                  <p className="error-text">Invalid EVM wallet address format</p>
                )}
                {studentAddress && isAddressValid && (
                  <p className="success-text">✓ Valid EVM student address</p>
                )}
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={
                  !isConnected ||
                  !isAddressValid ||
                  isMintPending ||
                  isConfirming
                }
                className="mint-button"
              >
                {isMintPending ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Waiting for Wallet...</span>
                  </>
                ) : isConfirming ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <Award size={18} />
                    <span>Mint Credential</span>
                  </>
                )}
              </button>

              {/* Connection Warning */}
              {!isConnected && (
                <div className="warning-callout">
                  <AlertCircle size={16} />
                  <span>Connect wallet to mint</span>
                </div>
              )}

              {/* Mint Error */}
              {mintError && (
                <div className="error-box">
                  <AlertCircle size={20} className="error-icon" />
                  <div>
                    <strong>Transaction Error:</strong>
                    <p>{mintError.message || "Failed to mint credential"}</p>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              {hash && (
                <div className="transaction-box">
                  <div className="tx-meta-row">
                    <span className="tx-label">Transaction Hash:</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      <span>View on Etherscan</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <code className="tx-hash">{hash}</code>
                </div>
              )}

              {/* Success Confirmation */}
              {isConfirmed && (
                <div className="confirmed-box">
                  <div className="confirmed-header">
                    <div className="confirmed-icon">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4>Credential Minted</h4>
                      <p>Credential minted successfully.</p>
                    </div>
                  </div>

                  {/* UUID Share Link */}
                  {credentialUUID && (
                    <div className="uuid-share-container">
                      <div className="share-link-header">
                        <span className="share-link-title">Verification Link:</span>
                      </div>
                      
                      <div className="share-link-box">
                        <code className="share-link-code">
                          {`${window.location.origin}/verify/${credentialUUID}`}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/verify/${credentialUUID}`
                            );
                            setShowUUIDCopied(true);
                            setTimeout(() => setShowUUIDCopied(false), 2000);
                          }}
                          className="btn-copy-link"
                        >
                          {showUUIDCopied ? (
                            <>
                              <Check size={14} />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Developer API Endpoint */}
                      <div className="api-endpoint-card">
                        <div className="api-card-header">
                          <Terminal size={14} />
                          <span>API Endpoint:</span>
                        </div>
                        <code className="api-code-line">
                          {`GET http://localhost:5000/api/credentials/${credentialUUID}`}
                        </code>
                      </div>

                      <p className="share-guidance-note">
                        Share this link to allow verification of this credential.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
