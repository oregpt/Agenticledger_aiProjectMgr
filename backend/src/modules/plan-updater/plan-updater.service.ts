/**
 * Plan Updater Service
 * Suggests and applies plan item updates based on activity reports
 */

import prisma from '../../config/database';
import { generateJsonCompletion, isOpenAIConfigured } from '../../services/ai/openai.service';
import { generateReport } from '../activity-reporter/activity-reporter.service';
import {
  getPlanUpdaterSystemPrompt,
  getPlanUpdaterUserPrompt,
  type PlanItemContext,
  type ActivitySummary,
  type PlanSuggestion,
  type PlanSuggestionsResult,
} from '../../services/ai/prompts/plan-updater';
import type { GetPlanSuggestionsInput, ApplyPlanUpdatesInput } from './plan-updater.schema';

/**
 * Get AI-generated plan update suggestions based on activity
 */
export async function getPlanSuggestions(
  projectId: string,
  organizationId: number,
  input: GetPlanSuggestionsInput,
  userId?: number
): Promise<{
  suggestions: PlanSuggestion[];
  summary: string;
  activityReportId: string | null;
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

  // First, generate or get an activity report for the period
  const reportResult = await generateReport(projectId, organizationId, {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    workstreamFilter: input.workstreamFilter,
    activityTypeFilter: [],
  }, userId);

  const activityReport = reportResult.report;

  // Get plan items with their children for context
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
      children: {
        where: { isActive: true },
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: [{ path: 'asc' }, { sortOrder: 'asc' }],
  });

  // Build plan item contexts
  const planItemContexts: PlanItemContext[] = planItems.map(p => ({
    id: p.id,
    name: p.name,
    fullPath: buildPlanItemPath(p, planItems),
    status: p.status,
    itemType: p.itemType.name,
    description: p.description,
    notes: p.notes,
    owner: p.owner,
    startDate: p.startDate?.toISOString().split('T')[0] || null,
    targetEndDate: p.targetEndDate?.toISOString().split('T')[0] || null,
    children: p.children.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
    })),
  }));

  // Build activity summary from the report
  const reportData = activityReport.reportData;
  const activitySummary: ActivitySummary = {
    statusUpdates: reportData.statusUpdates.map(su => ({
      planItemId: su.planItemId,
      planItemName: su.planItemName,
      update: su.update,
      status: su.status,
    })),
    actionItems: reportData.actionItems.map(ai => ({
      title: ai.title,
      description: ai.description,
      owner: ai.owner,
      dueDate: ai.dueDate,
      planItemId: ai.planItemId,
    })),
    risks: reportData.risks.map(r => ({
      title: r.title,
      description: r.description,
      severity: r.severity,
      planItemId: r.planItemId,
    })),
    blockers: reportData.blockers.map(b => ({
      title: b.title,
      description: b.description,
      planItemId: b.planItemId,
    })),
  };

  if (!isOpenAIConfigured()) {
    return {
      suggestions: [],
      summary: 'AI analysis is not available. Please configure OPENAI_API_KEY to enable plan suggestions.',
      activityReportId: activityReport.id,
    };
  }

  // Generate suggestions using AI
  const systemPrompt = getPlanUpdaterSystemPrompt();
  const userPrompt = getPlanUpdaterUserPrompt(
    project.name,
    input.periodStart.toISOString().split('T')[0],
    input.periodEnd.toISOString().split('T')[0],
    planItemContexts,
    activitySummary,
    activityReport.sourceContentIds
  );

  const result = await generateJsonCompletion<PlanSuggestionsResult>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  // Validate suggestions against actual plan item IDs
  const validPlanItemIds = new Set(planItems.map(p => p.id));
  const validContentIds = new Set(activityReport.sourceContentIds);

  const validatedSuggestions = (result.suggestions || [])
    .filter(s => validPlanItemIds.has(s.planItemId))
    .map(s => ({
      ...s,
      evidenceContentIds: (s.evidenceContentIds || []).filter(id => validContentIds.has(id)),
    }));

  return {
    suggestions: validatedSuggestions,
    summary: result.summary || 'No suggestions generated.',
    activityReportId: activityReport.id,
  };
}

/**
 * Apply selected plan updates
 */
export async function applyPlanUpdates(
  projectId: string,
  organizationId: number,
  input: ApplyPlanUpdatesInput,
  userId?: number,
  userEmail?: string
): Promise<{
  updated: number;
  historyRecords: number;
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

  // Verify all plan items belong to this project
  const planItems = await prisma.planItem.findMany({
    where: {
      id: { in: input.updates.map(u => u.planItemId) },
      projectId,
      isActive: true,
    },
  });

  const validPlanItemIds = new Set(planItems.map(p => p.id));
  const validUpdates = input.updates.filter(u => validPlanItemIds.has(u.planItemId));

  if (validUpdates.length === 0) {
    return { updated: 0, historyRecords: 0 };
  }

  // Apply updates in a transaction
  let historyRecords = 0;

  await prisma.$transaction(async (tx) => {
    for (const update of validUpdates) {
      const planItem = planItems.find(p => p.id === update.planItemId)!;
      let oldValue: string | null = null;
      let updateData: Record<string, unknown> = {};

      switch (update.field) {
        case 'status':
          oldValue = planItem.status;
          updateData = { status: update.value };
          break;
        case 'notes':
          oldValue = planItem.notes;
          // Append to existing notes
          const newNotes = planItem.notes
            ? `${planItem.notes}\n\n[${new Date().toISOString().split('T')[0]}] ${update.value}`
            : `[${new Date().toISOString().split('T')[0]}] ${update.value}`;
          updateData = { notes: newNotes };
          break;
        case 'targetEndDate':
          oldValue = planItem.targetEndDate?.toISOString().split('T')[0] || null;
          updateData = { targetEndDate: new Date(update.value) };
          break;
        case 'actualEndDate':
          oldValue = planItem.actualEndDate?.toISOString().split('T')[0] || null;
          updateData = { actualEndDate: new Date(update.value) };
          break;
      }

      // Update the plan item
      await tx.planItem.update({
        where: { id: update.planItemId },
        data: {
          ...updateData,
          references: {
            push: update.evidenceContentIds,
          },
        },
      });

      // Create history record
      await tx.planItemHistory.create({
        data: {
          planItemId: update.planItemId,
          field: update.field,
          oldValue,
          newValue: update.value,
          changedByUserId: userId,
          changedByEmail: userEmail,
          changeReason: update.reason,
        },
      });

      historyRecords++;
    }
  });

  return {
    updated: validUpdates.length,
    historyRecords,
  };
}

// Helper function
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

export default {
  getPlanSuggestions,
  applyPlanUpdates,
};
