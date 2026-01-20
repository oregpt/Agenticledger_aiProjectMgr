import { Router } from 'express';
import * as promptTemplatesController from './prompt-templates.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Prompt Templates
 *   description: AI prompt template management (Platform Admin only)
 */

/**
 * @swagger
 * /prompt-templates:
 *   get:
 *     summary: Get all prompt templates
 *     description: Get all AI prompt templates (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of prompt templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromptTemplate'
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.getAllTemplates
);

/**
 * @swagger
 * /prompt-templates/category/{category}:
 *   get:
 *     summary: Get templates by category
 *     description: Get prompt templates filtered by category (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Template category (e.g., "agent", "utility")
 *     responses:
 *       200:
 *         description: List of prompt templates in category
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/category/:category',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.getTemplatesByCategory
);

/**
 * @swagger
 * /prompt-templates/seed:
 *   post:
 *     summary: Seed default templates
 *     description: Seed all default prompt templates (platform admin only). Creates templates that don't exist.
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: Seed results
 *       403:
 *         description: Platform admin access required
 */
router.post(
  '/seed',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.seedTemplates
);

/**
 * @swagger
 * /prompt-templates/{slug}:
 *   get:
 *     summary: Get a prompt template
 *     description: Get a specific prompt template by slug (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template slug (e.g., "intake-agent", "plan-creator")
 *     responses:
 *       200:
 *         description: Prompt template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromptTemplate'
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Template not found
 */
router.get(
  '/:slug',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.getTemplate
);

/**
 * @swagger
 * /prompt-templates/{slug}:
 *   patch:
 *     summary: Update a prompt template
 *     description: Update a prompt template's prompts or metadata (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systemPrompt:
 *                 type: string
 *                 description: The system/role prompt for the AI
 *               userPromptTemplate:
 *                 type: string
 *                 description: The user prompt template with placeholders
 *               name:
 *                 type: string
 *                 description: Display name
 *               description:
 *                 type: string
 *                 description: Description of what this template does
 *     responses:
 *       200:
 *         description: Updated template
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Template not found
 */
router.patch(
  '/:slug',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.updateTemplate
);

/**
 * @swagger
 * /prompt-templates/{slug}/reset:
 *   post:
 *     summary: Reset template to defaults
 *     description: Reset a prompt template to its default prompts (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template slug
 *     responses:
 *       200:
 *         description: Template reset to defaults
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Template not found
 */
router.post(
  '/:slug/reset',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.resetTemplate
);

/**
 * @swagger
 * /prompt-templates/{slug}/defaults:
 *   get:
 *     summary: Get default prompts
 *     description: Get the default prompts for a template without modifying (platform admin only)
 *     tags: [Prompt Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template slug
 *     responses:
 *       200:
 *         description: Default prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemPrompt:
 *                       type: string
 *                     userPromptTemplate:
 *                       type: string
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: No defaults available for template
 */
router.get(
  '/:slug/defaults',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  promptTemplatesController.getDefaultPrompts
);

/**
 * @swagger
 * components:
 *   schemas:
 *     PromptTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         uuid:
 *           type: string
 *         slug:
 *           type: string
 *           description: Unique identifier (e.g., "intake-agent")
 *         name:
 *           type: string
 *           description: Display name
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           description: Category for grouping (e.g., "agent")
 *         systemPrompt:
 *           type: string
 *           description: The system/role prompt
 *         userPromptTemplate:
 *           type: string
 *           description: The user prompt template
 *         variables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               required:
 *                 type: boolean
 *         version:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         isSystem:
 *           type: boolean
 *         updatedByEmail:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
