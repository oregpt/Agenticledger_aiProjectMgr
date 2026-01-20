import prisma from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';

// Import default prompts for reset functionality
import * as intakeAgentPrompts from '../../services/ai/prompts/intake-agent.js';
import * as activityReporterPrompts from '../../services/ai/prompts/activity-reporter.js';
import * as planUpdaterPrompts from '../../services/ai/prompts/plan-updater.js';
import * as planCreatorPrompts from '../../services/ai/prompts/plan-creator.js';

export interface PromptTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

// Default templates configuration - used for seeding and reset
export const DEFAULT_TEMPLATES = {
  'intake-agent': {
    name: 'Intake Agent',
    description: 'Analyzes incoming content (meeting notes, emails, documents) to extract structured project information',
    category: 'agent',
    variables: [
      { name: 'projectName', description: 'The name of the project', required: true },
      { name: 'planItems', description: 'List of plan items with paths and IDs', required: true },
      { name: 'contentTypes', description: 'Available content types', required: true },
      { name: 'activityTypes', description: 'Available activity types', required: true },
      { name: 'userSelectedContentTypes', description: 'Content types already selected by user', required: false },
      { name: 'userSelectedActivityTypes', description: 'Activity types already selected by user', required: false },
      { name: 'userSelectedPlanItems', description: 'Plan items already linked by user', required: false },
      { name: 'userTitle', description: 'Title provided by user', required: false },
      { name: 'userDate', description: 'Date provided by user', required: false },
    ] as PromptTemplateVariable[],
  },
  'activity-reporter': {
    name: 'Activity Reporter',
    description: 'Generates comprehensive activity reports from project content using RAG',
    category: 'agent',
    variables: [
      { name: 'projectName', description: 'The name of the project', required: true },
      { name: 'periodStart', description: 'Report period start date (YYYY-MM-DD)', required: true },
      { name: 'periodEnd', description: 'Report period end date (YYYY-MM-DD)', required: true },
      { name: 'planItems', description: 'List of plan items with status', required: true },
      { name: 'contentChunks', description: 'Retrieved content chunks for analysis', required: true },
    ] as PromptTemplateVariable[],
  },
  'plan-updater': {
    name: 'Plan Updater',
    description: 'Suggests plan item updates based on activity reports and project progress',
    category: 'agent',
    variables: [
      { name: 'projectName', description: 'The name of the project', required: true },
      { name: 'periodStart', description: 'Report period start date', required: true },
      { name: 'periodEnd', description: 'Report period end date', required: true },
      { name: 'planItems', description: 'Current plan items with details', required: true },
      { name: 'statusUpdates', description: 'Status updates from activity report', required: true },
      { name: 'actionItems', description: 'Action items from activity report', required: true },
      { name: 'risks', description: 'Risks from activity report', required: true },
      { name: 'blockers', description: 'Blockers from activity report', required: true },
      { name: 'sourceContentIds', description: 'Source content IDs for evidence', required: true },
    ] as PromptTemplateVariable[],
  },
  'plan-creator': {
    name: 'Plan Creator',
    description: 'Generates structured project plans from requirements and descriptions',
    category: 'agent',
    variables: [
      { name: 'projectName', description: 'The name of the project', required: true },
      { name: 'projectDescription', description: 'Project description or requirements', required: true },
      { name: 'existingPlanItems', description: 'Existing plan items for context', required: false },
      { name: 'additionalContext', description: 'Additional context or constraints', required: false },
      { name: 'planItemTypes', description: 'Available plan item types', required: false },
    ] as PromptTemplateVariable[],
  },
};

/**
 * Get all prompt templates
 */
