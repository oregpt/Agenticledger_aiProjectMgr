import { z } from 'zod';

// Valid source types for content items
export const sourceTypes = ['file', 'text', 'calendar', 'transcript', 'email'] as const;

// Valid processing statuses
export const processingStatuses = ['pending', 'processing', 'completed', 'failed'] as const;

// Schema for creating content items via POST /api/content-items
export const createContentItemSchema = z.object({
  projectId: z.string().uuid(),
  planItemIds: z.array(z.string().uuid()).default([]),
  contentTypeIds: z.array(z.coerce.number().int().positive()).default([]),
  activityTypeIds: z.array(z.coerce.number().int().positive()).default([]),
  sourceType: z.enum(sourceTypes),
  title: z.string().min(1).max(500),
  dateOccurred: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  rawContent: z.string().nullable().optional(),
  fileReference: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.coerce.number().int().nullable().optional(),
  mimeType: z.string().nullable().optional(),
});

export const updateContentItemSchema = z.object({
  planItemIds: z.array(z.string().uuid()).optional(),
  contentTypeIds: z.array(z.coerce.number().int().positive()).optional(),
  activityTypeIds: z.array(z.coerce.number().int().positive()).optional(),
  title: z.string().min(1).max(500).optional(),
  dateOccurred: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  rawContent: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  aiExtractedEntities: z.record(z.unknown()).optional(),
  processingStatus: z.enum(processingStatuses).optional(),
});

export const listContentItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  projectId: z.string().uuid().optional(),
  planItemId: z.string().uuid().optional(),
  contentTypeId: z.coerce.number().int().positive().optional(),
  activityTypeId: z.coerce.number().int().positive().optional(),
  sourceType: z.enum(sourceTypes).optional(),
  processingStatus: z.enum(processingStatuses).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

// Schema for analyzing content with AI
export const analyzeContentSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1),
  title: z.string().optional(),
  dateOccurred: z.coerce.date().optional(),
  selectedContentTypeIds: z.array(z.coerce.number().int().positive()).optional(),
  selectedActivityTypeIds: z.array(z.coerce.number().int().positive()).optional(),
  selectedPlanItemIds: z.array(z.string().uuid()).optional(),
});

// Schema for saving analyzed content
export const saveAnalyzedContentSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  dateOccurred: z.coerce.date(),
  rawContent: z.string(),
  sourceType: z.enum([...sourceTypes, 'ai_extracted']).default('text'),
  contentTypeIds: z.array(z.coerce.number().int().positive()).default([]),
  activityTypeIds: z.array(z.coerce.number().int().positive()).default([]),
  planItemIds: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  aiSummary: z.string().optional(),
  aiExtractedEntities: z.record(z.unknown()).optional(),
  extractedItems: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    owner: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.string().optional(),
    relatedPlanItemIds: z.array(z.string().uuid()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })).optional(),
});

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;
export type UpdateContentItemInput = z.infer<typeof updateContentItemSchema>;
export type ListContentItemsQuery = z.infer<typeof listContentItemsQuerySchema>;
export type AnalyzeContentInput = z.infer<typeof analyzeContentSchema>;
export type SaveAnalyzedContentInput = z.infer<typeof saveAnalyzedContentSchema>;
