/**
 * File Processing Service
 * Main entry point for file processing utilities
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf, isPdfBuffer } from './pdf.service.js';
import { extractTextFromDocx, isDocxBuffer } from './docx.service.js';
import logger from '../../utils/logger.js';

// Upload directory (relative to backend root)
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface FileProcessingResult {
  text: string;
  metadata: {
    originalFilename: string;
    storedFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    extractionMethod: 'pdf' | 'docx' | 'text' | 'unknown';
    pageCount?: number;
    extractionWarnings?: string[];
  };
}

export interface ProcessedFile {
  fileReference: string;  // UUID-based filename stored on disk
  fileName: string;       // Original filename
  fileSize: number;
  mimeType: string;
  rawContent: string;     // Extracted text
}

/**
 * Ensure uploads directory exists
 */
export async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    logger.info(`Created uploads directory: ${UPLOADS_DIR}`);
  }
}

/**
 * Determine file type from buffer and filename
 */
export function detectFileType(buffer: Buffer, filename: string): 'pdf' | 'docx' | 'text' | 'unknown' {
  const ext = path.extname(filename).toLowerCase();

  // Check buffer signatures first
  if (isPdfBuffer(buffer)) return 'pdf';
  if (isDocxBuffer(buffer)) return 'docx';

  // Fall back to extension
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (['.txt', '.md', '.markdown'].includes(ext)) return 'text';

  return 'unknown';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.markdown': 'text/markdown',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Process and store an uploaded file
 */
export async function processUploadedFile(
  buffer: Buffer,
  originalFilename: string
): Promise<ProcessedFile> {
  await ensureUploadsDir();

  const fileType = detectFileType(buffer, originalFilename);
  const ext = path.extname(originalFilename);
  const storedFilename = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, storedFilename);
  const mimeType = getMimeType(originalFilename);

  // Save file to disk
  await fs.writeFile(filePath, buffer);
  logger.info(`Saved file: ${originalFilename} as ${storedFilename}`);

  // Extract text based on file type
  let rawContent = '';
  try {
    switch (fileType) {
      case 'pdf': {
        const pdfResult = await extractTextFromPdf(buffer);
        rawContent = pdfResult.text;
        logger.info(`Extracted ${pdfResult.numPages} pages from PDF: ${originalFilename}`);
        break;
      }
      case 'docx': {
        const docxResult = await extractTextFromDocx(buffer);
        rawContent = docxResult.text;
        if (docxResult.messages.length > 0) {
          logger.warn(`DOCX extraction warnings: ${docxResult.messages.join(', ')}`);
        }
        break;
      }
      case 'text': {
        rawContent = buffer.toString('utf-8');
        break;
      }
      default: {
        // For unknown types, try to read as text
        rawContent = buffer.toString('utf-8');
        logger.warn(`Unknown file type for ${originalFilename}, stored as binary and attempted text extraction`);
      }
    }
  } catch (error) {
    logger.error(`Failed to extract text from ${originalFilename}:`, error);
    // Store the file but leave rawContent empty
    rawContent = `[Text extraction failed for ${fileType} file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }

  return {
    fileReference: storedFilename,
    fileName: originalFilename,
    fileSize: buffer.length,
    mimeType,
    rawContent,
  };
}

/**
 * Read a stored file
 */
export async function readStoredFile(fileReference: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, fileReference);
  return fs.readFile(filePath);
}

/**
 * Delete a stored file
 */
export async function deleteStoredFile(fileReference: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, fileReference);
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${fileReference}`);
  } catch (error) {
    logger.warn(`Failed to delete file ${fileReference}:`, error);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(fileReference: string): Promise<boolean> {
  const filePath = path.join(UPLOADS_DIR, fileReference);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export default {
  ensureUploadsDir,
  processUploadedFile,
  readStoredFile,
  deleteStoredFile,
  fileExists,
  detectFileType,
  getMimeType,
};
