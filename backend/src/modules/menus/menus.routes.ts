import { Router } from 'express';
import * as menusController from './menus.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';

const router = Router();

/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Get all menus
 *     description: Get all available menus for RBAC configuration
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of all menus
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  menusController.getAllMenus
);

/**
 * @swagger
 * /menus/user:
 *   get:
 *     summary: Get user's menus
 *     description: Get menus accessible to the current user based on their role
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of accessible menus for navigation
 */
router.get(
  '/user',
  authenticate,
  requireOrgContext,
  menusController.getUserMenus
);

export default router;
