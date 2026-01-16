import { Router } from 'express';
import * as menusController from './menus.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';

const router = Router();

// Get all menus (for RBAC configuration)
router.get(
  '/',
  authenticate,
  requireOrgContext,
  menusController.getAllMenus
);

// Get user's accessible menus (for navigation)
router.get(
  '/user',
  authenticate,
  requireOrgContext,
  menusController.getUserMenus
);

export default router;
