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
 * @swagger
 * /format/markdown:
 *   post:
 *     summary: Format as Markdown
 *     description: Convert activity report or content to Markdown format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportId
 *             properties:
 *               reportId:
 *                 type: string
 *                 description: Activity report UUID to format
 *               template:
 *                 type: string
 *                 description: Optional template name
 *     responses:
 *       200:
 *         description: Markdown content
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 */
router.post('/markdown', outputFormatterController.formatMarkdown);

/**
 * @swagger
 * /format/pptx:
 *   post:
 *     summary: Format as PowerPoint
 *     description: Convert activity report to PowerPoint presentation
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportId
 *             properties:
 *               reportId:
 *                 type: string
 *                 description: Activity report UUID to format
 *               template:
 *                 type: string
 *                 description: Optional template name
 *     responses:
 *       200:
 *         description: PowerPoint file
 *         content:
 *           application/vnd.openxmlformats-officedocument.presentationml.presentation:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/pptx', outputFormatterController.formatPptx);

export default router;
