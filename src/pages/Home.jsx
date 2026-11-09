import { Link } from 'react-router-dom';
import { 
  Award, 
  ShieldCheck, 
  FileCheck2, 
  GraduationCap, 
  ArrowRight
} from 'lucide-react';

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Student Credential Platform
        </h1>

        <p className="hero-subtitle">
          Issue, verify, and manage tamper-proof academic credentials on the blockchain
        </p>

        {/* Primary CTAs */}
        <div className="hero-cta-group">
          <Link to="/issue" className="btn-primary">
            <Award size={18} />
            <span>Issue Credential</span>
            <ArrowRight size={16} />
          </Link>

          <Link to="/verify" className="btn-secondary">
            <FileCheck2 size={18} />
            <span>Verify Credential</span>
          </Link>

          <Link to="/dashboard" className="btn-secondary">
            <GraduationCap size={18} />
            <span>My Credentials</span>
          </Link>
        </div>
      </section>

      {/* Core Features */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box cyan">
              <Award size={24} />
            </div>
            <h3>Issue Credentials</h3>
            <p>Upload student certificates, auto-extract details with AI, and mint them as permanent blockchain NFTs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box emerald">
              <ShieldCheck size={24} />
            </div>
            <h3>Secure & Immutable</h3>
            <p>Documents and metadata are pinned to IPFS and secured on smart contracts for tamper-proof records.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box purple">
              <FileCheck2 size={24} />
            </div>
            <h3>Instant Verification</h3>
            <p>Verify any credential in seconds via token ID, UUID, or selective privacy share links.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
