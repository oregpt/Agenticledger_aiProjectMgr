/**
 * DOCX Processing Service
 * Extracts text content from DOCX files using mammoth
 */

import mammoth from 'mammoth';
import logger from '../../utils/logger.js';

export interface DocxExtractionResult {
  text: string;
  html: string;
  messages: string[];
}

/**
 * Extract text from a DOCX buffer
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<DocxExtractionResult> {
  try {
    // Extract raw text
    const textResult = await mammoth.extractRawText({ buffer });

    // Also get HTML for potential rich formatting
    const htmlResult = await mammoth.convertToHtml({ buffer });

    // Collect any warning messages
    const messages = [
      ...textResult.messages.map(m => m.message),
      ...htmlResult.messages.map(m => m.message),
    ];

    return {
      text: textResult.value.trim(),
      html: htmlResult.value,
      messages,
    };
  } catch (error) {
    logger.error('Failed to extract text from DOCX:', error);
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a buffer looks like a DOCX (ZIP with specific signature)
 * DOCX files are ZIP archives starting with PK (0x50 0x4B)
 */
export function isDocxBuffer(buffer: Buffer): boolean {
  // ZIP files (and therefore DOCX) start with PK\x03\x04
  return buffer.length > 4 &&
         buffer[0] === 0x50 &&
         buffer[1] === 0x4B &&
         buffer[2] === 0x03 &&
         buffer[3] === 0x04;
}

export default {
  extractTextFromDocx,
  isDocxBuffer,
};
