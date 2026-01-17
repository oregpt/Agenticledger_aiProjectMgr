import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token/token.service.js';
import prisma from '../config/database.js';
import { errorResponse, ErrorCodes } from '../utils/responses.js';
import { validateApiKey } from '../modules/api-keys/api-keys.service.js';

const API_KEY_HEADER = 'x-api-key';

/**
 * Combined authentication middleware
 *
 * Checks for authentication in this order:
 * 1. X-API-Key header (API key authentication)
 * 2. Authorization: Bearer <token> (JWT authentication)
 *
 * API keys take precedence if both are present.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First, try API key authentication
    const apiKey = req.headers[API_KEY_HEADER] as string | undefined;

    if (apiKey) {
      const result = await validateApiKey(apiKey);

      if (result) {
        // API key is valid - set user and org context
        req.user = {
          id: result.user.id,
          uuid: result.user.uuid,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        };
        req.organizationId = result.organization.id;
        req.organization = result.organization as any;
        req.authMethod = 'api_key';
        req.apiKeyId = result.apiKey.id;
        next();
        return;
      }
      // API key is invalid - return error
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Invalid or expired API key', 401);
      return;
    }

    // No API key, try JWT authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'No token provided', 401);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      errorResponse(res, ErrorCodes.TOKEN_INVALID, 'Invalid token', 401);
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { uuid: payload.sub },
      select: {
        id: true,
        uuid: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'User not found', 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Account is deactivated', 401);
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    req.authMethod = 'jwt';

    next();
  } catch (error) {
    errorResponse(res, ErrorCodes.TOKEN_INVALID, 'Invalid token', 401);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      const user = await prisma.user.findUnique({
        where: { uuid: payload.sub },
        select: {
          id: true,
          uuid: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
};
