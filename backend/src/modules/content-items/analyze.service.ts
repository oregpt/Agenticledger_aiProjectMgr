/**
 * Content Analysis Service
 * Uses AI to analyze content and extract structured information
 */

import prisma from '../../config/database.js';
import { generateJsonCompletion } from '../../services/ai/unified.service.js';
import { isAIConfiguredForOrg } from '../../services/ai/settings.service.js';
import {
  getIntakeAgentSystemPrompt,
  getIntakeAgentUserPrompt,
  type AnalysisContext,
  type AnalysisResult,
  type PlanItemContext,
  type ContentTypeContext,
  type ActivityTypeContext,
} from '../../services/ai/prompts/intake-agent.js';
import { getPromptsForAgent } from '../prompt-templates/prompt-templates.service.js';
import { createContentChunks } from '../../services/ai/embedding.service.js';
import { Prisma } from '@prisma/client';

// Token limit safety: ~4 chars per token, leave room for system prompt (~2K tokens) and response (~2K tokens)
// OpenAI TPM limit is 30K, so we target ~20K tokens for content = ~80K chars
// Being conservative with 60K chars (~15K tokens) for safety
const MAX_CONTENT_CHARS = 60000;

/**
 * Simple template interpolation for prompt templates
 * Replaces {{variable}} placeholders with values from context
 */
function interpolatePromptTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    if (value === undefined || value === null) {
      return match; // Keep placeholder if no value
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      // Format arrays nicely
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  });
}

/**
 * Truncate content to fit within token limits
 * Adds a note if truncation occurred
 */
function truncateContent(content: string): { content: string; truncated: boolean } {
  if (content.length <= MAX_CONTENT_CHARS) {
    return { content, truncated: false };
  }

  const truncatedContent = content.slice(0, MAX_CONTENT_CHARS);
  // Try to truncate at a sentence or paragraph boundary
  const lastPeriod = truncatedContent.lastIndexOf('.');
  const lastNewline = truncatedContent.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline, MAX_CONTENT_CHARS - 500);

  return {
    content: truncatedContent.slice(0, cutPoint + 1) + '\n\n[Content truncated due to length - analyzing first portion only]',
    truncated: true,
  };
}

interface AnalyzeContentInput {
  projectId: string;
  content: string;
  title?: string;
  dateOccurred?: Date;
  selectedContentTypeIds?: number[];
  selectedActivityTypeIds?: number[];
  selectedPlanItemIds?: string[];
}

interface AnalyzeContentResponse {
  analysis: AnalysisResult;
  context: {
    projectName: string;
    contentTypes: ContentTypeContext[];
    activityTypes: ActivityTypeContext[];
    planItems: PlanItemContext[];
  };
}

/**
 * Build hierarchical path for plan items
 */
