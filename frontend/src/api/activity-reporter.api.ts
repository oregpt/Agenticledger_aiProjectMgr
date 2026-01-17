import apiClient from './client';
import type { ApiResponse } from '@/types';

// Report types
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

export interface SuggestedPlanUpdate {
  planItemId: string;
  field: string;
  suggestedValue: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReportData {
  summary: string;
  statusUpdates: StatusUpdate[];
  actionItems: ActionItem[];
  risks: Risk[];
  decisions: Decision[];
  blockers: Blocker[];
  suggestedPlanUpdates: SuggestedPlanUpdate[];
}

export interface ActivityReport {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  reportData: ReportData;
  sourceContentIds: string[];
  createdAt: string;
}

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

export interface GenerateReportInput {
  periodStart: string;
  periodEnd: string;
  workstreamFilter?: string[];
  activityTypeFilter?: number[];
  title?: string;
}

export interface GenerateReportResponse {
  report: ActivityReport;
  context: ReportContext;
}

export interface ListReportsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface ListReportsResponse {
  items: Array<{
    id: string;
    title: string;
    periodStart: string;
    periodEnd: string;
    summary: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SourceContentItem {
  id: string;
  title: string;
  dateOccurred: string;
  sourceType: string;
  rawContent: string | null;
  aiSummary: string | null;
}

export const activityReporterApi = {
  // Generate a new activity report
  generateReport: async (
    projectId: string,
    input: GenerateReportInput
  ): Promise<ApiResponse<GenerateReportResponse>> => {
    const response = await apiClient.post(`/projects/${projectId}/activity-report`, input);
    return response.data;
  },

  // List activity reports for a project
  listReports: async (
    projectId: string,
    params?: ListReportsParams
  ): Promise<ApiResponse<ListReportsResponse>> => {
    const response = await apiClient.get(`/projects/${projectId}/activity-reports`, { params });
    return response.data;
  },

  // Get a single activity report
  getReport: async (
    projectId: string,
    reportId: string
  ): Promise<ApiResponse<ActivityReport>> => {
    const response = await apiClient.get(`/projects/${projectId}/activity-reports/${reportId}`);
    return response.data;
  },

  // Get source content items for a report
  getReportSources: async (
    projectId: string,
    reportId: string
  ): Promise<ApiResponse<SourceContentItem[]>> => {
    const response = await apiClient.get(`/projects/${projectId}/activity-reports/${reportId}/sources`);
    return response.data;
  },
};

export default activityReporterApi;
