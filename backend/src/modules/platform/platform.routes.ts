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

// Get all platform settings
router.get(
  '/settings',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getAllSettings
);

// Get specific setting
router.get(
  '/settings/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getSetting
);

// Update setting
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

// Get all feature flags (platform level)
router.get(
  '/feature-flags',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  featureFlagsController.getAllFeatureFlags
);

// Update feature flag default
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

// Get all organizations (platform admin)
router.get(
  '/organizations',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateQuery(listOrganizationsQuerySchema),
  organizationsController.getAllOrganizations
);

// Create organization
router.post(
  '/organizations',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateBody(createOrganizationSchema),
  organizationsController.createOrganization
);

// Delete organization
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

// Get platform statistics
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
