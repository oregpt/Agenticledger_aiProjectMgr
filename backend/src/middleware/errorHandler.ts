import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse, ErrorCodes } from '../utils/responses.js';
import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    errorResponse(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || [];
        errorResponse(
          res,
          ErrorCodes.CONFLICT,
          `A record with this ${target.join(', ')} already exists`,
          409
        );
        return;
      case 'P2025':
        // Record not found
        errorResponse(res, ErrorCodes.NOT_FOUND, 'Record not found', 404);
        return;
      case 'P2003':
        // Foreign key constraint failed
        errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Related record not found', 400);
        return;
      default:
        errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Database error', 500);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Invalid data provided', 400);
    return;
  }

  // Default error
  errorResponse(
    res,
    ErrorCodes.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, ErrorCodes.NOT_FOUND, `Route ${req.method} ${req.path} not found`, 404);
};
