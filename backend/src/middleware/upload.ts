/**
 * File Upload Middleware
 * Configures multer for handling multipart/form-data file uploads
 */

import multer from 'multer';
import type { Request } from 'express';
import path from 'path';

// Allowed file types for content items
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown'];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Use memory storage so we can process files directly from buffer
const storage = multer.memoryStorage();

// File filter to validate uploads
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk || extOk) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow one file per upload
  },
});

// Export specific middleware for single file upload
export const uploadSingleFile = upload.single('file');

export default upload;
