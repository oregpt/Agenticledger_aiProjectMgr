import { Router } from 'express';
import * as contentItemsController from './content-items.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import {
  createContentItemSchema,
  updateContentItemSchema,
  listContentItemsQuerySchema,
} from './content-items.schema.js';

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
