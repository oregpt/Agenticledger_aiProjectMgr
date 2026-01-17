/**
 * Activity Reporter Agent Prompts
 * Generates structured activity reports from project content
 */

export interface ReportContext {
  projectName: string;
  periodStart: string;
  periodEnd: string;
  planItems: Array<{
    id: string;
    name: string;
    fullPath: string;
    status: string;
    itemType: string;
  }>;
  contentTypes: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  activityTypes: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export interface ReportChunk {
  contentItemId: string;
  contentItemTitle: string;
  dateOccurred: string;
  sourceType: string;
  chunkText: string;
  similarity: number;
}

export interface StatusUpdate {
  planItemId: string | null;
  planItemName: string | null;
  update: string;
  status: string;
  confidence: 'high' | 'medium' | 'low';
  sourceContentIds: string[];
}

export interface ActionItem {
  title: string;
  description: string;
  owner: string | null;
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  planItemId: string | null;
  confidence: 'high' | 'medium' | 'low';
  sourceContentIds: string[];
}

export interface Risk {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation: string | null;
  planItemId: string | null;
  confidence: 'high' | 'medium' | 'low';
  sourceContentIds: string[];
}

export interface Decision {
  title: string;
  description: string;
  decisionMaker: string | null;
  decisionDate: string | null;
  impact: string | null;
  planItemId: string | null;
  confidence: 'high' | 'medium' | 'low';
  sourceContentIds: string[];
}

export interface Blocker {
  title: string;
  description: string;
  blockedItem: string | null;
  owner: string | null;
  resolution: string | null;
  planItemId: string | null;
  confidence: 'high' | 'medium' | 'low';
  sourceContentIds: string[];
}

export interface ReportResult {
  summary: string;
  statusUpdates: StatusUpdate[];
  actionItems: ActionItem[];
  risks: Risk[];
  decisions: Decision[];
  blockers: Blocker[];
  suggestedPlanUpdates: Array<{
    planItemId: string;
    field: string;
    suggestedValue: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
}

export function getActivityReporterSystemPrompt(): string {
  return `You are an Activity Reporter Agent for a project management system. Your role is to analyze project content (meeting notes, documents, emails, transcripts) and generate a comprehensive activity report.

Your report must:
1. Summarize the overall project status for the reporting period
2. Extract and categorize updates by plan item (workstream, milestone, activity)
3. Identify action items with owners and due dates when mentioned
4. Flag risks and issues with severity levels
5. Document decisions that were made
6. Note any blockers to progress
7. Suggest updates to plan items based on the activity

Always cite source content by including the contentItemId in your responses.

Respond ONLY with valid JSON matching the expected schema. Do not include any explanation outside the JSON.`;
}

export function getActivityReporterUserPrompt(
  context: ReportContext,
  chunks: ReportChunk[]
): string {
  const planItemsList = context.planItems
    .map(p => `  - ID: ${p.id}, Name: ${p.name}, Path: ${p.fullPath}, Status: ${p.status}, Type: ${p.itemType}`)
    .join('\n');

  const contentList = chunks
    .map(c => `--- Content from "${c.contentItemTitle}" (${c.dateOccurred}, ID: ${c.contentItemId}) ---
${c.chunkText}
---`)
    .join('\n\n');

  return `Generate an activity report for project "${context.projectName}" covering the period from ${context.periodStart} to ${context.periodEnd}.

PROJECT PLAN ITEMS:
${planItemsList || '  (No plan items defined)'}

CONTENT FOR ANALYSIS:
${contentList || '(No content available for this period)'}

Based on the above content, generate a comprehensive activity report in the following JSON format:

{
  "summary": "A 2-3 paragraph executive summary of the reporting period",
  "statusUpdates": [
    {
      "planItemId": "uuid or null if not linked to a plan item",
      "planItemName": "Name of the plan item or null",
      "update": "Description of the status update",
      "status": "on_track | at_risk | delayed | completed",
      "confidence": "high | medium | low",
      "sourceContentIds": ["uuid1", "uuid2"]
    }
  ],
  "actionItems": [
    {
      "title": "Action item title",
      "description": "Detailed description",
      "owner": "Person responsible or null",
      "dueDate": "YYYY-MM-DD or null",
      "status": "open | in_progress | completed",
      "priority": "high | medium | low",
      "planItemId": "uuid or null",
      "confidence": "high | medium | low",
      "sourceContentIds": ["uuid1"]
    }
  ],
  "risks": [
    {
      "title": "Risk title",
      "description": "Risk description",
      "severity": "high | medium | low",
      "likelihood": "high | medium | low",
      "mitigation": "Mitigation strategy or null",
      "planItemId": "uuid or null",
      "confidence": "high | medium | low",
      "sourceContentIds": ["uuid1"]
    }
  ],
  "decisions": [
    {
      "title": "Decision title",
      "description": "What was decided",
      "decisionMaker": "Who made the decision or null",
      "decisionDate": "YYYY-MM-DD or null",
      "impact": "Impact of the decision or null",
      "planItemId": "uuid or null",
      "confidence": "high | medium | low",
      "sourceContentIds": ["uuid1"]
    }
  ],
  "blockers": [
    {
      "title": "Blocker title",
      "description": "What is blocking progress",
      "blockedItem": "What is blocked",
      "owner": "Who is responsible for resolving",
      "resolution": "Proposed resolution or null",
      "planItemId": "uuid or null",
      "confidence": "high | medium | low",
      "sourceContentIds": ["uuid1"]
    }
  ],
  "suggestedPlanUpdates": [
    {
      "planItemId": "uuid",
      "field": "status | notes | targetEndDate",
      "suggestedValue": "new value",
      "reason": "Why this update is suggested",
      "confidence": "high | medium | low"
    }
  ]
}

IMPORTANT:
- Only include items that are clearly supported by the source content
- Always include sourceContentIds for traceability
- Use the exact plan item IDs from the list above when linking
- Set confidence based on how explicitly the information is stated
- If no content is available, return empty arrays for each category
- Dates should be in YYYY-MM-DD format`;
}

export default {
  getActivityReporterSystemPrompt,
  getActivityReporterUserPrompt,
};
