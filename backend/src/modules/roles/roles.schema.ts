import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores'),
  description: z.string().max(500).optional(),
  baseRoleId: z.number().int().positive().optional(),
  scope: z.enum(['PLATFORM', 'ORGANIZATION']).default('ORGANIZATION'),
  organizationId: z.number().int().positive().optional(),
  permissions: z.array(z.object({
    menuId: z.number().int().positive(),
    canCreate: z.boolean().default(false),
    canRead: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.object({
    menuId: z.number().int().positive(),
    canCreate: z.boolean(),
    canRead: z.boolean(),
    canUpdate: z.boolean(),
    canDelete: z.boolean(),
  })),
});

export const listRolesQuerySchema = z.object({
  scope: z.enum(['PLATFORM', 'ORGANIZATION']).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
