/**
 * Output Formatter Schemas
 * Zod validation schemas for format endpoints
 */

import { z } from 'zod';

// Report data structures from activity-reporter
export const StatusUpdateSchema = z.object({
  planItemId: z.string().nullable(),
  planItemName: z.string().nullable(),
  update: z.string(),
  status: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceContentIds: z.array(z.string()),
});

export const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  owner: z.string().nullable(),
  dueDate: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.string(),
  planItemId: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceContentIds: z.array(z.string()),
});

export const RiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  mitigation: z.string().nullable(),
  planItemId: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceContentIds: z.array(z.string()),
});

export const DecisionSchema = z.object({
  title: z.string(),
  description: z.string(),
  decisionMaker: z.string().nullable(),
  decisionDate: z.string().nullable(),
  planItemId: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceContentIds: z.array(z.string()),
});

export const BlockerSchema = z.object({
  title: z.string(),
  description: z.string(),
  resolution: z.string().nullable(),
  planItemId: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceContentIds: z.array(z.string()),
});

export const SuggestedPlanUpdateSchema = z.object({
  planItemId: z.string(),
  field: z.string(),
  suggestedValue: z.string(),
  reason: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const ReportDataSchema = z.object({
  summary: z.string(),
  statusUpdates: z.array(StatusUpdateSchema),
  actionItems: z.array(ActionItemSchema),
  risks: z.array(RiskSchema),
  decisions: z.array(DecisionSchema),
  blockers: z.array(BlockerSchema),
  suggestedPlanUpdates: z.array(SuggestedPlanUpdateSchema),
});

// Plan item structure for plan export (base without children for recursion)
const BasePlanItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  itemType: z.string(),
  owner: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  targetEndDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type PlanItemInput = z.infer<typeof BasePlanItemSchema> & {
  children?: PlanItemInput[];
};

export const PlanItemSchema: z.ZodType<PlanItemInput> = BasePlanItemSchema.extend({
  children: z.lazy(() => z.array(PlanItemSchema)).optional(),
});

// Format markdown input
export const FormatMarkdownInputSchema = z.object({
  sourceType: z.enum(['plan', 'activity_report', 'combined']),
  projectName: z.string(),
  data: z.union([
    // Activity report format
    z.object({
      title: z.string(),
      periodStart: z.string(),
      periodEnd: z.string(),
      reportData: ReportDataSchema,
    }),
    // Plan format
    z.object({
      planItems: z.array(PlanItemSchema),
    }),
    // Combined format
    z.object({
      title: z.string(),
      periodStart: z.string(),
      periodEnd: z.string(),
      reportData: ReportDataSchema,
      planItems: z.array(PlanItemSchema).optional(),
    }),
  ]),
});

export type FormatMarkdownInput = z.infer<typeof FormatMarkdownInputSchema>;

// Format PPTX input (same structure as markdown)
export const FormatPptxInputSchema = FormatMarkdownInputSchema;
export type FormatPptxInput = z.infer<typeof FormatPptxInputSchema>;

// Response types
export interface FormatMarkdownResponse {
  content: string;
  filename: string;
}

export interface FormatPptxResponse {
  buffer: Buffer;
  filename: string;
}
