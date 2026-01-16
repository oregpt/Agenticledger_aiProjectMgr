import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  client: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date(),
  targetEndDate: z.coerce.date().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).default('active'),
  statusConfig: z.record(z.unknown()).default({}),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  client: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z.coerce.date().optional(),
  targetEndDate: z.coerce.date().nullable().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  statusConfig: z.record(z.unknown()).optional(),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
