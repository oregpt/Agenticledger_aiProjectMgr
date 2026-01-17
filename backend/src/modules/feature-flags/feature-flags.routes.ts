import { Router } from 'express';
import * as featureFlagsController from './feature-flags.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin, requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /feature-flags:
 *   get:
 *     summary: Get all feature flags (Platform Admin)
 *     description: Get all feature flags defined on the platform
 *     tags: [Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of all feature flags
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  featureFlagsController.getAllFeatureFlags
);

/**
 * @swagger
 * /feature-flags/organization/{orgId}:
 *   get:
 *     summary: Get organization feature flags
 *     description: Get feature flags and their settings for an organization
 *     tags: [Feature Flags]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         schema:
 *           type: integer
 *         description: Organization ID (optional, defaults to context org)
 *     responses:
 *       200:
 *         description: Organization's feature flags
 */
router.get(
  '/organization/:orgId?',
  authenticate,
  requireOrgContext,
  featureFlagsController.getOrganizationFeatureFlags
);

/**
 * @swagger
 * /feature-flags/organization/{orgId}/flag/{flagId}:
 *   patch:
 *     summary: Update organization feature flag
 *     description: Enable or disable a feature flag for an organization (requires org admin)
 *     tags: [Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         schema:
 *           type: integer
 *         description: Organization ID (optional, defaults to context org)
 *       - in: path
 *         name: flagId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feature flag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Whether to enable or disable the flag
 *     responses:
 *       200:
 *         description: Feature flag updated
 *       403:
 *         description: Admin access required
 */
router.patch(
  '/organization/:orgId?/flag/:flagId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  featureFlagsController.updateOrganizationFeatureFlag
);

export default router;
