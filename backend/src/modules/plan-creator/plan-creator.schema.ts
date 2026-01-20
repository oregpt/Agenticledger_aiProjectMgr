/**
 * Plan Creator Schema
 * Input validation schemas for AI plan creation
 */

import { z } from 'zod';

/**
 * Schema for analyzing content to generate a plan
 */
export const analyzePlanContentSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  additionalContext: z.string().optional(),
});

export type AnalyzePlanContentInput = z.infer<typeof analyzePlanContentSchema>;

/**
 * Type for a single plan item to create (defined first for recursive schema)
 */
export interface PlanItemToCreate {
  name: string;
  itemType: 'workstream' | 'milestone' | 'activity' | 'task' | 'subtask';
  description?: string;
  owner?: string;
  estimatedDuration?: string;
  startDate?: string;
  targetEndDate?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  children?: PlanItemToCreate[];
}

/**
 * Schema for a single plan item to create
 */
const planItemToCreateSchema: z.ZodType<PlanItemToCreate> = z.object({
  name: z.string().min(1).max(500),
  itemType: z.enum(['workstream', 'milestone', 'activity', 'task', 'subtask']),
  description: z.string().optional(),
  owner: z.string().optional(),
  estimatedDuration: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
  // Allow nested children
  children: z.lazy(() => z.array(planItemToCreateSchema)).optional(),
});

/**
 * Schema for creating plan items from AI suggestions
 */
export const createPlanFromSuggestionsSchema = z.object({
  planItems: z.array(planItemToCreateSchema).min(1, 'At least one plan item is required'),
});

export type CreatePlanFromSuggestionsInput = z.infer<typeof createPlanFromSuggestionsSchema>;

export default {
  analyzePlanContentSchema,
  createPlanFromSuggestionsSchema,
};
