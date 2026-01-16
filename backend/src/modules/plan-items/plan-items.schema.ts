import { z } from 'zod';

// Valid statuses for plan items
export const planItemStatuses = [
  'not_started',
  'in_progress',
  'completed',
  'on_hold',
  'blocked',
  'cancelled',
] as const;

// Schema for creating plan items via POST /api/projects/:projectId/plan
// projectId comes from URL param, not body
export const createPlanItemSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  itemTypeId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  owner: z.string().max(255).nullable().optional(),
  status: z.enum(planItemStatuses).default('not_started'),
  startDate: z.coerce.date().nullable().optional(),
  targetEndDate: z.coerce.date().nullable().optional(),
  actualStartDate: z.coerce.date().nullable().optional(),
  actualEndDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  references: z.array(z.string().uuid()).default([]),
  sortOrder: z.coerce.number().int().default(0),
});

export const updatePlanItemSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  owner: z.string().max(255).nullable().optional(),
  status: z.enum(planItemStatuses).optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetEndDate: z.coerce.date().nullable().optional(),
  actualStartDate: z.coerce.date().nullable().optional(),
  actualEndDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  references: z.array(z.string().uuid()).optional(),
  sortOrder: z.coerce.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
  itemTypeId: z.coerce.number().int().positive().optional(),
});

export const listPlanItemsQuerySchema = z.object({
  status: z.enum(planItemStatuses).optional(),
  itemTypeId: z.coerce.number().int().positive().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(planItemStatuses).optional(),
      notes: z.string().nullable().optional(),
      references: z.array(z.string().uuid()).optional(),
      changeReason: z.string().optional(),
    })
  ),
});

export type CreatePlanItemInput = z.infer<typeof createPlanItemSchema>;
export type UpdatePlanItemInput = z.infer<typeof updatePlanItemSchema>;
export type ListPlanItemsQuery = z.infer<typeof listPlanItemsQuerySchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
