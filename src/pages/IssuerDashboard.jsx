import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { config } from '../config/wagmi';
import { fetchMetadata } from '../utils/ipfsHelper';
import CONTRACT_ABI from '../utils/abi.json';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  User, 
  Trash2, 
  Plus, 
  Layers, 
  Sparkles,
  Wallet,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import './IssuerDashboard.css';

const CREDENTIAL_REGISTRY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function IssuerDashboard() {
    const { address, isConnected } = useAccount();

    const [issuedCredentials, setIssuedCredentials] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalIssued, setTotalIssued] = useState(0);
    const [revokingId, setRevokingId] = useState(null);

    // Read the total credential count
    const { data: credentialCount } = useReadContract({
        address: CREDENTIAL_REGISTRY_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'credentialCount',
    });

    // Contract write hook for revoking credentials
    const { data: revokeHash, writeContract: revokeCredential } = useWriteContract();

    // Wait for revoke transaction receipt
    const { isLoading: isRevoking, isSuccess: revokeSuccess } = useWaitForTransactionReceipt({
        hash: revokeHash,
    });

    // Fetch credentials when wallet connects or count changes
    useEffect(() => {
        if (!isConnected || !address || !credentialCount) {
            setIssuedCredentials({});
            setTotalIssued(0);
            return;
        }

        fetchIssuedCredentials();
    }, [isConnected, address, credentialCount]);

    // Refresh credentials after successful revocation
    useEffect(() => {
        if (revokeSuccess) {
            setRevokingId(null);
            fetchIssuedCredentials();
        }
    }, [revokeSuccess]);

    const fetchIssuedCredentials = async () => {
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

                    // Filter: only include if this credential was issued BY the current user
                    if (issuer.toLowerCase() === address.toLowerCase()) {
                        // Fetch metadata from IPFS to get certificate type and name
                        let metadata = null;
                        try {
                            metadata = await fetchMetadata(ipfsHash);
                        } catch (metadataError) {
                            console.error(`Failed to fetch metadata for credential ${i}:`, metadataError);
                        }

                        credentials.push({
                            id: Number(id),
                            student,
                            issuer,
                            ipfsHash,
                            timestamp: Number(issueDate),
                            isValid: !revoked,
                            metadata,
                            type: metadata?.certificateType || 'Uncategorized'
                        });
                    }
                } catch (credError) {
                    console.error(`Error fetching credential ${i}:`, credError);
                }
            }

            // Group by certificate type
            const grouped = credentials.reduce((acc, cred) => {
                const type = cred.type.replace(/_/g, ' '); // Format type string
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(cred);
                return acc;
            }, {});

            setIssuedCredentials(grouped);
            setTotalIssued(credentials.length);
        } catch (err) {
            console.error('Error fetching credentials:', err);
            setError('Failed to load credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (credentialId) => {
        try {
            setRevokingId(credentialId);
            revokeCredential({
                address: CREDENTIAL_REGISTRY_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'revokeCredential',
                args: [BigInt(credentialId)],
            });
        } catch (err) {
            console.error('Error revoking credential:', err);
            setRevokingId(null);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatAddress = (addr) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="issuer-dashboard">
            <header className="dashboard-header">
                <div className="header-branding">
                    <div className="header-icon-box">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <div className="header-badge-pill">
                            <Sparkles size={13} />
                            <span>INSTITUTIONAL CONTROL</span>
                        </div>
                        <h1 className="header-title">
                            Issuer Hub
                            {totalIssued > 0 && <span className="category-count-badge">{totalIssued} Issued</span>}
                        </h1>
                    </div>
                </div>

                <div className="header-actions-group">
                    <Link to="/issue" className="btn-mint-shortcut">
                        <Plus size={16} />
                        <span>Issue New Credential</span>
                    </Link>
                    <ConnectButton />
                </div>
            </header>

            <main className="dashboard-content">
                {!isConnected ? (
                    <div className="empty-state">
                        <div className="empty-prompt-icon">
                            <Wallet size={48} />
                        </div>
                        <h3>Connect Authority Wallet</h3>
                        <p>Connect your verified institutional wallet to monitor, inspect, and manage issued credentials on the blockchain.</p>
                        <div className="prompt-connect-btn">
                            <ConnectButton />
                        </div>
                    </div>
                ) : loading ? (
                    <div className="loading-state">
                        <div className="dashboard-spinner"></div>
                        <p>Scanning smart contracts & IPFS for your issued credentials...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertTriangle size={36} className="text-rose" />
                        <p>{error}</p>
                        <button className="retry-button" onClick={fetchIssuedCredentials}>
                            <RefreshCw size={16} />
                            <span>Try Again</span>
                        </button>
                    </div>
                ) : Object.keys(issuedCredentials).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-prompt-icon">
                            <Award size={48} />
                        </div>
                        <h3>No Credentials Issued Yet</h3>
                        <p>You haven't minted any credentials to students using this institutional wallet address.</p>
                        <Link to="/issue" className="btn-primary mt-4">
                            <Plus size={16} />
                            <span>Issue Your First Credential</span>
                        </Link>
                    </div>
                ) : (
                    <div className="categories-container">
                        {/* Summary Bar */}
                        <div className="issuer-stats-strip">
                            <div className="stat-pill">
                                <span className="stat-pill-label">Total Issued:</span>
                                <span className="stat-pill-val">{totalIssued}</span>
                            </div>
                            <div className="stat-pill">
                                <span className="stat-pill-label">Active Schema Categories:</span>
                                <span className="stat-pill-val">{Object.keys(issuedCredentials).length}</span>
                            </div>
                            <div className="stat-pill">
                                <span className="stat-pill-label">Connected Authority:</span>
                                <span className="stat-pill-mono">{formatAddress(address)}</span>
                            </div>
                        </div>

                        {Object.entries(issuedCredentials).map(([type, creds]) => (
                            <div key={type} className="category-section">
                                <div className="category-header">
                                    <div className="category-title">
                                        <Layers size={18} className="category-icon" />
                                        <span>{type}</span>
                                        <span className="category-count">{creds.length}</span>
                                    </div>
                                </div>

                                <div className="credentials-grid">
                                    {creds.map((cred) => (
                                        <div key={cred.id} className="compact-card">
                                            <div className="card-header">
                                                <h3 className="student-name">
                                                    {cred.metadata?.name || 'Unnamed Credential'}
                                                </h3>
                                                <span className={`status-indicator ${cred.isValid ? 'status-valid' : 'status-revoked'}`}>
                                                    <span className="status-dot"></span>
                                                    {cred.isValid ? 'Valid' : 'Revoked'}
                                                </span>
                                            </div>

                                            <div className="card-body">
                                                <div className="info-row">
                                                    <span className="info-label">Token ID</span>
                                                    <span className="info-value credential-id">#{cred.id}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Date Minted</span>
                                                    <span className="info-value">{formatDate(cred.timestamp)}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Student Recipient</span>
                                                    <span className="info-value address-value" title={cred.student}>
                                                        {formatAddress(cred.student)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <Link to={`/verify/${cred.id}`} className="view-btn">
                                                    <span>View Details</span>
                                                    <ArrowRight size={14} />
                                                </Link>
                                                {cred.isValid && (
                                                    <button
                                                        className="revoke-btn"
                                                        onClick={() => handleRevoke(cred.id)}
                                                        disabled={isRevoking && revokingId === cred.id}
                                                        title="Revoke this credential on the blockchain"
                                                    >
                                                        {isRevoking && revokingId === cred.id ? (
                                                            <span>Revoking...</span>
                                                        ) : (
                                                            <>
                                                                <Trash2 size={13} />
                                                                <span>Revoke</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default IssuerDashboard;
