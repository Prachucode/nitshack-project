import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
import abi from "../utils/abi.json";
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ArrowRight,
  Clock,
  Wallet
} from "lucide-react";

const CONTRACT_ADDRESS = "0xC8e4689704E74e62C59D7Fc20C74f7D0803157e9";

export default function RegisterIssuer() {
  const { address, isConnected } = useAccount();
  const [instituteName, setInstituteName] = useState("");
  const [status, setStatus] = useState("");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const {
    data: hash,
    writeContract,
    isPending: isSubmitting,
    error: submitError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!instituteName.trim()) {
      alert("Please enter your institute name!");
      return;
    }

    setStatus("Submitting application to blockchain registry...");

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: "requestAuthorization",
        args: [instituteName.trim()],
        gas: 300000n, // Set reasonable gas limit below network cap
      });
    } catch (error) {
      console.error("Error submitting application:", error);

      // Provide user-friendly error messages
      let errorMessage = "";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected in wallet.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction gas fees.";
      } else if (error.message?.includes("Already registered")) {
        errorMessage = "This address has already submitted an application.";
      } else {
        errorMessage = error.shortMessage || error.message || "Transaction failed";
      }

      setStatus(`Error: ${errorMessage}`);
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && !applicationSubmitted) {
    setApplicationSubmitted(true);
    setStatus("");
    setInstituteName("");
  }

  return (
    <div className="register-issuer-page">
      <div className="register-issuer-card">
        {/* Header */}
        <div className="register-header">
          <div className="register-icon-badge">
            <Building2 size={32} />
          </div>
          <h1 className="register-title">Register as Verified Issuer</h1>
          <p className="register-subtitle">
            Apply to become an authorized credential issuer
          </p>
        </div>

        {/* Success Confirmation View */}
        {applicationSubmitted && (
          <div className="register-success-view">
            <div className="success-badge-icon">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="success-headline">Application Submitted!</h2>
            <p className="success-body">
              Your registration is pending approval. Once confirmed, you can issue credentials.
            </p>

            {hash && (
              <div className="tx-hash-badge">
                <span className="tx-label">Transaction Hash:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  <span>{hash.substring(0, 10)}...{hash.substring(hash.length - 8)}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="success-actions">
              <button
                onClick={() => setApplicationSubmitted(false)}
                className="btn-outline-sm"
              >
                Submit Another Application
              </button>
              <Link to="/issuer-dashboard" className="btn-primary-sm">
                Go to Issuer Hub
              </Link>
            </div>
          </div>
        )}

        {/* Application Form */}
        {!applicationSubmitted && (
          <div className="register-form-wrapper">
            {/* Wallet Connection Section */}
            <div className="wallet-onboarding-panel">
              <div className="wallet-status-row">
                <div className="wallet-indicator">
                  <Wallet size={18} className={isConnected ? "text-emerald" : "text-amber"} />
                  <span>
                    {isConnected
                      ? `Connected: ${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`
                      : "Connect your wallet to continue"}
                  </span>
                </div>
              </div>
              <div className="wallet-button-container">
                <ConnectButton />
              </div>
            </div>

            {/* Form Fields */}
            {isConnected ? (
              <form onSubmit={handleSubmit} className="institutional-form">
                <div className="form-group">
                  <label htmlFor="instituteName" className="form-label">
                    <span>Institution Name</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Building2 size={18} className="field-icon" />
                    <input
                      type="text"
                      id="instituteName"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      placeholder="e.g. Stanford University, MIT"
                      required
                      disabled={isSubmitting || isConfirming}
                      className="text-input modern-input"
                    />
                  </div>
                  <span className="field-hint">
                    This name will appear on all credentials you issue.
                  </span>
                </div>

                {/* Status Banners */}
                {status && (
                  <div className={`status-banner ${status.includes("Error") ? "error" : "info"}`}>
                    {status.includes("Error") ? <AlertCircle size={18} /> : <Clock size={18} />}
                    <span>{status}</span>
                  </div>
                )}

                {submitError && (
                  <div className="status-banner error">
                    <AlertCircle size={18} />
                    <span>Error: {submitError.message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isConfirming || !instituteName.trim()}
                  className="submit-registration-btn"
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Submitting...</span>
                    </>
                  ) : isConfirming ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Waiting for Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>

                {/* Institutional Note */}
                <div className="institutional-notice">
                  <ShieldCheck size={18} className="notice-icon" />
                  <div className="notice-content">
                    <p>
                      Applications are reviewed by administrators. Verification typically takes 24-48 hours.
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <div className="wallet-required-prompt">
                <AlertCircle size={24} className="prompt-icon" />
                <p>Please connect your wallet to continue.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="register-footer">
          <span>Already authorized?</span>{" "}
          <Link to="/issuer-dashboard" className="footer-link">
            <span>Access Issuer Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
