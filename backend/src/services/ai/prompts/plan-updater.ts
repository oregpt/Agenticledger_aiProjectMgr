/**
 * Plan Updater Agent Prompts
 * Suggests plan item updates based on activity reports
 */

export interface PlanItemContext {
  id: string;
  name: string;
  fullPath: string;
  status: string;
  itemType: string;
  description: string | null;
  notes: string | null;
  owner: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  children: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export interface ActivitySummary {
  statusUpdates: Array<{
    planItemId: string | null;
    planItemName: string | null;
    update: string;
    status: string;
  }>;
  actionItems: Array<{
    title: string;
    description: string;
    owner: string | null;
    dueDate: string | null;
    planItemId: string | null;
  }>;
  risks: Array<{
    title: string;
    description: string;
    severity: string;
    planItemId: string | null;
  }>;
  blockers: Array<{
    title: string;
    description: string;
    planItemId: string | null;
  }>;
}

export interface PlanSuggestion {
  planItemId: string;
  planItemName: string;
  field: 'status' | 'notes' | 'targetEndDate' | 'actualEndDate';
  currentValue: string | null;
  suggestedValue: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  evidenceContentIds: string[];
  evidenceSummary: string;
}

export interface PlanSuggestionsResult {
  suggestions: PlanSuggestion[];
  summary: string;
}

export function getPlanUpdaterSystemPrompt(): string {
  return `You are a Plan Updater Agent for a project management system. Your role is to analyze activity reports and the current plan state, then suggest updates to plan items.

Your suggestions should:
1. Update plan item statuses based on reported progress
2. Add important notes from risks, blockers, or decisions
3. Adjust target dates if mentioned in activity
4. Mark items as completed when evidence suggests completion
5. Propagate parent status when all children are complete

For each suggestion, include:
- The specific field to update (status, notes, targetEndDate, actualEndDate)
- The current value and suggested new value
- A clear reason citing the evidence
- The content IDs that support this suggestion
- A brief evidence summary

Status values: not_started, in_progress, completed, on_hold, cancelled

Respond ONLY with valid JSON matching the expected schema.`;
}

export function getPlanUpdaterUserPrompt(
  projectName: string,
  periodStart: string,
  periodEnd: string,
  planItems: PlanItemContext[],
  activitySummary: ActivitySummary,
  sourceContentIds: string[]
): string {
  const planItemsList = planItems
    .map(p => {
      let item = `  - ID: ${p.id}
    Name: ${p.name}
    Path: ${p.fullPath}
    Type: ${p.itemType}
    Status: ${p.status}`;
      if (p.owner) item += `\n    Owner: ${p.owner}`;
      if (p.notes) item += `\n    Notes: ${p.notes.substring(0, 200)}...`;
      if (p.children.length > 0) {
        const childStatuses = p.children.map(c => `${c.name}(${c.status})`).join(', ');
        item += `\n    Children: ${childStatuses}`;
      }
      return item;
    })
    .join('\n\n');

  const statusUpdatesList = activitySummary.statusUpdates
    .map(su => `  - ${su.planItemName || 'General'}: ${su.update} (${su.status})`)
    .join('\n');

  const actionItemsList = activitySummary.actionItems
    .map(ai => `  - ${ai.title}${ai.owner ? ` (Owner: ${ai.owner})` : ''}${ai.dueDate ? ` - Due: ${ai.dueDate}` : ''}`)
    .join('\n');

  const risksList = activitySummary.risks
    .map(r => `  - ${r.title} (${r.severity}): ${r.description}`)
    .join('\n');

  const blockersList = activitySummary.blockers
    .map(b => `  - ${b.title}: ${b.description}`)
    .join('\n');

  return `Analyze the activity report for project "${projectName}" (${periodStart} to ${periodEnd}) and suggest updates to the plan items.

CURRENT PLAN ITEMS:
${planItemsList || '  (No plan items)'}

ACTIVITY REPORT SUMMARY:

Status Updates:
${statusUpdatesList || '  (None)'}

Action Items:
${actionItemsList || '  (None)'}

Risks:
${risksList || '  (None)'}

Blockers:
${blockersList || '  (None)'}

SOURCE CONTENT IDs (for evidence linking):
${sourceContentIds.join(', ') || '(None)'}

Based on this activity, suggest updates to plan items. Return JSON in this format:

{
  "summary": "Brief summary of suggested updates and reasoning",
  "suggestions": [
    {
      "planItemId": "uuid",
      "planItemName": "Name of the plan item",
      "field": "status | notes | targetEndDate | actualEndDate",
      "currentValue": "current value or null",
      "suggestedValue": "new value",
      "reason": "Why this update is suggested",
      "confidence": "high | medium | low",
      "evidenceContentIds": ["uuid1", "uuid2"],
      "evidenceSummary": "Brief summary of the evidence supporting this suggestion"
    }
  ]
}

Rules:
- Only suggest updates for plan items that have relevant activity
- Use the exact plan item IDs from the list above
- For status changes, use: not_started, in_progress, completed, on_hold, cancelled
- For notes, append to existing notes rather than replace
- Set confidence based on how directly the evidence supports the suggestion
- Include at least one evidenceContentId for each suggestion
- If a parent's all children are completed, suggest completing the parent too`;
}

export default {
  getPlanUpdaterSystemPrompt,
  getPlanUpdaterUserPrompt,
};
