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
          Credora
        </h1>

        <p className="hero-subtitle">
          Decentralized credentials platform. Issue, verify, and manage on-chain records.
        </p>

        {/* Primary CTAs */}
        <div className="hero-cta-group">
          <Link to="/issue" className="btn-primary">
            <Award size={18} />
            <span>Issue</span>
            <ArrowRight size={16} />
          </Link>

          <Link to="/verify" className="btn-secondary">
            <FileCheck2 size={18} />
            <span>Verify</span>
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
              <Award size={22} />
            </div>
            <h3>Issuance</h3>
            <p>Upload documents, extract fields, and mint credentials on-chain.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box emerald">
              <ShieldCheck size={22} />
            </div>
            <h3>Verification</h3>
            <p>Instant decentralized validation against smart contracts and IPFS.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box purple">
              <FileCheck2 size={22} />
            </div>
            <h3>Privacy Control</h3>
            <p>Share selective attributes securely with custom verification links.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