async function buildPlanItemContexts(
  projectId: string
): Promise<PlanItemContext[]> {
  const planItems = await prisma.planItem.findMany({
    where: {
      projectId,
      isActive: true,
    },
    include: {
      itemType: true,
    },
    orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
  });

  // Build a map for quick lookup
  const itemMap = new Map(planItems.map((item) => [item.id, item]));

  // Build full paths
  function buildPath(item: typeof planItems[0]): string {
    const parts: string[] = [item.name];
    let current = item;
    while (current.parentId) {
      const parent = itemMap.get(current.parentId);
      if (parent) {
        parts.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return parts.join(' > ');
  }

  return planItems.map((item) => ({
    id: item.id,
    name: item.name,
    fullPath: buildPath(item),
    level: item.itemType.level,
    description: item.description || undefined,
  }));
}

/**
 * Analyze content using AI
 */
export async function analyzeContent(
  input: AnalyzeContentInput,
  organizationId: number
): Promise<AnalyzeContentResponse> {
  // Fetch project
  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Fetch content types and activity types (global or org-specific)
  const [contentTypes, activityTypes, planItemContexts] = await Promise.all([
    prisma.contentType.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId: null },
          { organizationId },
        ],
      },
      orderBy: { name: 'asc' },
    }),
    prisma.activityItemType.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId: null },
          { organizationId },
        ],
      },
      orderBy: { name: 'asc' },
    }),
    buildPlanItemContexts(input.projectId),
  ]);

  // Check if AI is configured for this organization
  const aiConfigured = await isAIConfiguredForOrg(organizationId);
  if (!aiConfigured) {
    // Return empty analysis if OpenAI not configured
    return {
      analysis: {
        summary: 'AI analysis not available - OpenAI API key not configured',
        suggestedTitle: input.title,
        suggestedContentTypes: [],
        suggestedActivityTypes: [],
        suggestedPlanItems: [],
        extractedItems: [],
        tags: [],
      },
      context: {
        projectName: project.name,
        contentTypes: contentTypes.map((ct) => ({
          id: ct.id,
          name: ct.name,
          slug: ct.slug,
          description: ct.description || undefined,
        })),
        activityTypes: activityTypes.map((at) => ({
          id: at.id,
          name: at.name,
          slug: at.slug,
          description: at.description || undefined,
        })),
        planItems: planItemContexts,
      },
    };
  }

  // Build context for AI
  const context: AnalysisContext = {
    projectName: project.name,
    planItems: planItemContexts,
    contentTypes: contentTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      slug: ct.slug,
      description: ct.description || undefined,
    })),
    activityTypes: activityTypes.map((at) => ({
      id: at.id,
      name: at.name,
      slug: at.slug,
      description: at.description || undefined,
    })),
    userSelectedContentTypes: input.selectedContentTypeIds,
    userSelectedActivityTypes: input.selectedActivityTypeIds,
    userSelectedPlanItems: input.selectedPlanItemIds,
    userTitle: input.title,
    userDate: input.dateOccurred?.toISOString().split('T')[0],
  };

  // Truncate content if too long for OpenAI token limits
  const { content: truncatedContent, truncated } = truncateContent(input.content);
  if (truncated) {
    console.log(`[AI Analysis] Content truncated from ${input.content.length} to ${truncatedContent.length} chars`);
  }

  // Generate prompts - check database for customized prompts first, fallback to hardcoded
  let systemPrompt: string;
  let userPrompt: string;

  try {
    const dbPrompts = await getPromptsForAgent('intake-agent');
    if (dbPrompts) {
      // Use database prompts - apply context substitution
      systemPrompt = interpolatePromptTemplate(dbPrompts.systemPrompt, context as unknown as Record<string, unknown>);
      userPrompt = interpolatePromptTemplate(dbPrompts.userPromptTemplate, { content: truncatedContent });
    } else {
      // Fallback to hardcoded functions
      systemPrompt = getIntakeAgentSystemPrompt(context);
      userPrompt = getIntakeAgentUserPrompt(truncatedContent);
    }
  } catch (error) {
    // If database lookup fails, use hardcoded defaults
    console.log('[AI Analysis] Using hardcoded prompts (database lookup failed)');
    systemPrompt = getIntakeAgentSystemPrompt(context);
    userPrompt = getIntakeAgentUserPrompt(truncatedContent);
  }

  // Call AI (uses org-specific settings if configured)
  const analysis = await generateJsonCompletion<AnalysisResult>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.3, // Lower temperature for more consistent extraction
    organizationId, // Use org-specific API keys and provider
  });

  // Validate and filter suggestions against actual data
  const validContentTypeIds = new Set(contentTypes.map((ct) => ct.id));
  const validActivityTypeIds = new Set(activityTypes.map((at) => at.id));
  const validPlanItemIds = new Set(planItemContexts.map((p) => p.id));

  // Filter suggestions to only include valid IDs
  analysis.suggestedContentTypes = (analysis.suggestedContentTypes || []).filter(
    (s) => validContentTypeIds.has(s.id)
  );
  analysis.suggestedActivityTypes = (analysis.suggestedActivityTypes || []).filter(
    (s) => validActivityTypeIds.has(s.id)
  );
  analysis.suggestedPlanItems = (analysis.suggestedPlanItems || []).filter(
    (s) => validPlanItemIds.has(s.id)
  );

  // Filter relatedPlanItemIds in extracted items
  analysis.extractedItems = (analysis.extractedItems || []).map((item) => ({
    ...item,
    relatedPlanItemIds: (item.relatedPlanItemIds || []).filter((id) =>
      validPlanItemIds.has(id)
    ),
  }));

  return {
    analysis,
    context: {
      projectName: project.name,
      contentTypes: contentTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        slug: ct.slug,
        description: ct.description || undefined,
      })),
      activityTypes: activityTypes.map((at) => ({
        id: at.id,
        name: at.name,
        slug: at.slug,
        description: at.description || undefined,
      })),
      planItems: planItemContexts,
    },
  };
}

