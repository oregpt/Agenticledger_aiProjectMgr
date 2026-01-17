import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requirePlatformAdmin } from '../../middleware/rbac.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import * as platformSettingsController from '../platform-settings/platform-settings.controller.js';
import * as organizationsController from '../organizations/organizations.controller.js';
import * as featureFlagsController from '../feature-flags/feature-flags.controller.js';
import {
  createOrganizationSchema,
  listOrganizationsQuerySchema,
} from '../organizations/organizations.schema.js';

const router = Router();

// ============================================================================
// Platform Settings
// ============================================================================

/**
 * @swagger
 * /platform/settings:
 *   get:
 *     summary: Get all platform settings
 *     description: Get all platform-wide settings (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of platform settings
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/settings',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getAllSettings
);

/**
 * @swagger
 * /platform/settings/{key}:
 *   get:
 *     summary: Get platform setting
 *     description: Get a specific platform setting by key (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting value
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Setting not found
 */
router.get(
  '/settings/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getSetting
);

/**
 * @swagger
 * /platform/settings/{key}:
 *   put:
 *     summary: Update platform setting
 *     description: Update a platform setting value (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 description: New setting value
 *     responses:
 *       200:
 *         description: Setting updated
 *       403:
 *         description: Platform admin access required
 */
router.put(
  '/settings/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.updateSetting
);

// ============================================================================
// Platform Feature Flags
// ============================================================================

/**
 * @swagger
 * /platform/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     description: Get all feature flags at the platform level (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of feature flags
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/feature-flags',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  featureFlagsController.getAllFeatureFlags
);

/**
 * @swagger
 * /platform/feature-flags/{flagId}:
 *   put:
 *     summary: Update feature flag default
 *     description: Update the default value of a feature flag (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
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
 *               defaultEnabled:
 *                 type: boolean
 *                 description: Default enabled state for new organizations
 *     responses:
 *       200:
 *         description: Feature flag updated
 *       403:
 *         description: Platform admin access required
 */
router.put(
  '/feature-flags/:flagId',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  featureFlagsController.updateFeatureFlag
);

// ============================================================================
// Platform Organizations
// ============================================================================

/**
 * @swagger
 * /platform/organizations:
 *   get:
 *     summary: Get all organizations
 *     description: Get all organizations on the platform (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by organization name
 *     responses:
 *       200:
 *         description: Paginated list of organizations
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/organizations',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateQuery(listOrganizationsQuerySchema),
  organizationsController.getAllOrganizations
);

/**
 * @swagger
 * /platform/organizations:
 *   post:
 *     summary: Create organization
 *     description: Create a new organization (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created
 *       403:
 *         description: Platform admin access required
 */
router.post(
  '/organizations',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateBody(createOrganizationSchema),
  organizationsController.createOrganization
);

/**
 * @swagger
 * /platform/organizations/{orgId}:
 *   delete:
 *     summary: Delete organization
 *     description: Delete an organization (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID to delete
 *     responses:
 *       200:
 *         description: Organization deleted
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Organization not found
 */
router.delete(
  '/organizations/:orgId',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  organizationsController.deleteOrganization
);

// ============================================================================
// Platform Stats
// ============================================================================

/**
 * @swagger
 * /platform/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Get platform-wide statistics (platform admin only)
 *     tags: [Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: Platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrganizations:
 *                   type: integer
 *                 totalUsers:
 *                   type: integer
 *                 activeUsersToday:
 *                   type: integer
 *                 invitationsPending:
 *                   type: integer
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/stats',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  async (req, res, next) => {
    try {
      const { prisma } = await import('../../config/database.js');

      const [totalOrganizations, totalUsers, invitationsPending] = await Promise.all([
        prisma.organization.count({ where: { isPlatform: false } }),
        prisma.user.count(),
        prisma.invitation.count({ where: { status: 'PENDING' } }),
      ]);

      res.json({
        success: true,
        data: {
          totalOrganizations,
          totalUsers,
          activeUsersToday: 0, // TODO: implement active users tracking
          invitationsPending,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
