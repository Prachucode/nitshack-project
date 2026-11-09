# Credora

A decentralized credential issuance, verification, and privacy-preserving management platform built with React, Vite, Wagmi, RainbowKit, Ethereum/Sepolia, and IPFS.

## Overview

**Credora** provides a streamlined, transparent ecosystem for issuing verifiable credentials on-chain, inspecting credential integrity, and selectively sharing verifiable attributes without compromising full document privacy.

## Features

- 🎓 **Template Management**: Define customizable certificate schemas with structured data types (text, number, date).
- 🤖 **AI-Assisted Ingestion**: Automatically parse uploaded PDF documents using Google Gemini AI to pre-fill attribute fields.
- 📦 **Decentralized Storage**: Secure, permanent document and metadata pinning to IPFS via Pinata.
- ⛓️ **Smart Contract Registry**: Mint verifiable credentials directly to Ethereum Sepolia.
- 🔍 **Instant Verification**: Check cryptographic validity and issuer authorization status via Token ID, UUID, or privacy tokens.
- 🔒 **Selective Privacy Sharing**: Generate privacy-preserving verification links allowing students to disclose only chosen attributes while keeping the original document private.
- 🎨 **Minimal & Modern UI**: Floating capsule dock navbar, sculpted radial-glow cards, and zero footer clutter.

## Prerequisites

- Node.js 18+ and pnpm / npm
- MetaMask or any Web3 wallet
- Pinata account with API access
- Google Gemini API key

## Environment Setup

Create a `.env` file in the root directory:

```env
# Pinata IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token_here

# Google Gemini AI Configuration (for PDF parsing)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Smart Contract Address
VITE_CONTRACT_ADDRESS=0xC8e4689704E74e62C59D7Fc20C74f7D0803157e9
```

## Installation & Running

```bash
# Install dependencies
pnpm install

# Start development server
npm run dev

# Build for production
npx vite build
```

## How It Works

1. **Issuer Registration**: Academic or institutional entities submit an on-chain registration request.
2. **Template Creation**: Define fields (e.g., Major, GPA, Graduation Date) under "Manage Types".
3. **Document Ingestion & AI Extraction**: Upload a credential PDF; Gemini AI reads and auto-populates template fields.
4. **IPFS Pinning & Minting**: Files are pinned to IPFS, and the credential metadata is minted on Ethereum Sepolia.
5. **Student & Issuer Hubs**: Students view and manage their credentials, while issuers monitor total issuances and manage revocations.
6. **Privacy Sharing & Public Verification**: Students can share either full verification or selective privacy links where only approved attributes are visible.

## Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons
- **Web3**: Wagmi, Viem, RainbowKit
- **Network**: Ethereum Sepolia Testnet
- **Storage**: IPFS (Pinata)
- **AI Engine**: Google Gemini 1.5 Flash
- **Document Processing**: PDF.js (`pdf.js-dist`)

## Project Structure

```
src/
├── components/
│   └── PrivacyModal.jsx      # Selective privacy link generator
├── pages/
│   ├── Home.jsx              # Credora landing page
│   ├── issuerForm.jsx        # Issuance and minting flow
│   ├── Verify.jsx            # Credential inspection and verification
│   ├── StudentDashboard.jsx  # Student credential management & viewing
│   ├── IssuerDashboard.jsx   # Issuer dashboard with metrics & revoke control
│   ├── RegisterIssuer.jsx    # Institutional registration interface
│   └── CertificateTypes.jsx  # Schema & template manager
├── services/                 # Backend API services
├── utils/                    # ABI, IPFS helpers, and AI parser
├── config/                   # Wagmi provider setup
├── App.jsx                   # Main application router and floating dock navbar
└── App.css                   # Global theme and UI styling
```

## License

MIT