/**
 * Save analyzed content with AI suggestions
 */
export interface SaveAnalyzedContentInput {
  projectId: string;
  title: string;
  dateOccurred: Date;
  rawContent: string;
  sourceType: string;
  contentTypeIds: number[];
  activityTypeIds: number[];
  planItemIds: string[];
  tags: string[];
  aiSummary?: string;
  aiExtractedEntities?: Record<string, unknown>;
  extractedItems?: Array<{
    type: string;
    title: string;
    description: string;
    owner?: string;
    dueDate?: string;
    status?: string;
    relatedPlanItemIds?: string[];
    metadata?: Record<string, unknown>;
  }>;
}

interface SavedContentResult {
  mainItem: {
    id: string;
    title: string;
  };
  extractedItems: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  chunksCreated: number;
}

/**
 * Save content and optionally create child items for extracted entities
 */
export async function saveAnalyzedContent(
  input: SaveAnalyzedContentInput,
  userId: number,
  organizationId: number
): Promise<SavedContentResult> {
  // Calculate project week
  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const projectWeek = project.startDate
    ? Math.ceil(
        (input.dateOccurred.getTime() - project.startDate.getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      ) + 1
    : null;

  // Create main content item
  const mainItem = await prisma.contentItem.create({
    data: {
      projectId: input.projectId,
      createdByUserId: userId,
      createdBy: 'user',
      sourceType: input.sourceType,
      title: input.title,
      dateOccurred: input.dateOccurred,
      projectWeek,
      planItemIds: input.planItemIds,
      contentTypeIds: input.contentTypeIds,
      activityTypeIds: input.activityTypeIds,
      tags: input.tags,
      rawContent: input.rawContent,
      aiSummary: input.aiSummary,
      aiExtractedEntities: (input.aiExtractedEntities || {}) as Prisma.InputJsonValue,
      processingStatus: 'completed',
    },
  });

  const extractedItemsCreated: Array<{ id: string; title: string; type: string }> = [];

  // Create child items for extracted entities
  if (input.extractedItems && input.extractedItems.length > 0) {
    for (const extracted of input.extractedItems) {
      // Map type to activity type ID
      const activityType = await prisma.activityItemType.findFirst({
        where: { slug: extracted.type },
      });

      const childItem = await prisma.contentItem.create({
        data: {
          projectId: input.projectId,
          createdByUserId: userId,
          parentItemId: mainItem.id,
          createdBy: 'ai_split',
          sourceType: 'text',
          title: extracted.title,
          dateOccurred: input.dateOccurred,
          projectWeek,
          planItemIds: extracted.relatedPlanItemIds || [],
          contentTypeIds: [],
          activityTypeIds: activityType ? [activityType.id] : [],
          tags: [],
          rawContent: extracted.description,
          aiExtractedEntities: {
            type: extracted.type,
            owner: extracted.owner,
            dueDate: extracted.dueDate,
            status: extracted.status,
            ...(extracted.metadata || {}),
          } as Prisma.InputJsonValue,
          processingStatus: 'completed',
        },
      });

      extractedItemsCreated.push({
        id: childItem.id,
        title: childItem.title,
        type: extracted.type,
      });
    }
  }

  // Generate embeddings for main content
  let chunksCreated = 0;
  if (input.rawContent && input.rawContent.trim().length > 0) {
    try {
      const result = await createContentChunks(mainItem.id, input.rawContent);
      chunksCreated = result.chunksCreated;
    } catch (error) {
      console.error('Failed to create content chunks:', error);
      // Don't fail the save if embedding fails
    }
  }

  return {
    mainItem: {
      id: mainItem.id,
      title: mainItem.title,
    },
    extractedItems: extractedItemsCreated,
    chunksCreated,
  };
}

export default {
  analyzeContent,
  saveAnalyzedContent,
};
