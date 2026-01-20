/**
 * Plan Creator Component
 * AI-powered plan generation from content/requirements
 * With editable suggestions and source tracking
 */

import { useState } from 'react';
import {
  Loader2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Wand2,
  Pencil,
  User,
  Clock,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { planCreatorApi } from '@/api/plan-creator.api';
import type { GeneratedPlanItem, PlanItemToCreate } from '@/api/plan-creator.api';

// Item types available for plan items
const ITEM_TYPES = [
  { value: 'workstream', label: 'Workstream', level: 1 },
  { value: 'milestone', label: 'Milestone', level: 2 },
  { value: 'activity', label: 'Activity', level: 3 },
  { value: 'task', label: 'Task', level: 4 },
  { value: 'subtask', label: 'Subtask', level: 5 },
] as const;

type ItemType = typeof ITEM_TYPES[number]['value'];
type ItemSource = 'ai' | 'ai_modified' | 'user_added';

// Editable plan item with source tracking
interface EditablePlanItem {
  id: string;
  name: string;
  itemType: ItemType;
  description: string;
  owner: string;
  estimatedDuration: string;
  selected: boolean;
  source: ItemSource;
  expanded: boolean;
  children: EditablePlanItem[];
}

// Convert AI-generated items to editable format
function convertToEditable(items: GeneratedPlanItem[], parentId = ''): EditablePlanItem[] {
  return items.map((item, index) => ({
    id: `${parentId}ai-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    itemType: item.itemType as ItemType,
    description: item.description || '',
    owner: item.owner || '',
    estimatedDuration: item.estimatedDuration || '',
    selected: true,
    source: 'ai' as ItemSource,
    expanded: true,
    children: item.children ? convertToEditable(item.children, `${parentId}ai-${index}-`) : [],
  }));
}

// Convert editable items back to API format for creation
function convertToCreateInput(items: EditablePlanItem[]): PlanItemToCreate[] {
  return items
    .filter(item => item.selected)
    .map(item => ({
      name: item.name,
      itemType: item.itemType,
      description: item.description || undefined,
      owner: item.owner || undefined,
      estimatedDuration: item.estimatedDuration || undefined,
      children: item.children.length > 0 ? convertToCreateInput(item.children) : undefined,
    }));
}

export function PlanCreator() {
  const { currentProject, fetchPlanItems } = useProjectStore();

  // Input state
  const [content, setContent] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Results state
  const [summary, setSummary] = useState<string | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [suggestedDuration, setSuggestedDuration] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditablePlanItem[]>([]);

  // View mode: 'input' or 'results'
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');

  const handleAnalyze = async () => {
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }
    if (!content.trim()) {
      setError('Please enter project requirements or content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await planCreatorApi.analyze(currentProject.id, {
        content: content.trim(),
        additionalContext: additionalContext.trim() || undefined,
      });

      if (response.success && response.data) {
        setSummary(response.data.summary);
        setAssumptions(response.data.assumptions || []);
        setRisks(response.data.risks || []);
        setSuggestedDuration(response.data.suggestedDuration || null);
        setEditableItems(convertToEditable(response.data.planItems));
        setViewMode('results');
      } else {
        setError(response.error?.message || 'Failed to analyze content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreate = async () => {
    if (!currentProject) return;

    const selectedItems = convertToCreateInput(editableItems);
    if (selectedItems.length === 0) {
      setError('Please select at least one item to create');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await planCreatorApi.create(currentProject.id, {
        planItems: selectedItems,
      });

      if (response.success && response.data) {
        setSuccess(`Successfully created ${response.data.created} plan items`);
        // Refresh plan items
        await fetchPlanItems(currentProject.id);
        // Reset form
        setContent('');
        setAdditionalContext('');
        setEditableItems([]);
        setSummary(null);
        setAssumptions([]);
        setRisks([]);
        setSuggestedDuration(null);
        setViewMode('input');
      } else {
        setError(response.error?.message || 'Failed to create plan items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackToInput = () => {
    setViewMode('input');
  };

  // Update an item (and mark as modified if AI-sourced)
  const updateItem = (
    items: EditablePlanItem[],
    id: string,
    field: keyof EditablePlanItem,
    value: any
  ): EditablePlanItem[] => {
    return items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (item.source === 'ai' && field !== 'selected' && field !== 'expanded') {
          updated.source = 'ai_modified';
        }
        return updated;
      }
      if (item.children.length > 0) {
        return { ...item, children: updateItem(item.children, id, field, value) };
      }
      return item;
    });
  };

  // Remove an item
  const removeItem = (items: EditablePlanItem[], id: string): EditablePlanItem[] => {
    return items.filter(item => {
      if (item.id === id) return false;
      if (item.children.length > 0) {
        item.children = removeItem(item.children, id);
      }
      return true;
    });
  };

  // Add a child item
  const addChildItem = (items: EditablePlanItem[], parentId: string, childType: ItemType): EditablePlanItem[] => {
    return items.map(item => {
      if (item.id === parentId) {
        const newChild: EditablePlanItem = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: '',
          itemType: childType,
          description: '',
          owner: '',
          estimatedDuration: '',
          selected: true,
          source: 'user_added',
          expanded: true,
          children: [],
        };
        return { ...item, children: [...item.children, newChild], expanded: true };
      }
      if (item.children.length > 0) {
        return { ...item, children: addChildItem(item.children, parentId, childType) };
      }
      return item;
    });
  };

  // Add a root-level item
  const addRootItem = (itemType: ItemType) => {
    const newItem: EditablePlanItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      itemType,
      description: '',
      owner: '',
      estimatedDuration: '',
      selected: true,
      source: 'user_added',
      expanded: true,
      children: [],
    };
    setEditableItems(prev => [...prev, newItem]);
  };

  // Get source badge
  const getSourceBadge = (source: ItemSource) => {
    switch (source) {
      case 'ai':
        return (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Wand2 className="h-3 w-3 mr-1" />
            AI Suggested
          </Badge>
        );
      case 'ai_modified':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Pencil className="h-3 w-3 mr-1" />
            Modified
          </Badge>
        );
      case 'user_added':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Plus className="h-3 w-3 mr-1" />
            User Added
          </Badge>
        );
    }
  };

  // Count selected items recursively
  const countSelected = (items: EditablePlanItem[]): number => {
    let count = 0;
    for (const item of items) {
      if (item.selected) count++;
      count += countSelected(item.children);
    }
    return count;
  };

  // Render plan item tree
  const renderPlanItem = (item: EditablePlanItem, depth = 0): JSX.Element => {
    const childTypeLevel = ITEM_TYPES.findIndex(t => t.value === item.itemType) + 2;
    const availableChildTypes = ITEM_TYPES.filter(t => t.level === childTypeLevel);
    const canHaveChildren = childTypeLevel <= 5;

    return (
      <div key={item.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-slate-200 pl-4' : ''}`}>
        <Collapsible open={item.expanded} onOpenChange={(open) => {
          setEditableItems(prev => updateItem(prev, item.id, 'expanded', open));
        }}>
          <div className={`p-4 rounded-lg border mb-2 ${
            item.selected ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50'
          }`}>
            {/* Header row */}
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={item.selected}
                onCheckedChange={(checked) => {
                  setEditableItems(prev => updateItem(prev, item.id, 'selected', checked));
                }}
              />
              <Select
                value={item.itemType}
                onValueChange={(value) => {
                  setEditableItems(prev => updateItem(prev, item.id, 'itemType', value));
                }}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              {getSourceBadge(item.source)}
              {(item.source !== 'ai' || item.children.length > 0) && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              )}
              {item.source !== 'ai' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setEditableItems(prev => removeItem(prev, item.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Name input */}
            <div className="space-y-1 mb-3">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={item.name}
                onChange={(e) => {
                  setEditableItems(prev => updateItem(prev, item.id, 'name', e.target.value));
                }}
                placeholder={`Enter ${item.itemType} name...`}
                className="h-9"
              />
            </div>

            <CollapsibleContent>
              {/* Description */}
              <div className="space-y-1 mb-3">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => {
                    setEditableItems(prev => updateItem(prev, item.id, 'description', e.target.value));
                  }}
                  placeholder="Enter description..."
                  className="min-h-[60px] text-sm"
                />
              </div>

              {/* Owner and Duration row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Owner</Label>
                  <div className="relative">
                    <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={item.owner}
                      onChange={(e) => {
                        setEditableItems(prev => updateItem(prev, item.id, 'owner', e.target.value));
                      }}
                      placeholder="Assignee..."
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Est. Duration</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={item.estimatedDuration}
                      onChange={(e) => {
                        setEditableItems(prev => updateItem(prev, item.id, 'estimatedDuration', e.target.value));
                      }}
                      placeholder="e.g., 2 weeks"
                      className="h-8 pl-7 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Add child button */}
              {canHaveChildren && availableChildTypes.length > 0 && (
                <div className="flex gap-2">
                  {availableChildTypes.map(type => (
                    <Button
                      key={type.value}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setEditableItems(prev => addChildItem(prev, item.id, type.value));
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add {type.label}
                    </Button>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </div>

          {/* Render children */}
          {item.children.length > 0 && (
            <CollapsibleContent>
              {item.children.map(child => renderPlanItem(child, depth + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  if (!currentProject) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardContent className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">
            Select a project to use the AI Plan Creator.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Results view
  if (viewMode === 'results') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI-Generated Plan</h2>
            <p className="text-sm text-muted-foreground">Review and edit the suggested plan structure</p>
          </div>
          <Button variant="outline" onClick={handleBackToInput}>
            Back to Input
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">{success}</span>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{summary}</p>
              {suggestedDuration && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Suggested Duration: {suggestedDuration}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assumptions and Risks */}
        {(assumptions.length > 0 || risks.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {assumptions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Assumptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {assumptions.map((assumption, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {risks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Risks & Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Plan Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Plan Structure
                </CardTitle>
                <CardDescription>
                  {countSelected(editableItems)} items selected - edit or add your own
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => addRootItem('workstream')}>
                <Plus className="h-4 w-4 mr-1" />
                Add Workstream
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editableItems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No plan items</p>
                <Button variant="outline" size="sm" onClick={() => addRootItem('workstream')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Workstream
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {editableItems.map(item => renderPlanItem(item))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleCreate}
            disabled={isCreating || countSelected(editableItems) === 0}
            className="flex-1"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Plan ({countSelected(editableItems)} items)
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleBackToInput}
            disabled={isCreating}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Input view
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Plan Creator
          </CardTitle>
          <CardDescription>
            Paste your project requirements, goals, or description and let AI generate a structured plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">Project Requirements / Description *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your project requirements, goals, scope, or description here...

Example:
- Build a customer portal with user authentication
- Dashboard showing account activity
- Ability to submit support tickets
- Integration with our existing CRM system
- Must launch by end of Q2"
              className="min-h-[200px]"
            />
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any additional context, constraints, or preferences...

Example:
- Team size: 5 developers
- Technology stack: React, Node.js
- This is a high priority project"
              className="min-h-[100px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze & Generate Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlanCreator;
