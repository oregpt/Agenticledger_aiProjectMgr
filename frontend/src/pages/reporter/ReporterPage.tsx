import { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import {
  FileText,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProjectStore } from '@/stores/projectStore';
import { activityReporterApi } from '@/api/activity-reporter.api';
import type {
  ActivityReport,
  StatusUpdate,
  ActionItem,
  Risk,
  Decision,
  Blocker,
  SourceContentItem,
} from '@/api/activity-reporter.api';

type PeriodPreset = 'this_week' | 'last_week' | 'last_2_weeks' | 'custom';

export function ReporterPage() {
  const { currentProject } = useProjectStore();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_week');
  const [periodStart, setPeriodStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    statusUpdates: true,
    actionItems: true,
    risks: true,
    decisions: false,
    blockers: true,
    suggestedUpdates: false,
  });

  // Source dialog state
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceContentItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Update dates when preset changes
  useEffect(() => {
    const today = new Date();
    switch (periodPreset) {
      case 'this_week':
        setPeriodStart(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setPeriodEnd(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'last_week': {
        const lastWeek = subWeeks(today, 1);
        setPeriodStart(format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setPeriodEnd(format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      }
      case 'last_2_weeks':
        setPeriodStart(format(subDays(today, 14), 'yyyy-MM-dd'));
        setPeriodEnd(format(today, 'yyyy-MM-dd'));
        break;
      // 'custom' - don't change dates
    }
  }, [periodPreset]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerateReport = async () => {
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReport(null);

    try {
      const response = await activityReporterApi.generateReport(currentProject.id, {
        periodStart,
        periodEnd,
      });

      if (response.success && response.data) {
        setReport(response.data.report);
      } else {
        setError(response.error?.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewSources = async (contentIds: string[]) => {
    if (!currentProject || !report || contentIds.length === 0) return;

    setLoadingSources(true);
    setSourceDialogOpen(true);

    try {
      const response = await activityReporterApi.getReportSources(currentProject.id, report.id);
      if (response.success && response.data) {
        // Filter to only the requested content IDs
        const filtered = response.data.filter(item => contentIds.includes(item.id));
        setSelectedSources(filtered);
      }
    } catch {
      setSelectedSources([]);
    } finally {
      setLoadingSources(false);
    }
  };

  const exportToMarkdown = () => {
    if (!report) return;

    const data = report.reportData;
    let markdown = `# ${report.title}\n\n`;
    markdown += `**Period:** ${report.periodStart} to ${report.periodEnd}\n\n`;
    markdown += `## Summary\n\n${data.summary}\n\n`;

    if (data.statusUpdates.length > 0) {
      markdown += `## Status Updates\n\n`;
      data.statusUpdates.forEach(su => {
        markdown += `- **${su.planItemName || 'General'}**: ${su.update} (${su.status})\n`;
      });
      markdown += '\n';
    }

    if (data.actionItems.length > 0) {
      markdown += `## Action Items\n\n`;
      data.actionItems.forEach(ai => {
        markdown += `- [ ] **${ai.title}**: ${ai.description}`;
        if (ai.owner) markdown += ` (Owner: ${ai.owner})`;
        if (ai.dueDate) markdown += ` - Due: ${ai.dueDate}`;
        markdown += '\n';
      });
      markdown += '\n';
    }

    if (data.risks.length > 0) {
      markdown += `## Risks\n\n`;
      data.risks.forEach(r => {
        markdown += `- **${r.title}** (${r.severity} severity): ${r.description}\n`;
      });
      markdown += '\n';
    }

    if (data.decisions.length > 0) {
      markdown += `## Decisions\n\n`;
      data.decisions.forEach(d => {
        markdown += `- **${d.title}**: ${d.description}\n`;
      });
      markdown += '\n';
    }

    if (data.blockers.length > 0) {
      markdown += `## Blockers\n\n`;
      data.blockers.forEach(b => {
        markdown += `- **${b.title}**: ${b.description}\n`;
      });
      markdown += '\n';
    }

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-report-${report.periodStart}-${report.periodEnd}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground">
          Please select a project from the Project Switcher to generate activity reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Reporter</h1>
          <p className="text-muted-foreground">
            Generate AI-powered activity reports for {currentProject.name}.
          </p>
        </div>
        {report && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToMarkdown}>
              <Download className="mr-2 h-4 w-4" />
              Export Markdown
            </Button>
          </div>
        )}
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Configure the reporting period and filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={periodPreset} onValueChange={(v: string) => setPeriodPreset(v as PeriodPreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="last_2_weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => {
                  setPeriodStart(e.target.value);
                  setPeriodPreset('custom');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => {
                  setPeriodEnd(e.target.value);
                  setPeriodPreset('custom');
                }}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {report && (
        <div className="space-y-4">
          {/* Summary Section */}
          <ReportSection
            title="Summary"
            icon={<FileText className="h-4 w-4" />}
            isOpen={openSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <p className="text-sm whitespace-pre-wrap">{report.reportData.summary}</p>
          </ReportSection>

          {/* Status Updates */}
          <ReportSection
            title={`Status Updates (${report.reportData.statusUpdates.length})`}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            isOpen={openSections.statusUpdates}
            onToggle={() => toggleSection('statusUpdates')}
          >
            {report.reportData.statusUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status updates found.</p>
            ) : (
              <div className="space-y-3">
                {report.reportData.statusUpdates.map((update, i) => (
                  <StatusUpdateCard
                    key={i}
                    update={update}
                    onViewSource={() => handleViewSources(update.sourceContentIds)}
                  />
                ))}
              </div>
            )}
          </ReportSection>

          {/* Action Items */}
          <ReportSection
            title={`Action Items (${report.reportData.actionItems.length})`}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            isOpen={openSections.actionItems}
            onToggle={() => toggleSection('actionItems')}
          >
            {report.reportData.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action items found.</p>
            ) : (
              <div className="space-y-3">
                {report.reportData.actionItems.map((item, i) => (
                  <ActionItemCard
                    key={i}
                    item={item}
                    onViewSource={() => handleViewSources(item.sourceContentIds)}
                  />
                ))}
              </div>
            )}
          </ReportSection>

          {/* Risks */}
          <ReportSection
            title={`Risks (${report.reportData.risks.length})`}
            icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
            isOpen={openSections.risks}
            onToggle={() => toggleSection('risks')}
          >
            {report.reportData.risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No risks identified.</p>
            ) : (
              <div className="space-y-3">
                {report.reportData.risks.map((risk, i) => (
                  <RiskCard
                    key={i}
                    risk={risk}
                    onViewSource={() => handleViewSources(risk.sourceContentIds)}
                  />
                ))}
              </div>
            )}
          </ReportSection>

          {/* Decisions */}
          <ReportSection
            title={`Decisions (${report.reportData.decisions.length})`}
            icon={<CheckCircle className="h-4 w-4 text-purple-500" />}
            isOpen={openSections.decisions}
            onToggle={() => toggleSection('decisions')}
          >
            {report.reportData.decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions recorded.</p>
            ) : (
              <div className="space-y-3">
                {report.reportData.decisions.map((decision, i) => (
                  <DecisionCard
                    key={i}
                    decision={decision}
                    onViewSource={() => handleViewSources(decision.sourceContentIds)}
                  />
                ))}
              </div>
            )}
          </ReportSection>

          {/* Blockers */}
          <ReportSection
            title={`Blockers (${report.reportData.blockers.length})`}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            isOpen={openSections.blockers}
            onToggle={() => toggleSection('blockers')}
          >
            {report.reportData.blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blockers identified.</p>
            ) : (
              <div className="space-y-3">
                {report.reportData.blockers.map((blocker, i) => (
                  <BlockerCard
                    key={i}
                    blocker={blocker}
                    onViewSource={() => handleViewSources(blocker.sourceContentIds)}
                  />
                ))}
              </div>
            )}
          </ReportSection>

          {/* Suggested Plan Updates */}
          {report.reportData.suggestedPlanUpdates.length > 0 && (
            <ReportSection
              title={`Suggested Plan Updates (${report.reportData.suggestedPlanUpdates.length})`}
              icon={<FileCode className="h-4 w-4 text-cyan-500" />}
              isOpen={openSections.suggestedUpdates}
              onToggle={() => toggleSection('suggestedUpdates')}
            >
              <div className="space-y-2">
                {report.reportData.suggestedPlanUpdates.map((update, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        Update {update.field} to "{update.suggestedValue}"
                      </span>
                      <ConfidenceBadge confidence={update.confidence} />
                    </div>
                    <p className="text-sm text-muted-foreground">{update.reason}</p>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}
        </div>
      )}

      {/* Source Dialog */}
      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Source Content</DialogTitle>
            <DialogDescription>
              The original content that this item was extracted from.
            </DialogDescription>
          </DialogHeader>
          {loadingSources ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedSources.length === 0 ? (
            <p className="text-muted-foreground">No source content available.</p>
          ) : (
            <div className="space-y-4">
              {selectedSources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{source.title}</h4>
                    <Badge variant="outline">{source.sourceType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(source.dateOccurred).toLocaleDateString()}
                  </p>
                  <div className="bg-muted rounded p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {source.aiSummary || source.rawContent || 'No content available'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components

interface ReportSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ReportSection({ title, icon, isOpen, onToggle, children }: ReportSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  };
  return <Badge variant={variants[confidence]}>{confidence}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    on_track: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    delayed: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    open: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ViewSourceButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-xs"
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      View Source
    </Button>
  );
}

function StatusUpdateCard({ update, onViewSource }: { update: StatusUpdate; onViewSource: () => void }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {update.planItemName && (
            <span className="font-medium text-sm">{update.planItemName}</span>
          )}
          <StatusBadge status={update.status} />
          <ConfidenceBadge confidence={update.confidence} />
        </div>
        <ViewSourceButton onClick={onViewSource} disabled={update.sourceContentIds.length === 0} />
      </div>
      <p className="text-sm">{update.update}</p>
    </div>
  );
}

function ActionItemCard({ item, onViewSource }: { item: ActionItem; onViewSource: () => void }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.title}</span>
          <StatusBadge status={item.status} />
          <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
            {item.priority}
          </Badge>
          <ConfidenceBadge confidence={item.confidence} />
        </div>
        <ViewSourceButton onClick={onViewSource} disabled={item.sourceContentIds.length === 0} />
      </div>
      <p className="text-sm">{item.description}</p>
      {(item.owner || item.dueDate) && (
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          {item.owner && <span>Owner: {item.owner}</span>}
          {item.dueDate && <span>Due: {item.dueDate}</span>}
        </div>
      )}
    </div>
  );
}

function RiskCard({ risk, onViewSource }: { risk: Risk; onViewSource: () => void }) {
  return (
    <div className="border rounded-lg p-3 border-yellow-200 bg-yellow-50/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{risk.title}</span>
          <Badge variant={risk.severity === 'high' ? 'destructive' : risk.severity === 'medium' ? 'default' : 'secondary'}>
            {risk.severity} severity
          </Badge>
          <ConfidenceBadge confidence={risk.confidence} />
        </div>
        <ViewSourceButton onClick={onViewSource} disabled={risk.sourceContentIds.length === 0} />
      </div>
      <p className="text-sm">{risk.description}</p>
      {risk.mitigation && (
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Mitigation:</strong> {risk.mitigation}
        </p>
      )}
    </div>
  );
}

function DecisionCard({ decision, onViewSource }: { decision: Decision; onViewSource: () => void }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{decision.title}</span>
          <ConfidenceBadge confidence={decision.confidence} />
        </div>
        <ViewSourceButton onClick={onViewSource} disabled={decision.sourceContentIds.length === 0} />
      </div>
      <p className="text-sm">{decision.description}</p>
      {(decision.decisionMaker || decision.decisionDate) && (
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          {decision.decisionMaker && <span>By: {decision.decisionMaker}</span>}
          {decision.decisionDate && <span>Date: {decision.decisionDate}</span>}
        </div>
      )}
    </div>
  );
}

function BlockerCard({ blocker, onViewSource }: { blocker: Blocker; onViewSource: () => void }) {
  return (
    <div className="border rounded-lg p-3 border-red-200 bg-red-50/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{blocker.title}</span>
          <ConfidenceBadge confidence={blocker.confidence} />
        </div>
        <ViewSourceButton onClick={onViewSource} disabled={blocker.sourceContentIds.length === 0} />
      </div>
      <p className="text-sm">{blocker.description}</p>
      {blocker.resolution && (
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Resolution:</strong> {blocker.resolution}
        </p>
      )}
    </div>
  );
}

export default ReporterPage;
