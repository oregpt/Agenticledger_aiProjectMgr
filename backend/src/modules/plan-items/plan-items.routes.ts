import { Router } from 'express';
import * as planItemsController from './plan-items.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import {
  createPlanItemSchema,
  updatePlanItemSchema,
  listPlanItemsQuerySchema,
  bulkUpdateSchema,
} from './plan-items.schema.js';

const router = Router();

// All routes require authentication and organization context
router.use(authenticate);
router.use(requireOrgContext);

// POST /api/plan-items/bulk-update - Bulk update plan items
// NOTE: This must be before /:id routes to avoid conflict
router.post(
  '/bulk-update',
  validateBody(bulkUpdateSchema),
  planItemsController.bulkUpdatePlanItems
);

// GET /api/plan-items/:id - Get a single plan item with children
router.get(
  '/:id',
  planItemsController.getPlanItem
);

// GET /api/plan-items/:id/history - Get plan item history
router.get(
  '/:id/history',
  planItemsController.getPlanItemHistory
);

// PUT /api/plan-items/:id - Update a plan item
router.put(
  '/:id',
  validateBody(updatePlanItemSchema),
  planItemsController.updatePlanItem
);

// DELETE /api/plan-items/:id - Delete a plan item
router.delete(
  '/:id',
  planItemsController.deletePlanItem
);

export default router;
