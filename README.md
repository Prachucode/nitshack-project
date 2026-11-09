# Student Credentials Platform

A blockchain-based credential issuance and verification platform built with React, Vite, Wagmi, and Polygon.

## Features

- 🎓 **Dynamic Certificate Types**: Create and manage custom certificate templates with flexible fields
- 🤖 **AI-Powered Form Filling**: Automatically extract data from PDF certificates using Google Gemini AI
- 📄 **IPFS Storage**: Decentralized storage of credentials and metadata via Pinata
- ⛓️ **Blockchain Minting**: Issue credentials as NFTs on Polygon Amoy testnet
- 🔐 **Wallet Integration**: Connect with MetaMask and other wallets via RainbowKit
- ✨ **Modern UI**: Beautiful gradient design with responsive layout

## Prerequisites

- Node.js 16+ and npm
- MetaMask or another Web3 wallet
- Pinata account for IPFS storage
- Google Gemini API key for AI parsing

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Pinata IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token_here

# Google Gemini AI Configuration (for PDF parsing)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting API Keys

1. **Pinata JWT**: 
   - Sign up at [Pinata Cloud](https://app.pinata.cloud/)
   - Go to API Keys section and create a new JWT token
   - Make sure it has pinning permissions

2. **Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## How It Works

### 1. Create Certificate Types
- Navigate to "Manage Types" to create custom certificate templates
- Define fields with different types (text, number, date)
- Pre-configured with "University Degree" template

### 2. Issue Credentials
- Upload a PDF certificate
- **AI automatically extracts** field values from the PDF (review and edit as needed)
- Select certificate type and fill in any missing details
- Upload to IPFS to get metadata hash
- Connect wallet and mint as NFT on blockchain

### 3. AI-Powered Parsing
When you upload a PDF:
1. **Text Extraction**: PDF.js extracts all text from the document
2. **AI Analysis**: Google Gemini AI analyzes the text and identifies field values
3. **Auto-Fill**: Form fields are automatically populated
4. **Manual Override**: You can edit any field before submitting

The AI acts as a **Copilot**, not an Autopilot - all fields remain editable!

## Technology Stack

- **Frontend**: React 18 + Vite
- **Blockchain**: Wagmi v3 + Viem + RainbowKit
- **Network**: Polygon Amoy Testnet
- **Storage**: IPFS via Pinata
- **AI**: Google Gemini 1.5 Flash
- **PDF Processing**: pdf.js-dist
- **Smart Contract**: ERC721-based CredentialRegistry

## Smart Contract

- **Address**: `0x710ea2b142bF87FD6330d0880F93d23C496d4E48`
- **Network**: Polygon Amoy (Testnet)
- **Function**: `issueCredential(address student, string ipfsHash)`

## Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── issuerForm.jsx  # Credential issuance form
│   └── CertificateTypes.jsx  # Certificate type management
├── utils/              # Utility functions
│   ├── pinata.js       # IPFS upload functions
│   ├── pdfToText.js    # PDF text extraction
│   ├── aiParser.js     # AI parsing logic
│   └── abi.json        # Smart contract ABI
├── config/             # Configuration files
│   ├── wagmi.js        # Wagmi blockchain config
│   └── contract.js     # Contract address and ABI
└── App.jsx             # Main app with routing
```

## Key Features Explained

### Dynamic Certificate Templates
- Stored in browser localStorage (can be upgraded to backend database)
- Supports text, number, and date field types
- Extensible for future field types

### NFT Metadata Standard
The platform follows OpenSea metadata standards:
```json
{
  "name": "University Degree - Student Credential",
  "description": "A verifiable credential...",
  "image": "ipfs://Qm...",
  "attributes": [
    { "trait_type": "Course", "value": "Computer Science" },
    { "trait_type": "GPA", "value": "3.8", "display_type": "number" }
  ]
}
```

## Troubleshooting

### AI Parsing Not Working
- Verify `VITE_GEMINI_API_KEY` is set correctly
- Check console for detailed error messages
- Ensure PDF contains readable text (not scanned images)
- Fields remain editable - you can always fill manually

### Wallet Connection Issues
- Make sure MetaMask is installed
- Switch to Polygon Amoy network in MetaMask
- Clear browser cache and reload

### IPFS Upload Failing
- Verify `VITE_PINATA_JWT` has correct permissions
- Check Pinata dashboard for API limits
- Ensure file size is within limits (typically 100MB)

## Future Enhancements

- [ ] Verification portal for students
- [ ] QR code generation for credentials
- [ ] Backend database for certificate types
- [ ] Multi-issuer support with authentication
- [ ] Credential revocation functionality
- [ ] Support for scanned PDF images (OCR)

## License

MIT
