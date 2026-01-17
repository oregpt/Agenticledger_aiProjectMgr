import { Request, Response, NextFunction } from 'express';
import { errorResponse, ErrorCodes } from '../utils/responses.js';
import { validateApiKey } from '../modules/api-keys/api-keys.service.js';

/**
 * API Key Authentication Middleware
 *
 * Validates API keys passed in the X-API-Key header.
 * API keys provide full user-level access but cannot:
 * - Manage other API keys
 * - Manage organization settings
 *
 * Usage:
 * - Can be used standalone or combined with JWT auth
 * - When used with authenticate middleware, API key takes precedence
 */

const API_KEY_HEADER = 'x-api-key';

/**
 * Attempt to authenticate using an API key
 * Returns true if authenticated, false if no API key present
 * Sends error response if API key is invalid/expired
 */
export const tryApiKeyAuth = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  const apiKey = req.headers[API_KEY_HEADER] as string | undefined;

  if (!apiKey) {
    return false;
  }

  const result = await validateApiKey(apiKey);

  if (!result) {
    errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Invalid or expired API key', 401);
    return true; // Indicates we handled the response
  }

  // Set user context from the API key's creator
  req.user = {
    id: result.user.id,
    uuid: result.user.uuid,
    email: result.user.email,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
  };

  // Set organization context from the API key
  req.organizationId = result.organization.id;
  req.organization = result.organization as any;

  // Mark this as API key authentication
  req.authMethod = 'api_key';
  req.apiKeyId = result.apiKey.id;

  return true;
};

/**
 * Middleware that requires API key authentication
 * Use this for endpoints that should ONLY accept API keys
 */
export const requireApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers[API_KEY_HEADER] as string | undefined;

    if (!apiKey) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'API key required in X-API-Key header', 401);
      return;
    }

    const result = await validateApiKey(apiKey);

    if (!result) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Invalid or expired API key', 401);
      return;
    }

    // Set user context
    req.user = {
      id: result.user.id,
      uuid: result.user.uuid,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    };

    // Set organization context
    req.organizationId = result.organization.id;
    req.organization = result.organization as any;

    // Mark as API key auth
    req.authMethod = 'api_key';
    req.apiKeyId = result.apiKey.id;

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Authentication failed', 500);
  }
};

/**
 * Middleware to restrict API key access to certain endpoints
 * Use after authenticate middleware to block API keys from sensitive endpoints
 */
export const rejectApiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.authMethod === 'api_key') {
    errorResponse(
      res,
      ErrorCodes.FORBIDDEN,
      'API keys cannot access this endpoint. Please use JWT authentication.',
      403
    );
    return;
  }
  next();
};
