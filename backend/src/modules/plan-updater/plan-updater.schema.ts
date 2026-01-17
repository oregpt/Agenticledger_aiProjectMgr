import { z } from 'zod';

// Schema for getting plan suggestions
export const getPlanSuggestionsSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  workstreamFilter: z.array(z.string().uuid()).optional().default([]),
});

// Schema for applying plan updates
export const applyPlanUpdatesSchema = z.object({
  updates: z.array(z.object({
    planItemId: z.string().uuid(),
    field: z.enum(['status', 'notes', 'targetEndDate', 'actualEndDate']),
    value: z.string(),
    reason: z.string(),
    evidenceContentIds: z.array(z.string().uuid()).default([]),
  })),
});

export type GetPlanSuggestionsInput = z.infer<typeof getPlanSuggestionsSchema>;
export type ApplyPlanUpdatesInput = z.infer<typeof applyPlanUpdatesSchema>;
