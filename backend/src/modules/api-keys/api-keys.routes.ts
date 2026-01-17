import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { rejectApiKeyAuth } from '../../middleware/apiKeyAuth.js';
import { validate, validateParams } from '../../middleware/validation.js';
import * as apiKeysController from './api-keys.controller.js';
import { createApiKeySchema, deleteApiKeyParamsSchema } from './api-keys.schema.js';

/**
 * API Keys Routes
 *
 * All routes require JWT authentication (not API key auth).
 * API keys cannot be used to manage other API keys (security measure).
 */

const router = Router();

// All routes require authentication and org context
// rejectApiKeyAuth ensures API keys cannot manage other API keys
router.use(authenticate);
router.use(rejectApiKeyAuth);
router.use(requireOrgContext);

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: List all API keys for the organization
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of API keys (key values not returned, only prefixes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       keyPrefix:
 *                         type: string
 *                         example: "aipm_abc123..."
 *                       lastUsedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: API keys cannot access this endpoint
 */
router.get('/', apiKeysController.listApiKeys);

/**
 * @swagger
 * /api-keys/{id}:
 *   get:
 *     summary: Get a single API key by ID
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key details (key value not returned)
 *       404:
 *         description: API key not found
 */
router.get('/:id', validateParams(deleteApiKeyParamsSchema), apiKeysController.getApiKey);

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create a new API key
 *     description: |
 *       Creates a new API key for the organization.
 *       **IMPORTANT:** The full key value is only returned in this response.
 *       It cannot be retrieved later - only the prefix is stored.
 *     tags: [API Keys]
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
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Production API Key"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: API key created - SAVE THE KEY NOW
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     key:
 *                       type: string
 *                       example: "aipm_GlnSMiyPzZX2OzEopRTXCf2LJl_2g0rB"
 *                       description: Full API key - ONLY returned on creation!
 *                     keyPrefix:
 *                       type: string
 *                       example: "aipm_GlnSMiy..."
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     warning:
 *                       type: string
 *                       example: "Save this key now. It will not be shown again."
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createApiKeySchema), apiKeysController.createApiKey);

/**
 * @swagger
 * /api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     description: Soft-deletes the API key, making it unusable for authentication.
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     keyPrefix:
 *                       type: string
 *                     revokedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: API key not found
 */
router.delete('/:id', validateParams(deleteApiKeyParamsSchema), apiKeysController.revokeApiKey);

export default router;
