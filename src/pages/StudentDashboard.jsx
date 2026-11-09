import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { config } from '../config/wagmi';
import { fetchMetadata } from '../utils/ipfsHelper';
import CONTRACT_ABI from '../utils/abi.json';
import PrivacyModal from '../components/PrivacyModal';
import {
    GraduationCap,
    Share2,
    Calendar,
    ShieldCheck,
    FileText,
    FileCheck2,
    ExternalLink,
    Wallet,
    Sparkles,
    Database,
    Tag
} from 'lucide-react';
import './StudentDashboard.css';

const CREDENTIAL_REGISTRY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function StudentDashboard() {
    const { address, isConnected } = useAccount();

    const [myCredentials, setMyCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Read the total credential count
    const { data: credentialCount } = useReadContract({
        address: CREDENTIAL_REGISTRY_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'credentialCount',
    });

    // Fetch credentials when wallet connects or count changes
    useEffect(() => {
        if (!isConnected || !address || !credentialCount) {
            setMyCredentials([]);
            return;
        }

        fetchCredentials();
    }, [isConnected, address, credentialCount]);

    const fetchCredentials = async () => {
        setLoading(true);
        setError(null);
        const credentials = [];

        try {
            const count = Number(credentialCount);

            // Loop through all credentials (backwards from count to 1)
            for (let i = count; i >= 1; i--) {
                try {
                    // Fetch credential struct from contract
                    const credential = await readContract(config, {
                        address: CREDENTIAL_REGISTRY_ADDRESS,
                        abi: CONTRACT_ABI,
                        functionName: 'credentials',
                        args: [BigInt(i)],
                    });

                    // The actual contract struct order (from abi.json):
                    // [0] = id (uint256)
                    // [1] = ipfsHash (string)
                    // [2] = student (address)
                    // [3] = issuer (address)
                    // [4] = issueDate (uint256)
                    // [5] = revoked (bool)
                    const id = credential[0];
                    const ipfsHash = credential[1];
                    const student = credential[2];
                    const issuer = credential[3];
                    const issueDate = credential[4];
                    const revoked = credential[5];

                    // Filter: only include if this credential belongs to the current user and is NOT revoked
                    if (student.toLowerCase() === address.toLowerCase() && !revoked) {
                        // Fetch metadata from IPFS
                        try {
                            const metadata = await fetchMetadata(ipfsHash);

                            credentials.push({
                                id: Number(id),
                                student,
                                issuer,
                                ipfsHash,
                                timestamp: Number(issueDate),
                                isValid: !revoked,
                                metadata,
                            });
                        } catch (metadataError) {
                            console.error(`Failed to fetch metadata for credential ${i}:`, metadataError);
                            // Still add the credential even if metadata fails
                            credentials.push({
                                id: Number(id),
                                student,
                                issuer,
                                ipfsHash,
                                timestamp: Number(issueDate),
                                isValid: !revoked,
                                metadata: null,
                            });
                        }
                    }
                } catch (credError) {
                    console.error(`Error fetching credential ${i}:`, credError);
                }
            }

            setMyCredentials(credentials);
        } catch (err) {
            console.error('Error fetching credentials:', err);
            setError('Failed to load credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <div className="header-branding">
                    <div className="header-icon-box">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <div className="header-badge-pill">
                            <Sparkles size={13} />
                            <span>STUDENT PORTFOLIO</span>
                        </div>
                        <h1 className="header-title">My Credentials</h1>
                    </div>
                </div>
                <div className="header-wallet-wrap">
                    <ConnectButton />
                </div>
            </header>

            <main className="dashboard-content">
                {!isConnected ? (
                    <div className="connect-prompt">
                        <div className="empty-prompt-icon">
                            <Wallet size={48} />
                        </div>
                        <h3>Connect Your Web3 Wallet</h3>
                        <p>Connect the wallet address where your university or institution issued your credentials to inspect and share them.</p>
                        <div className="prompt-connect-btn">
                            <ConnectButton />
                        </div>
                    </div>
                ) : loading ? (
                    <div className="loading">
                        <div className="dashboard-spinner"></div>
                        <p>Querying Ethereum & IPFS for your credentials...</p>
                    </div>
                ) : error ? (
                    <div className="error">
                        <p>{error}</p>
                        <button onClick={fetchCredentials} className="retry-btn">Try Again</button>
                    </div>
                ) : myCredentials.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-prompt-icon">
                            <FileText size={48} />
                        </div>
                        <h3>No Credentials Found</h3>
                        <p>Your connected wallet does not have any active credentials issued yet.</p>
                        <span className="empty-hint">Make sure you are connected with the recipient student address.</span>
                    </div>
                ) : (
                    <div className="student-credentials-container">
                        <div className="credentials-toolbar">
                            <div className="toolbar-count">
                                <span className="active-dot"></span>
                                <span><strong>{myCredentials.length}</strong> Verified {myCredentials.length === 1 ? 'Credential' : 'Credentials'}</span>
                            </div>
                        </div>

                        <div className="credentials-grid">
                            {myCredentials.map((cred) => (
                                <CredentialCard key={cred.id} credential={cred} formatDate={formatDate} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function CredentialCard({ credential, formatDate }) {
    const { metadata, timestamp, ipfsHash, id } = credential;
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Fetch PDF when component mounts if metadata.image exists
    useEffect(() => {
        const loadPDF = async () => {
            if (metadata?.image) {
                setLoadingPdf(true);
                try {
                    const { fetchPDFBlob } = await import('../utils/ipfsHelper');
                    const url = await fetchPDFBlob(metadata.image);
                    setPdfUrl(url);
                } catch (error) {
                    console.error('Error loading PDF:', error);
                } finally {
                    setLoadingPdf(false);
                }
            }
        };

        loadPDF();

        // Cleanup blob URL when component unmounts
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [metadata?.image]);

    return (
        <>
            <div className="credential-card">
                {/* PDF Document Preview Box */}
                {metadata?.image && (
                    <div className="credential-pdf-preview">
                        {loadingPdf ? (
                            <div className="pdf-loading">
                                <span className="pdf-spinner"></span>
                                <span>Decrypting & Loading PDF...</span>
                            </div>
                        ) : pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title={metadata.name || 'Credential PDF'}
                                className="pdf-iframe"
                            />
                        ) : (
                            <div className="pdf-error">
                                <FileText size={32} />
                                <span>Preview unavailable</span>
                            </div>
                        )}
                        <div className="preview-badge">Document Preview</div>
                    </div>
                )}

                <div className="credential-info">
                    <div className="credential-top-bar">
                        <span className="token-id-pill">Token #{id}</span>
                        <span className="valid-pill">
                            <span className="pill-dot"></span>
                            <span>On-Chain Verified</span>
                        </span>
                    </div>

                    <h3 className="credential-name">
                        {metadata?.name || 'Unnamed Credential'}
                    </h3>

                    <div className="credential-meta-row">
                        <Calendar size={14} className="meta-icon" />
                        <span>Issued {formatDate(timestamp)}</span>
                    </div>

                    {metadata?.description && (
                        <p className="credential-description">{metadata.description}</p>
                    )}

                    {metadata?.attributes && metadata.attributes.length > 0 && (
                        <div className="credential-attributes">
                            <div className="attributes-header">
                                <Tag size={13} />
                                <span>Attributes ({metadata.attributes.length})</span>
                            </div>
                            <div className="attributes-list">
                                {metadata.attributes.map((attr, index) => (
                                    <div key={index} className="attribute-badge-item">
                                        <span className="attr-type">{attr.trait_type || attr.key}:</span>
                                        <span className="attr-value">{attr.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="credential-hash-bar">
                        <Database size={13} className="hash-icon" />
                        <span className="hash-text">IPFS: {ipfsHash.substring(0, 16)}...{ipfsHash.substring(ipfsHash.length - 6)}</span>
                    </div>

                    {/* Share Action Button */}
                    <button
                        className="share-button"
                        onClick={() => setShowModal(true)}
                    >
                        <Share2 size={16} />
                        <span>Share with Selective Privacy</span>
                    </button>
                </div>
            </div>

            {/* Privacy Modal */}
            {showModal && (
                <PrivacyModal
                    credential={credential}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}

export default StudentDashboard;
