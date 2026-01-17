/**
 * Config Routes
 * Route definitions for configuration endpoints
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireOrgContext } from '../../middleware/orgContext';
import * as configController from './config.controller';

const router = Router();

// All routes require authentication and org context
router.use(authenticate);
router.use(requireOrgContext);

// ============ Plan Item Types ============
router.get('/plan-item-types', configController.listPlanItemTypes);
router.get('/plan-item-types/:id', configController.getPlanItemType);
router.post('/plan-item-types', configController.createPlanItemType);
router.put('/plan-item-types/:id', configController.updatePlanItemType);
router.delete('/plan-item-types/:id', configController.deletePlanItemType);

// ============ Content Types ============
router.get('/content-types', configController.listContentTypes);
router.get('/content-types/:id', configController.getContentType);
router.post('/content-types', configController.createContentType);
router.put('/content-types/:id', configController.updateContentType);
router.delete('/content-types/:id', configController.deleteContentType);

// ============ Activity Types ============
router.get('/activity-types', configController.listActivityTypes);
router.get('/activity-types/:id', configController.getActivityType);
router.post('/activity-types', configController.createActivityType);
router.put('/activity-types/:id', configController.updateActivityType);
router.delete('/activity-types/:id', configController.deleteActivityType);

export default router;
