/**
 * Activity Reporter Service
 * Handles generating activity reports from project content using RAG
 */

import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { generateJsonCompletion, isOpenAIConfigured } from '../../services/ai/openai.service';
import { searchProjectChunks } from '../../services/ai/embedding.service';
import {
  getActivityReporterSystemPrompt,
  getActivityReporterUserPrompt,
  type ReportContext,
  type ReportChunk,
  type ReportResult,
} from '../../services/ai/prompts/activity-reporter';
import type { GenerateReportInput, ListReportsQuery } from './activity-reporter.schema';

/**
 * Generate an activity report for a project
 */
export async function generateReport(
  projectId: string,
  organizationId: number,
  input: GenerateReportInput,
  userId?: number
): Promise<{
  report: {
    id: string;
    title: string;
    periodStart: Date;
    periodEnd: Date;
    summary: string;
    reportData: ReportResult;
    sourceContentIds: string[];
    createdAt: Date;
  };
  context: ReportContext;
}> {
  const startTime = Date.now();

  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Get plan items for context
  const planItems = await prisma.planItem.findMany({
    where: {
      projectId,
      isActive: true,
      ...(input.workstreamFilter && input.workstreamFilter.length > 0
        ? {
            OR: [
              { id: { in: input.workstreamFilter } },
              { path: { contains: input.workstreamFilter[0] } },
            ],
          }
        : {}),
    },
    include: {
      itemType: true,
    },
    orderBy: [{ path: 'asc' }, { sortOrder: 'asc' }],
  });

  // Get content types and activity types for context
  const [contentTypes, activityTypes] = await Promise.all([
    prisma.contentType.findMany({
      where: {
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
    }),
    prisma.activityItemType.findMany({
      where: {
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
    }),
  ]);

  // Build context
  const context: ReportContext = {
    projectName: project.name,
    periodStart: input.periodStart.toISOString().split('T')[0],
    periodEnd: input.periodEnd.toISOString().split('T')[0],
    planItems: planItems.map(p => ({
      id: p.id,
      name: p.name,
      fullPath: buildPlanItemPath(p, planItems),
      status: p.status,
      itemType: p.itemType.name,
    })),
    contentTypes: contentTypes.map(ct => ({
      id: ct.id,
      name: ct.name,
      slug: ct.slug,
    })),
    activityTypes: activityTypes.map(at => ({
      id: at.id,
      name: at.name,
      slug: at.slug,
    })),
  };

  // Get content items for the period
  const contentItems = await prisma.contentItem.findMany({
    where: {
      projectId,
      isActive: true,
      dateOccurred: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
      ...(input.activityTypeFilter && input.activityTypeFilter.length > 0
        ? { activityTypeIds: { hasSome: input.activityTypeFilter } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      dateOccurred: true,
      sourceType: true,
      rawContent: true,
      aiSummary: true,
    },
    orderBy: { dateOccurred: 'desc' },
  });

  // Build chunks for the prompt
  // First, try to use vector search for relevant chunks
  let chunks: ReportChunk[] = [];
  const sourceContentIds = new Set<string>();

  if (isOpenAIConfigured() && contentItems.length > 0) {
    // Use RAG to find relevant chunks based on a summary query
    const searchQuery = `Project status update for ${project.name} from ${context.periodStart} to ${context.periodEnd}. Progress, milestones, action items, risks, decisions, blockers.`;

    try {
      const searchResults = await searchProjectChunks(projectId, searchQuery, {
        topK: 30,
        minSimilarity: 0.5,
        startDate: input.periodStart,
        endDate: input.periodEnd,
      });

      chunks = searchResults.map(r => {
        sourceContentIds.add(r.contentItemId);
        return {
          contentItemId: r.contentItemId,
          contentItemTitle: r.contentItem.title,
          dateOccurred: r.contentItem.dateOccurred.toISOString().split('T')[0],
          sourceType: r.contentItem.sourceType,
          chunkText: r.chunkText,
          similarity: r.similarity,
        };
      });
    } catch {
      // Fall back to using raw content if vector search fails
      console.warn('Vector search failed, falling back to raw content');
    }
  }

  // If no chunks from vector search, use raw content directly
  if (chunks.length === 0) {
    for (const item of contentItems) {
      sourceContentIds.add(item.id);
      const content = item.aiSummary || item.rawContent || '';
      if (content.trim()) {
        chunks.push({
          contentItemId: item.id,
          contentItemTitle: item.title,
          dateOccurred: item.dateOccurred.toISOString().split('T')[0],
          sourceType: item.sourceType,
          chunkText: content.slice(0, 3000), // Limit chunk size
          similarity: 1.0,
        });
      }
    }
  }

  // Generate report using AI
  let reportResult: ReportResult;

  if (isOpenAIConfigured()) {
    const systemPrompt = getActivityReporterSystemPrompt();
    const userPrompt = getActivityReporterUserPrompt(context, chunks);

    const aiResponse = await generateJsonCompletion<ReportResult>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Validate and filter the response
    reportResult = validateReportResult(aiResponse, planItems.map(p => p.id), Array.from(sourceContentIds));
  } else {
    // Return empty report if OpenAI is not configured
    reportResult = {
      summary: 'AI analysis is not available. Please configure OPENAI_API_KEY to enable automatic report generation.',
      statusUpdates: [],
      actionItems: [],
      risks: [],
      decisions: [],
      blockers: [],
      suggestedPlanUpdates: [],
    };
  }

  const generationDurationMs = Date.now() - startTime;

  // Generate title if not provided
  const title = input.title || `Activity Report: ${context.periodStart} to ${context.periodEnd}`;

  // Save the report - check if table exists first
  let savedReport;
  try {
    savedReport = await prisma.activityReport.create({
      data: {
        projectId,
        title,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        workstreamFilter: input.workstreamFilter || [],
        activityTypeFilter: input.activityTypeFilter || [],
        summary: reportResult.summary,
        reportData: reportResult as unknown as Prisma.InputJsonValue,
        sourceContentIds: Array.from(sourceContentIds),
        sourceChunkIds: chunks.map(c => c.contentItemId),
        generatedByUserId: userId,
        generationDurationMs,
      },
    });
  } catch (e: unknown) {
    // If table doesn't exist yet (migration not run), return report without saving
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (errorMessage.includes('does not exist')) {
      console.warn('ActivityReport table does not exist yet. Returning report without saving.');
      savedReport = {
        id: 'temp-' + Date.now(),
        title,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        summary: reportResult.summary,
        sourceContentIds: Array.from(sourceContentIds),
        createdAt: new Date(),
      };
    } else {
      throw e;
    }
  }

  return {
    report: {
      id: savedReport.id,
      title: savedReport.title,
      periodStart: savedReport.periodStart,
      periodEnd: savedReport.periodEnd,
      summary: savedReport.summary,
      reportData: reportResult,
      sourceContentIds: Array.from(sourceContentIds),
      createdAt: savedReport.createdAt,
    },
    context,
  };
}

/**
 * List activity reports for a project
 */
export async function listReports(
  projectId: string,
  organizationId: number,
  query: ListReportsQuery
): Promise<{
  items: Array<{
    id: string;
    title: string;
    periodStart: Date;
    periodEnd: Date;
    summary: string;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
    throw new Error('Project not found');
  }

  const where = {
    projectId,
    isActive: true,
    ...(query.startDate && query.endDate
      ? {
          periodStart: { gte: query.startDate },
          periodEnd: { lte: query.endDate },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.activityReport.findMany({
      where,
      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        summary: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.activityReport.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/**
 * Get a single report with full data
 */
export async function getReport(
  reportId: string,
  projectId: string,
  organizationId: number
): Promise<{
  id: string;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  reportData: ReportResult;
  sourceContentIds: string[];
  workstreamFilter: string[];
  activityTypeFilter: number[];
  generationDurationMs: number | null;
  createdAt: Date;
} | null> {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    return null;
  }

  const report = await prisma.activityReport.findFirst({
    where: {
      id: reportId,
      projectId,
      isActive: true,
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    title: report.title,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    summary: report.summary,
    reportData: report.reportData as unknown as ReportResult,
    sourceContentIds: report.sourceContentIds,
    workstreamFilter: report.workstreamFilter,
    activityTypeFilter: report.activityTypeFilter,
    generationDurationMs: report.generationDurationMs,
    createdAt: report.createdAt,
  };
}

/**
 * Get source content items for a report
 */
export async function getReportSources(
  reportId: string,
  projectId: string,
  organizationId: number
): Promise<Array<{
  id: string;
  title: string;
  dateOccurred: Date;
  sourceType: string;
  rawContent: string | null;
  aiSummary: string | null;
}>> {
  // Get report
  const report = await getReport(reportId, projectId, organizationId);
  if (!report) {
    return [];
  }

  const contentItems = await prisma.contentItem.findMany({
    where: {
      id: { in: report.sourceContentIds },
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      dateOccurred: true,
      sourceType: true,
      rawContent: true,
      aiSummary: true,
    },
    orderBy: { dateOccurred: 'desc' },
  });

  return contentItems;
}

// Helper functions

function buildPlanItemPath(
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

function validateReportResult(
  result: ReportResult,
  validPlanItemIds: string[],
  validContentIds: string[]
): ReportResult {
  const planItemSet = new Set(validPlanItemIds);
  const contentIdSet = new Set(validContentIds);

  // Helper to filter valid IDs
  const filterPlanItemId = (id: string | null): string | null =>
    id && planItemSet.has(id) ? id : null;

  const filterContentIds = (ids: string[]): string[] =>
    ids.filter(id => contentIdSet.has(id));

  return {
    summary: result.summary || 'No summary available.',
    statusUpdates: (result.statusUpdates || []).map(su => ({
      ...su,
      planItemId: filterPlanItemId(su.planItemId),
      sourceContentIds: filterContentIds(su.sourceContentIds || []),
    })),
    actionItems: (result.actionItems || []).map(ai => ({
      ...ai,
      planItemId: filterPlanItemId(ai.planItemId),
      sourceContentIds: filterContentIds(ai.sourceContentIds || []),
    })),
    risks: (result.risks || []).map(r => ({
      ...r,
      planItemId: filterPlanItemId(r.planItemId),
      sourceContentIds: filterContentIds(r.sourceContentIds || []),
    })),
    decisions: (result.decisions || []).map(d => ({
      ...d,
      planItemId: filterPlanItemId(d.planItemId),
      sourceContentIds: filterContentIds(d.sourceContentIds || []),
    })),
    blockers: (result.blockers || []).map(b => ({
      ...b,
      planItemId: filterPlanItemId(b.planItemId),
      sourceContentIds: filterContentIds(b.sourceContentIds || []),
    })),
    suggestedPlanUpdates: (result.suggestedPlanUpdates || []).filter(
      su => planItemSet.has(su.planItemId)
    ),
  };
}

export default {
  generateReport,
  listReports,
  getReport,
  getReportSources,
};
