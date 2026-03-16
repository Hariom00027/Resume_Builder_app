const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const openaiService = require('./openaiService');

class ParseService {
  /**
   * Parse resume from uploaded file (PDF or DOCX)
   * @param {Object} file - Multer file object with buffer and mimetype
   * @returns {Object} Structured resume data
   */
  async parseResume(file) {
    const fileType = file.mimetype;
    let text = '';

    try {
      // Extract text based on file type
      if (fileType === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        text = data.text;
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file type. Please upload PDF or DOCX.');
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract text from file. File might be empty, corrupted, or scanned (OCR not supported yet).');
      }

      console.log(`Extracted ${text.length} characters from ${fileType}`);

      // Use AI to parse and structure the text
      const structuredResume = await openaiService.parseResumeText(text);
      
      return structuredResume;
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }
}

module.exports = new ParseService();
