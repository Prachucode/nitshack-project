import React, { useState } from 'react';
import { 
  Lock, 
  Globe, 
  Check, 
  Copy, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import './PrivacyModal.css';

function PrivacyModal({ credential, onClose }) {
    const [isPrivate, setIsPrivate] = useState(true);
    const [selectedFields, setSelectedFields] = useState(() => {
        // Initialize with all fields selected
        if (credential?.metadata?.attributes) {
            return credential.metadata.attributes.map(attr => attr.trait_type || attr.key);
        }
        return [];
    });
    const [linkGenerated, setLinkGenerated] = useState(false);

    const handleToggleField = (fieldName) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldName)) {
                return prev.filter(f => f !== fieldName);
            } else {
                return [...prev, fieldName];
            }
        });
    };

    const handleGenerateLink = () => {
        let shareableUrl;

        if (isPrivate) {
            // Private mode: encode ID and selected fields together
            const payload = {
                id: credential.id,
                rules: selectedFields
            };
            // Encode payload to Base64
            const encodedPayload = btoa(JSON.stringify(payload));
            // Use the encoded payload as the ID parameter
            shareableUrl = `${window.location.origin}/verify/${encodedPayload}`;
        } else {
            // Public mode: standard URL
            shareableUrl = `${window.location.origin}/verify/${credential.id}`;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(shareableUrl).then(() => {
            setLinkGenerated(true);
            setTimeout(() => setLinkGenerated(false), 3000);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            prompt('Copy link manually:', shareableUrl);
        });
    };

    const attributes = credential?.metadata?.attributes || [];

    return (
        <div className="privacy-modal-overlay" onClick={onClose}>
            <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-title-wrap">
                        <div className="modal-header-icon">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2>Selective Privacy Share</h2>
                            <span className="modal-subtitle">Generate cryptographic verification link</span>
                        </div>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Public/Private Toggle Bar */}
                    <div className="sharing-mode-toggle-bar">
                        <div className="toggle-mode-info">
                            {isPrivate ? (
                                <div className="mode-badge private">
                                    <Lock size={15} />
                                    <span>Private Selective Mode</span>
                                </div>
                            ) : (
                                <div className="mode-badge public">
                                    <Globe size={15} />
                                    <span>Public Mode</span>
                                </div>
                            )}
                            <p className="mode-explain">
                                {isPrivate
                                    ? "Only selected attributes will be exposed to the verifier. Original PDF document will remain hidden."
                                    : "All credential details and full document preview will be publicly accessible."}
                            </p>
                        </div>

                        <label className="switch-control" title="Toggle Private / Public Mode">
                            <input
                                type="checkbox"
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(!isPrivate)}
                            />
                            <span className="switch-slider"></span>
                        </label>
                    </div>

                    {/* Attribute Selection (only for private mode) */}
                    {isPrivate && attributes.length > 0 && (
                        <div className="attributes-selection">
                            <div className="selection-header">
                                <span className="selection-title">Visible Attributes ({selectedFields.length}/{attributes.length})</span>
                                <div className="selection-quick-actions">
                                    <button 
                                        type="button" 
                                        className="text-btn"
                                        onClick={() => setSelectedFields(attributes.map(a => a.trait_type || a.key))}
                                    >
                                        Select All
                                    </button>
                                    <span className="sep">•</span>
                                    <button 
                                        type="button" 
                                        className="text-btn"
                                        onClick={() => setSelectedFields([])}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="checkbox-list">
                                {attributes.map((attr, index) => {
                                    const fieldName = attr.trait_type || attr.key;
                                    const isChecked = selectedFields.includes(fieldName);

                                    return (
                                        <label 
                                            key={index} 
                                            className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleField(fieldName)}
                                                className="hidden-checkbox"
                                            />
                                            <div className="custom-check">
                                                {isChecked && <Check size={13} strokeWidth={3} />}
                                            </div>
                                            <div className="checkbox-label-content">
                                                <span className="field-name-text">{fieldName}</span>
                                                <span className="field-val-preview">{attr.value}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Warning for no fields selected */}
                    {isPrivate && selectedFields.length === 0 && (
                        <div className="privacy-warning-box">
                            <AlertCircle size={18} />
                            <span>No attributes selected. Verifiers will only see basic on-chain validity and token ID.</span>
                        </div>
                    )}

                    {linkGenerated && (
                        <div className="link-copied-banner">
                            <CheckCircle2 size={18} />
                            <span>Shareable link copied to clipboard!</span>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="cancel-button" onClick={onClose}>
                        Close
                    </button>
                    <button
                        className="generate-button"
                        onClick={handleGenerateLink}
                    >
                        {linkGenerated ? (
                            <>
                                <Check size={16} />
                                <span>Copied to Clipboard!</span>
                            </>
                        ) : (
                            <>
                                <Link2 size={16} />
                                <span>Generate & Copy Link</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrivacyModal;
