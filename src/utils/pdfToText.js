import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

/**
 * Extracts text content from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text as a single string
 */
export const extractTextFromPDF = async (file) => {
    try {
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
        
        // Extract text from all pages
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Concatenate text items with spaces
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\n\n';
        }
        
        console.log(`✅ Text extracted: ${fullText.length} characters`);
        return fullText.trim();
        
    } catch (error) {
        console.error('❌ Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
};

