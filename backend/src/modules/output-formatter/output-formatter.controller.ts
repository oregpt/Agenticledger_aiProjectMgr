/**
 * Output Formatter Controller
 * HTTP handlers for format endpoints
 */

import type { RequestHandler } from 'express';
import { successResponse, ErrorCodes } from '../../utils/responses';
import { AppError } from '../../middleware/errorHandler';
import { FormatMarkdownInputSchema, FormatPptxInputSchema } from './output-formatter.schema';
import * as outputFormatterService from './output-formatter.service';

/**
 * Format data as Markdown
 * POST /api/format/markdown
 */
export const formatMarkdown: RequestHandler = async (req, res, next) => {
  try {
    // Validate input
    const parseResult = FormatMarkdownInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid input: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const result = outputFormatterService.formatAsMarkdown(parseResult.data);

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Format data as PowerPoint
 * POST /api/format/pptx
 */
export const formatPptx: RequestHandler = async (req, res, next) => {
  try {
    // Validate input
    const parseResult = FormatPptxInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid input: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const result = await outputFormatterService.formatAsPptx(parseResult.data);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);

    // Send buffer directly
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
};

export default {
  formatMarkdown,
  formatPptx,
};
