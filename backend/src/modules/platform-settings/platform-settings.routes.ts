import { Router } from 'express';
import * as platformSettingsController from './platform-settings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

// Public settings (no auth required)
router.get('/public', platformSettingsController.getPublicSettings);

// All settings (platform admin only)
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getAllSettings
);

// Get specific setting
router.get(
  '/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getSetting
);

// Update setting
router.patch(
  '/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.updateSetting
);

export default router;
