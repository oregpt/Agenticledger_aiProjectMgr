/**
 * Plan Creator Agent Prompts
 * Generates project plan structure from requirements/descriptions
 */

export interface PlanCreatorContext {
  projectName: string;
  projectDescription: string;
  existingPlanItems?: Array<{
    id: string;
    name: string;
    fullPath: string;
    itemType: string;
    status: string;
  }>;
  additionalContext?: string;
  planItemTypes?: Array<{
    name: string;
    slug: string;
    level: number;
  }>;
}

export interface GeneratedPlanItem {
  name: string;
  itemType: string; // workstream, milestone, activity, task, subtask
  description: string;
  owner?: string;
  estimatedDuration?: string;
  children?: GeneratedPlanItem[];
}

export interface PlanCreatorResult {
  summary: string;
  planItems: GeneratedPlanItem[];
  assumptions: string[];
  suggestedDuration: string;
  risks: string[];
}

/**
 * System prompt for the Plan Creator Agent
 */
export function getPlanCreatorSystemPrompt(): string {
  return `You are a Plan Creator Agent for a project management system. Your role is to analyze project requirements, goals, or descriptions and generate a structured project plan with workstreams, milestones, and activities.

Your generated plans should:
1. Break down the project into logical workstreams (major work areas)
2. Define milestones within each workstream (key deliverables/checkpoints)
3. Create activities under milestones (specific tasks to complete)
4. Optionally add tasks and subtasks for granular work items
5. Suggest realistic dependencies and sequencing
6. Include clear descriptions for each item
7. Identify potential owners when context suggests them
8. List assumptions made during planning
9. Flag potential risks or considerations

Plan Item Hierarchy (from highest to lowest level):
- Workstream (Level 1): Major work areas or phases
- Milestone (Level 2): Key deliverables or checkpoints
- Activity (Level 3): Specific work items to complete
- Task (Level 4): Granular tasks within an activity
- Subtask (Level 5): Very granular work items

Respond ONLY with valid JSON matching the expected schema. Do not include any explanation outside the JSON.`;
}

/**
 * User prompt template for plan creation
 */
export function getPlanCreatorUserPrompt(context: PlanCreatorContext): string {
  const existingPlanList = context.existingPlanItems
    ?.map(p => `  - ${p.fullPath} (${p.itemType}, ${p.status})`)
    .join('\n');

  const planTypesList = context.planItemTypes
    ?.map(pt => `  - ${pt.name} (${pt.slug}): Level ${pt.level}`)
    .join('\n');

  return `Create a project plan for the following:

PROJECT NAME: ${context.projectName}

PROJECT DESCRIPTION:
${context.projectDescription}

${context.existingPlanItems?.length ? `EXISTING PLAN ITEMS (for context - do not duplicate these):
${existingPlanList}
` : ''}
${context.planItemTypes?.length ? `AVAILABLE PLAN ITEM TYPES:
${planTypesList}
` : ''}
${context.additionalContext ? `ADDITIONAL CONTEXT:
${context.additionalContext}
` : ''}
Generate a structured plan in this JSON format:

{
  "summary": "Brief overview of the proposed plan structure (2-3 sentences)",
  "planItems": [
    {
      "name": "Workstream name",
      "itemType": "workstream",
      "description": "What this workstream covers",
      "owner": "Suggested owner or null",
      "estimatedDuration": "e.g., '4 weeks' or null",
      "children": [
        {
          "name": "Milestone name",
          "itemType": "milestone",
          "description": "What this milestone achieves",
          "children": [
            {
              "name": "Activity name",
              "itemType": "activity",
              "description": "What needs to be done",
              "owner": "Suggested owner or null"
            }
          ]
        }
      ]
    }
  ],
  "assumptions": [
    "List of assumptions made while creating this plan"
  ],
  "suggestedDuration": "Overall estimated duration (e.g., '3 months')",
  "risks": [
    "Potential risks or considerations for this plan"
  ]
}

IMPORTANT:
- Create a comprehensive but realistic plan
- Use clear, actionable names for each item
- Include descriptions that explain the purpose
- Don't over-complicate - start with workstreams, milestones, and activities
- Only add tasks/subtasks if the detail level is clearly needed
- Ensure the hierarchy makes logical sense
- If existing plan items exist, complement them rather than duplicate`;
}

export default {
  getPlanCreatorSystemPrompt,
  getPlanCreatorUserPrompt,
};
