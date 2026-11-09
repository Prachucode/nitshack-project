import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Parses PDF text using Google Gemini AI to extract field values
 * @param {string} rawText - The extracted text from the PDF
 * @param {Array} fieldsArray - Array of field objects with {name, type} properties
 * @returns {Promise<Object>} - Object mapping field names to extracted values
 */
export const parseWithAI = async (rawText, fieldsArray) => {
    if (!API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is not configured in environment variables');
    }

    try {
        // Initialize the Gemini API
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.1, // Low temperature for consistent extraction
                topP: 0.8,
                topK: 40,
            }
        });

        // Build field descriptions for the prompt
        const fieldDescriptions = fieldsArray
            .map(f => `  - "${f.name}" (type: ${f.type})`)
            .join('\n');

        // Create the system prompt with clear instructions
        const prompt = `You are a data extraction assistant. Extract information from a certificate document.

**CERTIFICATE TEXT:**
${rawText}

**FIELDS TO EXTRACT:**
${fieldDescriptions}

**INSTRUCTIONS:**
1. Analyze the certificate text carefully
2. Extract the value for each field listed above
3. If a field value is clearly present, extract it exactly as written
4. If a field value cannot be confidently found, set it to null
5. For dates, use ISO format (YYYY-MM-DD) if possible
6. For numbers, extract only the numeric value
7. Return ONLY a valid JSON object with field names as keys

**OUTPUT FORMAT:**
Return ONLY a JSON object (no markdown, no code blocks, no explanations):
{
  "Field Name 1": "extracted value or null",
  "Field Name 2": "extracted value or null"
}`;

        console.log('🤖 Sending request to Gemini AI...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        console.log('📥 Raw AI response:', text);
        
        // Clean up the response - remove markdown code blocks if present
        text = text.trim();
        text = text.replace(/```json\s*/g, '');
        text = text.replace(/```\s*/g, '');
        text = text.trim();
        
        // Parse the JSON response
        const parsedData = JSON.parse(text);
        
        console.log('✅ AI parsing successful:', parsedData);
        
        // Validate that all fields are present in the response
        const result_obj = {};
        fieldsArray.forEach(field => {
            result_obj[field.name] = parsedData[field.name] !== undefined 
                ? parsedData[field.name] 
                : null;
        });
        
        return result_obj;
        
    } catch (error) {
        console.error('❌ Error parsing with AI:', error);
        
        // Return null for all fields on error so form remains editable
        const fallbackData = {};
        fieldsArray.forEach(field => {
            fallbackData[field.name] = null;
        });
        
        throw new Error(`AI parsing failed: ${error.message}`);
    }
};

/**
 * Validates if the extracted data has any non-null values
 * @param {Object} data - The parsed data object
 * @returns {boolean} - True if at least one field has a value
 */
export const hasValidData = (data) => {
    return Object.values(data).some(value => value !== null && value !== '');
};