export const getAllTemplates = async () => {
  const templates = await prisma.promptTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return templates;
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (category: string) => {
  const templates = await prisma.promptTemplate.findMany({
    where: { category, isActive: true },
    orderBy: { name: 'asc' },
  });

  return templates;
};

/**
 * Get a single template by slug
 */
export const getTemplate = async (slug: string) => {
  const template = await prisma.promptTemplate.findUnique({
    where: { slug },
  });

  if (!template) {
    throw new AppError(ErrorCodes.NOT_FOUND, `Prompt template '${slug}' not found`, 404);
  }

  return template;
};

/**
 * Get template by slug (returns null if not found - for internal use)
 */
export const getTemplateOrNull = async (slug: string) => {
  return prisma.promptTemplate.findUnique({
    where: { slug },
  });
};

/**
 * Update a prompt template
 */
export const updateTemplate = async (
  slug: string,
  data: {
    systemPrompt?: string;
    userPromptTemplate?: string;
    name?: string;
    description?: string;
  },
  updatedBy?: { userId?: number; email?: string }
) => {
  const template = await prisma.promptTemplate.findUnique({
    where: { slug },
  });

  if (!template) {
    throw new AppError(ErrorCodes.NOT_FOUND, `Prompt template '${slug}' not found`, 404);
  }

  const updated = await prisma.promptTemplate.update({
    where: { slug },
    data: {
      ...data,
      version: { increment: 1 },
      updatedByUserId: updatedBy?.userId,
      updatedByEmail: updatedBy?.email,
    },
  });

  return updated;
};

/**
 * Reset a template to its default prompts
 */
export const resetTemplate = async (
  slug: string,
  updatedBy?: { userId?: number; email?: string }
) => {
  const template = await prisma.promptTemplate.findUnique({
    where: { slug },
  });

  if (!template) {
    throw new AppError(ErrorCodes.NOT_FOUND, `Prompt template '${slug}' not found`, 404);
  }

  const defaults = getDefaultPrompts(slug);
  if (!defaults) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, `No default prompts available for '${slug}'`, 400);
  }

  const updated = await prisma.promptTemplate.update({
    where: { slug },
    data: {
      systemPrompt: defaults.systemPrompt,
      userPromptTemplate: defaults.userPromptTemplate,
      version: { increment: 1 },
      updatedByUserId: updatedBy?.userId,
      updatedByEmail: updatedBy?.email,
    },
  });

  return updated;
};

/**
 * Get default prompts for a template slug
 */
export const getDefaultPrompts = (slug: string): { systemPrompt: string; userPromptTemplate: string } | null => {
  switch (slug) {
    case 'intake-agent':
      // For intake-agent, we need to call with a mock context to get the template
      return {
        systemPrompt: intakeAgentPrompts.getIntakeAgentSystemPrompt({
          projectName: '{{projectName}}',
          planItems: [],
          contentTypes: [],
          activityTypes: [],
        }),
        userPromptTemplate: intakeAgentPrompts.getIntakeAgentUserPrompt('{{content}}'),
      };
    case 'activity-reporter':
      return {
        systemPrompt: activityReporterPrompts.getActivityReporterSystemPrompt(),
        userPromptTemplate: activityReporterPrompts.getActivityReporterUserPrompt(
          {
            projectName: '{{projectName}}',
            periodStart: '{{periodStart}}',
            periodEnd: '{{periodEnd}}',
            planItems: [],
            contentTypes: [],
            activityTypes: [],
          },
          []
        ),
      };
    case 'plan-updater':
      return {
        systemPrompt: planUpdaterPrompts.getPlanUpdaterSystemPrompt(),
        userPromptTemplate: planUpdaterPrompts.getPlanUpdaterUserPrompt(
          '{{projectName}}',
          '{{periodStart}}',
          '{{periodEnd}}',
          [],
          { statusUpdates: [], actionItems: [], risks: [], blockers: [] },
          []
        ),
      };
    case 'plan-creator':
      return {
        systemPrompt: planCreatorPrompts.getPlanCreatorSystemPrompt(),
        userPromptTemplate: planCreatorPrompts.getPlanCreatorUserPrompt({
          projectName: '{{projectName}}',
          projectDescription: '{{projectDescription}}',
        }),
      };
    default:
      return null;
  }
};

/**
 * Seed all default templates (used in database seeding)
 */
/**
 * Get prompts for a template (from DB if available, otherwise from defaults)
 * This is the main function AI services should use
 */
export const getPromptsForAgent = async (
  slug: string
): Promise<{ systemPrompt: string; userPromptTemplate: string } | null> => {
  // Try to get from database first
  const template = await getTemplateOrNull(slug);

  if (template && template.isActive) {
    return {
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
    };
  }

  // Fall back to hardcoded defaults
  return getDefaultPrompts(slug);
};

export const seedDefaultTemplates = async () => {
  const results = [];

  for (const [slug, config] of Object.entries(DEFAULT_TEMPLATES)) {
    const defaults = getDefaultPrompts(slug);
    if (!defaults) continue;

    const existing = await prisma.promptTemplate.findUnique({
      where: { slug },
    });

    if (existing) {
      results.push({ slug, action: 'skipped', reason: 'already exists' });
      continue;
    }

    const template = await prisma.promptTemplate.create({
      data: {
        slug,
        name: config.name,
        description: config.description,
        category: config.category,
        systemPrompt: defaults.systemPrompt,
        userPromptTemplate: defaults.userPromptTemplate,
        variables: config.variables as unknown as Prisma.InputJsonValue,
        isSystem: true,
        isActive: true,
      },
    });

    results.push({ slug, action: 'created', id: template.id });
  }

  return results;
};
