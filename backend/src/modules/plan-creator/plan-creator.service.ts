/**
 * Plan Creator Service
 * Analyzes content with AI to generate project plan structures
 */

import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import * as unifiedAI from '../../services/ai/unified.service.js';
import {
  getPlanCreatorSystemPrompt,
  getPlanCreatorUserPrompt,
  type PlanCreatorContext,
  type PlanCreatorResult,
  type GeneratedPlanItem,
} from '../../services/ai/prompts/plan-creator.js';
import type {
  AnalyzePlanContentInput,
  CreatePlanFromSuggestionsInput,
  PlanItemToCreate,
} from './plan-creator.schema.js';

// Map item type slug to level
const ITEM_TYPE_LEVELS: Record<string, number> = {
  workstream: 1,
  milestone: 2,
  activity: 3,
  task: 4,
  subtask: 5,
};

/**
 * Analyze content and generate plan structure suggestions
 */
export async function analyzePlanContent(
  projectId: string,
  organizationId: number,
  input: AnalyzePlanContentInput
): Promise<PlanCreatorResult & { context: { planItemTypes: Array<{ id: number; name: string; slug: string; level: number }> } }> {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Check if AI is configured
  if (!unifiedAI.isAIConfigured()) {
    throw new AppError(
      ErrorCodes.SERVICE_UNAVAILABLE,
      'AI is not configured. Please configure an AI provider in settings.',
      503
    );
  }

  // Get plan item types for context
  const planItemTypes = await prisma.planItemType.findMany({
    where: {
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
    orderBy: { level: 'asc' },
    select: { id: true, name: true, slug: true, level: true },
  });

  // Get existing plan items for context (to avoid duplicates)
  const existingPlanItems = await prisma.planItem.findMany({
    where: {
      projectId,
      isActive: true,
    },
    include: {
      itemType: { select: { name: true } },
    },
    orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
    take: 100, // Limit context size
  });

  // Build existing plan items context
  const existingItemsContext = existingPlanItems.map(item => ({
    id: item.id,
    name: item.name,
    fullPath: buildItemPath(item, existingPlanItems),
    itemType: item.itemType.name,
    status: item.status,
  }));

  // Build AI context
  const aiContext: PlanCreatorContext = {
    projectName: project.name,
    projectDescription: input.content,
    existingPlanItems: existingItemsContext.length > 0 ? existingItemsContext : undefined,
    additionalContext: input.additionalContext,
    planItemTypes: planItemTypes.map(pt => ({
      name: pt.name,
      slug: pt.slug,
      level: pt.level,
    })),
  };

  // Generate plan using AI
  const systemPrompt = getPlanCreatorSystemPrompt();
  const userPrompt = getPlanCreatorUserPrompt(aiContext);

  const result = await unifiedAI.generateJsonCompletion<PlanCreatorResult>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    organizationId,
    maxTokens: 8000, // Allow large responses for comprehensive plans
    temperature: 0.3, // Lower temperature for more consistent output
  });

  // Validate the result structure
  if (!result.planItems || !Array.isArray(result.planItems)) {
    throw new AppError(
      ErrorCodes.AI_ERROR,
      'AI returned invalid plan structure',
      500
    );
  }

  return {
    ...result,
    context: {
      planItemTypes,
    },
  };
}

/**
 * Create plan items from accepted suggestions
 */
export async function createPlanFromSuggestions(
  projectId: string,
  organizationId: number,
  input: CreatePlanFromSuggestionsInput,
  userId?: number,
  userEmail?: string
): Promise<{
  created: number;
  items: Array<{ id: string; name: string; itemType: string; parentId: string | null }>;
}> {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Get plan item types mapping
  const planItemTypes = await prisma.planItemType.findMany({
    where: {
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
    orderBy: { level: 'asc' },
  });

  // Create slug to ID mapping
  const slugToTypeId: Record<string, number> = {};
  for (const type of planItemTypes) {
    slugToTypeId[type.slug] = type.id;
  }

  const createdItems: Array<{ id: string; name: string; itemType: string; parentId: string | null }> = [];

  // Process plan items recursively in a transaction
  await prisma.$transaction(async (tx) => {
    async function createItemsRecursively(
      items: PlanItemToCreate[],
      parentId: string | null,
      path: string,
      depth: number
    ): Promise<void> {
      let sortOrder = 0;

      for (const item of items) {
        const typeId = slugToTypeId[item.itemType];
        if (!typeId) {
          console.warn(`Unknown item type: ${item.itemType}, skipping`);
          continue;
        }

        // Parse dates if provided
        let startDate: Date | undefined;
        let targetEndDate: Date | undefined;

        if (item.startDate) {
          const parsed = new Date(item.startDate);
          if (!isNaN(parsed.getTime())) startDate = parsed;
        }

        if (item.targetEndDate) {
          const parsed = new Date(item.targetEndDate);
          if (!isNaN(parsed.getTime())) targetEndDate = parsed;
        }

        // Create the plan item
        const created = await tx.planItem.create({
          data: {
            projectId,
            parentId,
            itemTypeId: typeId,
            name: item.name,
            description: item.description || null,
            owner: item.owner || null,
            status: item.status || 'not_started',
            startDate,
            targetEndDate,
            notes: item.estimatedDuration ? `Estimated duration: ${item.estimatedDuration}` : null,
            path,
            depth,
            sortOrder: sortOrder++,
          },
          include: {
            itemType: { select: { name: true, slug: true } },
          },
        });

        createdItems.push({
          id: created.id,
          name: created.name,
          itemType: created.itemType.slug,
          parentId: created.parentId,
        });

        // Recursively create children
        if (item.children && item.children.length > 0) {
          const newPath = path ? `${path}/${created.id}` : `/${created.id}`;
          await createItemsRecursively(
            item.children,
            created.id,
            newPath,
            depth + 1
          );
        }
      }
    }

    // Start creating from root level
    await createItemsRecursively(input.planItems, null, '', 0);
  });

  return {
    created: createdItems.length,
    items: createdItems,
  };
}

/**
 * Helper function to build item path string
 */
function buildItemPath(
  item: { id: string; name: string; parentId: string | null },
  allItems: Array<{ id: string; name: string; parentId: string | null }>
): string {
  const path: string[] = [item.name];
  let currentParentId = item.parentId;

  while (currentParentId) {
    const parent = allItems.find(i => i.id === currentParentId);
    if (parent) {
      path.unshift(parent.name);
      currentParentId = parent.parentId;
    } else {
      break;
    }
  }

  return path.join(' > ');
}

export default {
  analyzePlanContent,
  createPlanFromSuggestions,
};
