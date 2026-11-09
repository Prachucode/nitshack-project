import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import IssuerForm from "./pages/issuerForm.jsx";
import Home from "./pages/Home.jsx";
import Verify from "./pages/Verify.jsx";
import CertificateTypes from "./pages/CertificateTypes.jsx";
import RegisterIssuer from "./pages/RegisterIssuer.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import IssuerDashboard from "./pages/IssuerDashboard.jsx";
import { 
  ShieldCheck, 
  GraduationCap, 
  Award, 
  FileCheck2, 
  Layers, 
  UserCheck, 
  Menu, 
  X
} from "lucide-react";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/issue", label: "Issue Credential", icon: Award },
    { to: "/verify", label: "Verify", icon: FileCheck2 },
    { to: "/dashboard", label: "My Credentials", icon: GraduationCap },
    { to: "/issuer-dashboard", label: "Issuer Dashboard", icon: ShieldCheck },
    { to: "/register", label: "Register Issuer", icon: UserCheck },
    { to: "/types", label: "Manage Types", icon: Layers },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <header className="navbar-wrapper">
          <nav className="navbar">
            <div className="nav-content">
              {/* Brand Logo */}
              <Link to="/" className="brand-logo" onClick={closeMenu}>
                <div className="logo-symbol">
                  <ShieldCheck size={20} />
                </div>
                <span className="logo-primary">Credora</span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="nav-links">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    end={item.to === "/"}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Mobile Menu Toggle */}
              <div className="nav-actions">
                <button 
                  className="mobile-toggle-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="mobile-menu-overlay" onClick={closeMenu}>
                <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="mobile-menu-header">
                    <span className="mobile-menu-title">Menu</span>
                    <button className="mobile-close-btn" onClick={closeMenu}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="mobile-nav-list">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `mobile-nav-link ${isActive ? "active" : ""}`
                        }
                        end={item.to === "/"}
                        onClick={closeMenu}
                      >
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </header>

        {/* Main Route Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterIssuer />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/issuer-dashboard" element={<IssuerDashboard />} />
            <Route path="/issue" element={<IssuerForm />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/types" element={<CertificateTypes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
