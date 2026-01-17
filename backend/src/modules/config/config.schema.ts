/**
 * Config Schemas
 * Zod validation schemas for config endpoints (types management)
 */

import { z } from 'zod';

// Plan Item Type schemas
export const CreatePlanItemTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with dashes/underscores'),
  description: z.string().optional(),
  level: z.number().int().min(1).max(10),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const UpdatePlanItemTypeSchema = CreatePlanItemTypeSchema.partial();

export type CreatePlanItemTypeInput = z.infer<typeof CreatePlanItemTypeSchema>;
export type UpdatePlanItemTypeInput = z.infer<typeof UpdatePlanItemTypeSchema>;

// Content Type schemas
export const CreateContentTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with dashes/underscores'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const UpdateContentTypeSchema = CreateContentTypeSchema.partial();

export type CreateContentTypeInput = z.infer<typeof CreateContentTypeSchema>;
export type UpdateContentTypeInput = z.infer<typeof UpdateContentTypeSchema>;

// Activity Type schemas
export const CreateActivityTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with dashes/underscores'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const UpdateActivityTypeSchema = CreateActivityTypeSchema.partial();

export type CreateActivityTypeInput = z.infer<typeof CreateActivityTypeSchema>;
export type UpdateActivityTypeInput = z.infer<typeof UpdateActivityTypeSchema>;

// List query schemas
export const ListTypesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  includeSystem: z.coerce.boolean().default(true),
});

export type ListTypesQuery = z.infer<typeof ListTypesQuerySchema>;
