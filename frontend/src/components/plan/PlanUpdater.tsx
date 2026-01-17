import { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useProjectStore } from '@/stores/projectStore';
import { planUpdaterApi } from '@/api/plan-updater.api';
import type { PlanSuggestion, PlanUpdateInput } from '@/api/plan-updater.api';

type PeriodPreset = 'this_week' | 'last_week' | 'last_2_weeks' | 'custom';

export function PlanUpdater() {
  const { currentProject, fetchPlanItems } = useProjectStore();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_week');
  const [periodStart, setPeriodStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<PlanSuggestion[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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
    }
  }, [periodPreset]);

  const handleLoadSuggestions = async () => {
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSummary(null);
    setSelectedSuggestions(new Set());

    try {
      const response = await planUpdaterApi.getSuggestions(currentProject.id, {
        periodStart,
        periodEnd,
      });

      if (response.success && response.data) {
        setSuggestions(response.data.suggestions);
        setSummary(response.data.summary);
        // Auto-select high confidence suggestions
        const highConfidence = new Set<number>();
        response.data.suggestions.forEach((s, i) => {
          if (s.confidence === 'high') {
            highConfidence.add(i);
          }
        });
        setSelectedSuggestions(highConfidence);
      } else {
        setError(response.error?.message || 'Failed to load suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdates = async () => {
    if (!currentProject || selectedSuggestions.size === 0) return;

    setIsApplying(true);
    setError(null);

    try {
      const updates: PlanUpdateInput[] = Array.from(selectedSuggestions).map(idx => {
        const s = suggestions[idx];
        return {
          planItemId: s.planItemId,
          field: s.field,
          value: s.suggestedValue,
          reason: s.reason,
          evidenceContentIds: s.evidenceContentIds,
        };
      });

      const response = await planUpdaterApi.applyUpdates(currentProject.id, { updates });

      if (response.success && response.data) {
        // Refresh plan items
        await fetchPlanItems(currentProject.id);
        // Clear suggestions
        setSuggestions([]);
        setSummary(`Successfully applied ${response.data.updated} updates.`);
        setSelectedSuggestions(new Set());
      } else {
        setError(response.error?.message || 'Failed to apply updates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
  };

  const selectNone = () => {
    setSelectedSuggestions(new Set());
  };

  if (!currentProject) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">
            Select a project to use the Plan Updater.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Updater</CardTitle>
          <CardDescription>
            Load activity from a period and get AI-suggested plan updates.
          </CardDescription>
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
                onClick={handleLoadSuggestions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Load Activity & Suggest
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

      {/* Summary */}
      {summary && suggestions.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Suggested Updates ({suggestions.length})</CardTitle>
                {summary && (
                  <CardDescription className="mt-1">{summary}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                isSelected={selectedSuggestions.has(index)}
                isExpanded={expandedCards.has(index)}
                onToggleSelect={() => toggleSuggestion(index)}
                onToggleExpand={() => toggleExpand(index)}
              />
            ))}

            {/* Apply Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleApplyUpdates}
                disabled={isApplying || selectedSuggestions.size === 0}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Apply Selected Updates ({selectedSuggestions.size})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: PlanSuggestion;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}

function SuggestionCard({
  suggestion,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
}: SuggestionCardProps) {
  const fieldLabels: Record<string, string> = {
    status: 'Status',
    notes: 'Notes',
    targetEndDate: 'Target End Date',
    actualEndDate: 'Actual End Date',
  };

  const confidenceColors: Record<string, string> = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className={`border rounded-lg ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
        <div className="p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{suggestion.planItemName}</span>
                  <Badge variant="outline">{fieldLabels[suggestion.field]}</Badge>
                  <span className={`px-2 py-0.5 rounded text-xs ${confidenceColors[suggestion.confidence]}`}>
                    {suggestion.confidence}
                  </span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">From:</span>
                  <span className="line-through text-red-600">
                    {suggestion.currentValue || '(none)'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">To:</span>
                  <span className="text-green-600 font-medium">
                    {suggestion.suggestedValue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 ml-10">
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Evidence</span>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.evidenceSummary}</p>
              {suggestion.evidenceContentIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Source IDs: {suggestion.evidenceContentIds.join(', ')}
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default PlanUpdater;
