# AI-Powered PDF Parsing Feature Guide

## Overview

The Student Credentials Platform now includes **AI-powered automatic form filling** using Google Gemini AI. When you upload a PDF certificate, the AI automatically extracts relevant information and pre-fills the form fields.

## How It Works

### Step-by-Step Process

1. **Select Certificate Type**
   - Choose a certificate template (e.g., "University Degree")
   - This tells the AI which fields to look for

2. **Upload PDF**
   - Click "Choose a file..." and select your PDF certificate
   - You'll see: "✨ AI is reading the document..."
   - Processing typically takes 2-4 seconds

3. **AI Analysis**
   - PDF text is extracted using PDF.js
   - Google Gemini AI analyzes the text
   - AI identifies values for each field in your template

4. **Review & Edit**
   - Form fields are automatically filled
   - Green checkmark appears: "✅ AI successfully pre-filled the form!"
   - **All fields remain editable** - review and correct as needed

5. **Continue Normal Flow**
   - Upload to IPFS
   - Mint to blockchain

## User Experience Features

### Loading State
- **Visual Indicator**: Animated spinner with message
- **Disabled Input**: File input is disabled during processing
- **Status Updates**: Clear messages about what's happening

### Success Scenarios
- **Full Match**: "✅ AI successfully pre-filled the form! Please review and edit if needed."
- **Partial Match**: AI fills what it finds, leaves others empty
- **No Match**: "⚠️ AI could not extract data. Please fill the form manually."

### Error Handling
- **API Errors**: Clear error message displayed, form remains editable
- **Invalid PDFs**: Validates file type before processing
- **Network Issues**: Graceful fallback to manual entry

## Technical Details

### Dependencies Installed
```bash
npm install pdfjs-dist @google/generative-ai --legacy-peer-deps
```

### New Files Created

1. **`src/utils/pdfToText.js`**
   - Extracts raw text from PDF using PDF.js
   - Handles multi-page documents
   - Returns concatenated text string

2. **`src/utils/aiParser.js`**
   - Sends text + field definitions to Gemini AI
   - Uses `gemini-1.5-flash` model for speed
   - Returns structured JSON with field values
   - Handles errors gracefully

3. **Updated `src/pages/issuerForm.jsx`**
   - New `handleFileChange` function for AI processing
   - Loading states: `isAiProcessing`, `aiError`
   - Auto-fills `attributeValues` state

4. **Updated `src/App.css`**
   - Loading spinner animation
   - AI status message styling
   - Error message styling

### Environment Variable Required

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your key**: https://makersuite.google.com/app/apikey

## AI Prompt Strategy

The AI receives:
- Full PDF text
- List of field names and types
- Clear instructions to return JSON
- Guidance to use `null` for missing values

**System Prompt Template**:
```
You are a data extraction assistant. Extract information from a certificate document.

CERTIFICATE TEXT:
[Full PDF text here]

FIELDS TO EXTRACT:
- "Course" (type: text)
- "GPA" (type: number)
- "Completion Date" (type: date)

INSTRUCTIONS:
1. Extract values exactly as written
2. Use null if not found
3. Format dates as YYYY-MM-DD
4. Return ONLY valid JSON
```

## Configuration Details

### Gemini AI Settings
- **Model**: `gemini-1.5-flash` (fast, cost-effective)
- **Temperature**: 0.1 (consistent extraction)
- **Top P**: 0.8
- **Top K**: 40

### PDF.js Setup
- Worker loaded from CDN
- Processes all pages sequentially
- Extracts text items with spacing

## Testing the Feature

### Test Scenario 1: Perfect Match
1. Create a PDF with clear field labels
2. Upload and watch AI extract all fields
3. Verify values are correct
4. Edit any field if needed

### Test Scenario 2: Missing Data
1. Upload PDF missing some fields
2. AI fills available fields
3. Manually enter missing data
4. Continue with upload

### Test Scenario 3: API Error
1. Use invalid API key
2. Upload PDF
3. See error message
4. All fields remain editable for manual entry

### Test Scenario 4: No Gemini Key
1. Don't set `VITE_GEMINI_API_KEY`
2. Upload PDF
3. Error displayed immediately
4. Form remains functional

## Performance Metrics

- **PDF Extraction**: < 1 second (client-side)
- **AI Processing**: 2-4 seconds (API call)
- **Total Time**: 3-5 seconds for full auto-fill
- **Fallback**: Instant (manual entry always available)

## Best Practices for Issuers

1. **Review AI Output**: Always verify extracted data
2. **Consistent PDFs**: Use standardized certificate formats for best results
3. **Clear Labels**: PDFs with clear field labels work best
4. **Backup Plan**: If AI struggles, manual entry is fast and easy

## Troubleshooting

### "AI parsing failed" Error
- **Check**: API key is set correctly in `.env`
- **Check**: Restart dev server after adding key
- **Check**: Internet connection is stable
- **Fallback**: Fill form manually

### AI Extracts Wrong Values
- **Cause**: PDF formatting or unclear labels
- **Solution**: Edit the incorrect fields manually
- **Prevention**: Use standardized certificate templates

### Processing Takes Too Long
- **Normal**: 2-4 seconds is expected
- **Check**: Network connection
- **Alternative**: Cancel and fill manually if urgent

### PDF Not Extracting Text
- **Cause**: PDF might be scanned image (no text layer)
- **Solution**: Fill form manually
- **Future**: OCR support planned for image-based PDFs

## Future Enhancements

- [ ] Support for scanned PDFs with OCR
- [ ] Confidence scores for extracted fields
- [ ] Field-by-field suggestions instead of auto-fill
- [ ] Multi-language support
- [ ] Custom AI prompts per certificate type
- [ ] Offline mode with local AI model

## Cost Considerations

**Gemini 1.5 Flash Pricing** (as of 2024):
- Free tier: 15 requests/minute, 1500 requests/day
- Very low cost for paid usage
- Much cheaper than GPT-4

**Recommendation**: Free tier is sufficient for most users

## Privacy & Security

- PDF text is sent to Google Gemini API
- No PDF file is uploaded to AI (only extracted text)
- No data is stored by the AI provider (per Google's policy)
- Metadata and PDF are stored on IPFS (public)
- Consider data sensitivity before using AI parsing

## Feedback Welcome!

This is the first version of the AI feature. Please report:
- Fields that are consistently missed
- PDF formats that don't work well
- UX improvements
- Performance issues

Happy credentialing! 🎓✨

