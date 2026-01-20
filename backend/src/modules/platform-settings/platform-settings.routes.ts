import { Router } from 'express';
import * as platformSettingsController from './platform-settings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /platform-settings/public:
 *   get:
 *     summary: Get public settings
 *     description: Get publicly accessible platform settings (no authentication required)
 *     tags: [Platform Settings]
 *     responses:
 *       200:
 *         description: Public settings
 */
router.get('/public', platformSettingsController.getPublicSettings);

/**
 * @swagger
 * /platform-settings:
 *   get:
 *     summary: Get all settings
 *     description: Get all platform settings (platform admin only)
 *     tags: [Platform Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: All platform settings
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getAllSettings
);

/**
 * @swagger
 * /platform-settings/{key}:
 *   get:
 *     summary: Get specific setting
 *     description: Get a specific platform setting by key (platform admin only)
 *     tags: [Platform Settings]
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
  '/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getSetting
);

/**
 * @swagger
 * /platform-settings/{key}:
 *   patch:
 *     summary: Update setting
 *     description: Update a platform setting value (platform admin only)
 *     tags: [Platform Settings]
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
router.patch(
  '/:key',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.updateSetting
);

/**
 * @swagger
 * /platform-settings/ai:
 *   get:
 *     summary: Get AI settings
 *     description: Get platform AI provider settings (platform admin only)
 *     tags: [Platform Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: AI settings (API keys masked)
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/ai',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.getAISettings
);

/**
 * @swagger
 * /platform-settings/ai:
 *   patch:
 *     summary: Update AI settings
 *     description: Update platform AI provider settings (platform admin only)
 *     tags: [Platform Settings]
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
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic]
 *               openaiApiKey:
 *                 type: string
 *               openaiModel:
 *                 type: string
 *               anthropicApiKey:
 *                 type: string
 *               anthropicModel:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI settings updated
 *       403:
 *         description: Platform admin access required
 */
router.patch(
  '/ai',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  platformSettingsController.updateAISettings
);

export default router;
