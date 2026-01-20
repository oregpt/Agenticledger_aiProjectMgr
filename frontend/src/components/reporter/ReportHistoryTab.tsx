import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  Presentation,
  Loader2,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projectStore';
import { activityReporterApi, type ActivityReport } from '@/api/activity-reporter.api';
import { outputFormatterApi } from '@/api/output-formatter.api';

interface ReportHistoryTabProps {
  onViewReport?: (report: ActivityReport) => void;
}

interface ReportListItem {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  createdAt: string;
}

export function ReportHistoryTab({ onViewReport }: ReportHistoryTabProps) {
  const { currentProject } = useProjectStore();

  // Data state
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export state
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const params: { page?: number; limit?: number; startDate?: string; endDate?: string } = {
        page,
        limit,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await activityReporterApi.listReports(currentProject.id, params);
      if (response.success && response.data) {
        setReports(response.data.items);
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, page, limit, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  const handleViewReport = async (reportItem: ReportListItem) => {
    if (!currentProject || !onViewReport) return;

    try {
      const response = await activityReporterApi.getReport(currentProject.id, reportItem.id);
      if (response.success && response.data) {
        onViewReport(response.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  };

  const handleExportMarkdown = async (reportItem: ReportListItem) => {
    if (!currentProject) return;

    setExportingId(reportItem.id);
    try {
      const reportResponse = await activityReporterApi.getReport(currentProject.id, reportItem.id);
      if (!reportResponse.success || !reportResponse.data) return;

      const report = reportResponse.data;
      const response = await outputFormatterApi.formatAsMarkdown({
        sourceType: 'activity_report',
        projectName: currentProject.name,
        data: {
          title: report.title,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          reportData: report.reportData,
        },
      });

      if (response.success && response.data) {
        outputFormatterApi.downloadMarkdown(response.data.content, response.data.filename);
      }
    } catch (err) {
      console.error('Failed to export markdown:', err);
    } finally {
      setExportingId(null);
    }
  };

  const handleExportPptx = async (reportItem: ReportListItem) => {
    if (!currentProject) return;

    setExportingId(reportItem.id);
    try {
      const reportResponse = await activityReporterApi.getReport(currentProject.id, reportItem.id);
      if (!reportResponse.success || !reportResponse.data) return;

      const report = reportResponse.data;
      const blob = await outputFormatterApi.formatAsPptx({
        sourceType: 'activity_report',
        projectName: currentProject.name,
        data: {
          title: report.title,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          reportData: report.reportData,
        },
      });

      const filename = `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-activity-report-${report.periodStart}-${report.periodEnd}.pptx`;
      outputFormatterApi.downloadPptx(blob, filename);
    } catch (err) {
      console.error('Failed to export pptx:', err);
    } finally {
      setExportingId(null);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = startDate || endDate;

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground">
          Please select a project to view report history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range Filter
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Reports</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${total} reports found`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && reports.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No reports found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your date filters'
                  : 'Generate your first report in the Generate Report tab'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="max-w-[300px]">Summary</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {report.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.periodStart), 'MMM d')} -{' '}
                          {format(new Date(report.periodEnd), 'MMM d, yyyy')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {report.summary.substring(0, 100)}
                          {report.summary.length > 100 ? '...' : ''}
                        </p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={exportingId === report.id}
                            >
                              {exportingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewReport && (
                              <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleExportMarkdown(report)}>
                              <Download className="h-4 w-4 mr-2" />
                              Export Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportPptx(report)}>
                              <Presentation className="h-4 w-4 mr-2" />
                              Export PowerPoint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
