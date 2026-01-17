/**
 * Content Analysis Service
 * Uses AI to analyze content and extract structured information
 */

import prisma from '../../config/database.js';
import { generateJsonCompletion, isOpenAIConfigured } from '../../services/ai/openai.service.js';
import {
  getIntakeAgentSystemPrompt,
  getIntakeAgentUserPrompt,
  type AnalysisContext,
  type AnalysisResult,
  type PlanItemContext,
  type ContentTypeContext,
  type ActivityTypeContext,
} from '../../services/ai/prompts/intake-agent.js';
import { createContentChunks } from '../../services/ai/embedding.service.js';
import { Prisma } from '@prisma/client';

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

  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
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

  // Generate prompts
  const systemPrompt = getIntakeAgentSystemPrompt(context);
  const userPrompt = getIntakeAgentUserPrompt(input.content);

  // Call OpenAI
  const analysis = await generateJsonCompletion<AnalysisResult>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.3, // Lower temperature for more consistent extraction
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
