import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse, ErrorCodes } from '../utils/responses.js';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, type: ValidationType = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data: unknown;

      switch (type) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        const details = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details);
        return;
      }

      // Replace with parsed/transformed data
      switch (type) {
        case 'body':
          req.body = result.data;
          break;
        case 'query':
          req.query = result.data;
          break;
        case 'params':
          req.params = result.data;
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
