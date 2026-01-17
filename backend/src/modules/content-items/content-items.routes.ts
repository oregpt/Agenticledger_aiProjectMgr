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

// GET /api/content-items - List all content items with filters
router.get(
  '/',
  validateQuery(listContentItemsQuerySchema),
  contentItemsController.listContentItems
);

// POST /api/content-items/analyze - Analyze content using AI (must be before /:id)
router.post(
  '/analyze',
  validateBody(analyzeContentSchema),
  contentItemsController.analyzeContent
);

// POST /api/content-items/save-analyzed - Save analyzed content (must be before /:id)
router.post(
  '/save-analyzed',
  validateBody(saveAnalyzedContentSchema),
  contentItemsController.saveAnalyzedContent
);

// POST /api/content-items/upload - Upload a file and create content item (must be before /:id)
router.post(
  '/upload',
  uploadSingleFile,
  contentItemsController.uploadFile
);

// GET /api/content-items/:id - Get a single content item
router.get(
  '/:id',
  contentItemsController.getContentItem
);

// POST /api/content-items - Create a new content item
router.post(
  '/',
  validateBody(createContentItemSchema),
  contentItemsController.createContentItem
);

// PUT /api/content-items/:id - Update a content item
router.put(
  '/:id',
  validateBody(updateContentItemSchema),
  contentItemsController.updateContentItem
);

// DELETE /api/content-items/:id - Delete a content item
router.delete(
  '/:id',
  contentItemsController.deleteContentItem
);

export default router;
