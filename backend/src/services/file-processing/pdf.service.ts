/**
 * PDF Processing Service
 * Extracts text content from PDF files using pdf-parse
 */

import { PDFParse } from 'pdf-parse';
import logger from '../../utils/logger.js';

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
  };
}

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    // Convert Buffer to Uint8Array for pdf-parse
    const data = new Uint8Array(buffer);

    // Create parser with data
    const pdfParser = new PDFParse({ data });

    // Get text content
    const textResult = await pdfParser.getText();

    // Get info/metadata
    const infoResult = await pdfParser.getInfo();

    // Parse metadata from info result
    const info: PdfExtractionResult['info'] = {};

    // Info object may have various properties - access metadata safely
    const rawInfo = infoResult as unknown as Record<string, unknown>;
    if (rawInfo.info) {
      const pdfInfo = rawInfo.info as Record<string, string | undefined>;
      if (pdfInfo.Title) info.title = pdfInfo.Title;
      if (pdfInfo.Author) info.author = pdfInfo.Author;
      if (pdfInfo.Subject) info.subject = pdfInfo.Subject;
      if (pdfInfo.Keywords) info.keywords = pdfInfo.Keywords;
      if (pdfInfo.Creator) info.creator = pdfInfo.Creator;
    }

    // Combine text from all pages
    const fullText = textResult.pages.map(page => page.text).join('\n\n');

    // Get page count
    const numPages = textResult.pages.length;

    // Clean up
    await pdfParser.destroy();

    return {
      text: fullText.trim(),
      numPages,
      info,
    };
  } catch (error) {
    logger.error('Failed to extract text from PDF:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a buffer looks like a PDF
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  return buffer.length > 4 && buffer.slice(0, 5).toString('ascii') === '%PDF-';
}

export default {
  extractTextFromPdf,
  isPdfBuffer,
};
