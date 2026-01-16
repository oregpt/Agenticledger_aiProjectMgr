import { Router } from 'express';
import * as planItemsController from './plan-items.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';

const router = Router();

// All routes require authentication and organization context
router.use(authenticate);
router.use(requireOrgContext);

// GET /api/plan-item-types - Get all plan item types (global + org-specific)
router.get('/', planItemsController.getPlanItemTypes);

export default router;
