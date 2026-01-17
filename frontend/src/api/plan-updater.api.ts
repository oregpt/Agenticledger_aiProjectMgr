import apiClient from './client';
import type { ApiResponse } from '@/types';

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

export interface GetPlanSuggestionsInput {
  periodStart: string;
  periodEnd: string;
  workstreamFilter?: string[];
}

export interface GetPlanSuggestionsResponse {
  suggestions: PlanSuggestion[];
  summary: string;
  activityReportId: string | null;
}

export interface PlanUpdateInput {
  planItemId: string;
  field: 'status' | 'notes' | 'targetEndDate' | 'actualEndDate';
  value: string;
  reason: string;
  evidenceContentIds: string[];
}

export interface ApplyPlanUpdatesInput {
  updates: PlanUpdateInput[];
}

export interface ApplyPlanUpdatesResponse {
  updated: number;
  historyRecords: number;
}

export const planUpdaterApi = {
  // Get AI-generated plan update suggestions
  getSuggestions: async (
    projectId: string,
    input: GetPlanSuggestionsInput
  ): Promise<ApiResponse<GetPlanSuggestionsResponse>> => {
    const response = await apiClient.post(`/projects/${projectId}/plan-suggestions`, input);
    return response.data;
  },

  // Apply selected plan updates
  applyUpdates: async (
    projectId: string,
    input: ApplyPlanUpdatesInput
  ): Promise<ApiResponse<ApplyPlanUpdatesResponse>> => {
    const response = await apiClient.post(`/projects/${projectId}/plan-updates`, input);
    return response.data;
  },
};

export default planUpdaterApi;
