import { z } from 'zod';

/**
 * API Keys validation schemas
 */

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  expiresAt: z.string().datetime().optional(), // ISO date string
});

export const deleteApiKeyParamsSchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
