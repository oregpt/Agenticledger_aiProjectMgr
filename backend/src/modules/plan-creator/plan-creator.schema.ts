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
 * Schema for a single plan item to create
 */
const planItemToCreateSchema = z.object({
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

export type PlanItemToCreate = z.infer<typeof planItemToCreateSchema>;

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
