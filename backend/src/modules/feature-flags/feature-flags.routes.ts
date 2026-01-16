import { Router } from 'express';
import * as featureFlagsController from './feature-flags.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin, requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

// Get all feature flags (platform admin only)
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  featureFlagsController.getAllFeatureFlags
);

// Get organization feature flags
router.get(
  '/organization/:orgId?',
  authenticate,
  requireOrgContext,
  featureFlagsController.getOrganizationFeatureFlags
);

// Update organization feature flag
router.patch(
  '/organization/:orgId?/flag/:flagId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  featureFlagsController.updateOrganizationFeatureFlag
);

export default router;
