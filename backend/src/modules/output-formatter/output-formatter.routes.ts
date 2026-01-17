/**
 * Output Formatter Routes
 * Route definitions for format endpoints
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as outputFormatterController from './output-formatter.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/format/markdown
 * Format data as Markdown
 */
router.post('/markdown', outputFormatterController.formatMarkdown);

/**
 * POST /api/format/pptx
 * Format data as PowerPoint
 */
router.post('/pptx', outputFormatterController.formatPptx);

export default router;
