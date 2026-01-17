import { Request, Response } from 'express';
import { successResponse, errorResponse, ErrorCodes } from '../../utils/responses.js';
import * as apiKeysService from './api-keys.service.js';
import { CreateApiKeyInput } from './api-keys.schema.js';

/**
 * API Keys Controller
 * Handles HTTP requests for API key management
 */

/**
 * List all API keys for the current organization
 * GET /api/api-keys
 */
export const listApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const keys = await apiKeysService.listApiKeys(organizationId);

    successResponse(res, keys);
  } catch (error) {
    console.error('Error listing API keys:', error);
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Failed to list API keys', 500);
  }
};

/**
 * Create a new API key
 * POST /api/api-keys
 *
 * IMPORTANT: The full key is only returned on creation.
 * It cannot be retrieved later as only the hash is stored.
 */
export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const userId = req.user!.id;
    const { name, expiresAt } = req.body as CreateApiKeyInput;

    // Parse expiresAt if provided
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;

    // Validate expiration is in the future
    if (expiresAtDate && expiresAtDate <= new Date()) {
      errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Expiration date must be in the future', 400);
      return;
    }

    const result = await apiKeysService.createApiKey(
      organizationId,
      userId,
      name,
      expiresAtDate
    );

    // Return with 201 Created
    successResponse(
      res,
      {
        id: result.id,
        name: result.name,
        key: result.key, // Full key - only returned on creation!
        keyPrefix: result.keyPrefix,
        expiresAt: result.expiresAt,
        createdAt: result.createdAt,
        warning: 'Save this key now. It will not be shown again.',
      },
      201
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create API key', 500);
  }
};

/**
 * Revoke (delete) an API key
 * DELETE /api/api-keys/:id
 */
export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const revoked = await apiKeysService.revokeApiKey(organizationId, id);

    if (!revoked) {
      errorResponse(res, ErrorCodes.NOT_FOUND, 'API key not found', 404);
      return;
    }

    successResponse(res, revoked);
  } catch (error) {
    console.error('Error revoking API key:', error);
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Failed to revoke API key', 500);
  }
};

/**
 * Get a single API key by ID
 * GET /api/api-keys/:id
 */
export const getApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { id } = req.params;

    const key = await apiKeysService.getApiKeyById(organizationId, id);

    if (!key) {
      errorResponse(res, ErrorCodes.NOT_FOUND, 'API key not found', 404);
      return;
    }

    successResponse(res, key);
  } catch (error) {
    console.error('Error getting API key:', error);
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Failed to get API key', 500);
  }
};
