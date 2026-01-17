import { Router } from 'express';
import * as contentItemsController from './content-items.controller';
import { validateBody, validateQuery } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { requireOrgContext } from '../../middleware/orgContext';
import { uploadSingleFile } from '../../middleware/upload.js';
import {
  createContentItemSchema,
  updateContentItemSchema,
  listContentItemsQuerySchema,
  analyzeContentSchema,
  saveAnalyzedContentSchema,
} from './content-items.schema';

const router = Router();

// All content-items routes require authentication and organization context
router.use(authenticate);
router.use(requireOrgContext);

/**
 * @swagger
 * /content-items:
 *   get:
 *     summary: List all content items
 *     description: Get all content items with optional filters
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project UUID
 *       - in: query
 *         name: contentTypeId
 *         schema:
 *           type: integer
 *         description: Filter by content type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range start
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range end
 *     responses:
 *       200:
 *         description: List of content items
 */
router.get(
  '/',
  validateQuery(listContentItemsQuerySchema),
  contentItemsController.listContentItems
);

/**
 * @swagger
 * /content-items/analyze:
 *   post:
 *     summary: Analyze content with AI
 *     description: Send content to AI for analysis to extract action items, decisions, blockers, etc.
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - projectId
 *             properties:
 *               content:
 *                 type: string
 *                 description: The text content to analyze
 *               projectId:
 *                 type: string
 *                 description: Project UUID for context
 *               title:
 *                 type: string
 *               contentTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               activityTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: AI analysis results with extracted items
 */
router.post(
  '/analyze',
  validateBody(analyzeContentSchema),
  contentItemsController.analyzeContent
);

/**
 * @swagger
 * /content-items/save-analyzed:
 *   post:
 *     summary: Save analyzed content
 *     description: Save content that has been analyzed by AI, including extracted activity items
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - content
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               activityTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               planItemId:
 *                 type: string
 *                 description: Optional link to a plan item
 *               activityItems:
 *                 type: array
 *                 description: Extracted activity items from AI analysis
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Content saved successfully
 */
router.post(
  '/save-analyzed',
  validateBody(saveAnalyzedContentSchema),
  contentItemsController.saveAnalyzedContent
);

/**
 * @swagger
 * /content-items/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file (PDF, DOCX, TXT, MD) and create a content item
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - projectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (PDF, DOCX, TXT, MD)
 *               projectId:
 *                 type: string
 *                 description: Project UUID
 *     responses:
 *       201:
 *         description: File uploaded and content extracted
 */
router.post(
  '/upload',
  uploadSingleFile,
  contentItemsController.uploadFile
);

/**
 * @swagger
 * /content-items/{id}:
 *   get:
 *     summary: Get a content item
 *     description: Retrieve a single content item by ID
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content item UUID
 *     responses:
 *       200:
 *         description: Content item details
 *       404:
 *         description: Content item not found
 */
router.get(
  '/:id',
  contentItemsController.getContentItem
);

/**
 * @swagger
 * /content-items:
 *   post:
 *     summary: Create a content item
 *     description: Create a new content item (meeting notes, transcript, etc.)
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - title
 *               - content
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *                 example: "Sprint Planning Meeting"
 *               content:
 *                 type: string
 *               contentDate:
 *                 type: string
 *                 format: date
 *               contentTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               activityTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               planItemId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Content item created
 */
router.post(
  '/',
  validateBody(createContentItemSchema),
  contentItemsController.createContentItem
);

/**
 * @swagger
 * /content-items/{id}:
 *   put:
 *     summary: Update a content item
 *     description: Update an existing content item
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentDate:
 *                 type: string
 *                 format: date
 *               contentTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               activityTypeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Content item updated
 */
router.put(
  '/:id',
  validateBody(updateContentItemSchema),
  contentItemsController.updateContentItem
);

/**
 * @swagger
 * /content-items/{id}:
 *   delete:
 *     summary: Delete a content item
 *     description: Delete a content item and its associated data
 *     tags: [Content Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content item deleted
 *       404:
 *         description: Content item not found
 */
router.delete(
  '/:id',
  contentItemsController.deleteContentItem
);

export default router;
