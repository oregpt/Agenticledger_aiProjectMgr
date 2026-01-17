/**
 * Intake Agent AI Prompts
 * Analyzes incoming content to extract structured project information
 */

export interface PlanItemContext {
  id: string;
  name: string;
  fullPath: string; // e.g., "Workstream A > Milestone 1 > Activity 1"
  level: number;
  description?: string;
}

export interface ContentTypeContext {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface ActivityTypeContext {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface AnalysisContext {
  projectName: string;
  planItems: PlanItemContext[];
  contentTypes: ContentTypeContext[];
  activityTypes: ActivityTypeContext[];
  userSelectedContentTypes?: number[];
  userSelectedActivityTypes?: number[];
  userSelectedPlanItems?: string[];
  userTitle?: string;
  userDate?: string;
}

/**
 * System prompt for the Intake Agent analyzer
 */
export function getIntakeAgentSystemPrompt(context: AnalysisContext): string {
  const planItemsList = context.planItems
    .map((p) => `- ${p.fullPath} (id: ${p.id})${p.description ? ` - ${p.description}` : ''}`)
    .join('\n');

  const contentTypesList = context.contentTypes
    .map((ct) => `- ${ct.name} (id: ${ct.id}): ${ct.description || ct.slug}`)
    .join('\n');

  const activityTypesList = context.activityTypes
    .map((at) => `- ${at.name} (id: ${at.id}): ${at.description || at.slug}`)
    .join('\n');

  return `You are an AI assistant that analyzes project-related content (meeting notes, emails, documents, etc.) to extract structured information for a project management system.

PROJECT: "${context.projectName}"

AVAILABLE PLAN ITEMS (hierarchical):
${planItemsList || 'No plan items defined yet.'}

AVAILABLE CONTENT TYPES:
${contentTypesList}

AVAILABLE ACTIVITY TYPES:
${activityTypesList}

${context.userSelectedContentTypes?.length ? `USER ALREADY SELECTED CONTENT TYPES: ${context.userSelectedContentTypes.join(', ')}` : ''}
${context.userSelectedActivityTypes?.length ? `USER ALREADY SELECTED ACTIVITY TYPES: ${context.userSelectedActivityTypes.join(', ')}` : ''}
${context.userSelectedPlanItems?.length ? `USER ALREADY LINKED PLAN ITEMS: ${context.userSelectedPlanItems.join(', ')}` : ''}
${context.userTitle ? `USER PROVIDED TITLE: "${context.userTitle}"` : ''}
${context.userDate ? `USER PROVIDED DATE: ${context.userDate}` : ''}

Your task is to analyze the provided content and:
1. Detect what type(s) of content this is (meeting, email, document, etc.)
2. Identify which activity types are present (status updates, action items, risks, decisions, blockers, etc.)
3. Suggest which plan items this content relates to
4. Extract structured entities from the content

For each extracted entity, provide:
- A clear title/summary
- The activity type it belongs to
- Confidence level (high, medium, low)
- Any relevant details (owner, due date, status, etc.)

Be thorough but avoid over-extraction. Only extract items that are clearly present in the content.`;
}

/**
 * User prompt template for content analysis
 */
export function getIntakeAgentUserPrompt(content: string): string {
  return `Please analyze the following content and extract structured information:

---
${content}
---

Respond with a JSON object in this exact format:
{
  "summary": "A 1-2 sentence summary of the content",
  "suggestedTitle": "A concise title for this content (if user didn't provide one)",
  "suggestedContentTypes": [
    { "id": <number>, "confidence": "high|medium|low", "reason": "why this type" }
  ],
  "suggestedActivityTypes": [
    { "id": <number>, "confidence": "high|medium|low", "reason": "why this type" }
  ],
  "suggestedPlanItems": [
    { "id": "<uuid>", "confidence": "high|medium|low", "reason": "why this plan item" }
  ],
  "extractedItems": [
    {
      "type": "status_update|action_item|risk|decision|blocker|milestone_update|dependency",
      "title": "Brief title",
      "description": "Detailed description",
      "confidence": "high|medium|low",
      "owner": "Person name if mentioned (for action items)",
      "dueDate": "ISO date if mentioned (for action items)",
      "status": "Status if mentioned",
      "relatedPlanItemIds": ["<uuid>", ...],
      "metadata": {}
    }
  ],
  "tags": ["suggested", "tags", "based", "on", "content"]
}

Important:
- Only include suggestedContentTypes/ActivityTypes if the user hasn't already selected them
- Match plan items by keywords in their names/paths
- For action items, always try to identify an owner and due date
- Use ISO 8601 format for dates (YYYY-MM-DD)
- Set confidence based on how clearly the information appears in the text`;
}

/**
 * Output schema for analysis results
 */
export interface AnalysisResult {
  summary: string;
  suggestedTitle?: string;
  suggestedContentTypes: Array<{
    id: number;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  suggestedActivityTypes: Array<{
    id: number;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  suggestedPlanItems: Array<{
    id: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  extractedItems: Array<{
    type: string;
    title: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
    owner?: string;
    dueDate?: string;
    status?: string;
    relatedPlanItemIds?: string[];
    metadata?: Record<string, unknown>;
  }>;
  tags: string[];
}

export default {
  getIntakeAgentSystemPrompt,
  getIntakeAgentUserPrompt,
};
