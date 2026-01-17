import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, Building, Calendar, Tag, Sparkles, AlertTriangle, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProjectSwitcher } from '@/components/plan/ProjectSwitcher';
import { useProjectStore } from '@/stores/projectStore';
import contentItemsApi, {
  type ContentType,
  type ActivityItemType,
  type AnalyzeContentResponse,
  type SaveAnalyzedContentInput,
} from '@/api/content-items.api';
import type { PlanItem } from '@/types';

type ViewMode = 'form' | 'analysis';

export function IntakePage() {
  const { currentProject, planItems, planItemsLoading, fetchPlanItems } = useProjectStore();

  // Form state
  const [title, setTitle] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlanItemIds, setSelectedPlanItemIds] = useState<string[]>([]);
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<number[]>([]);
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Data state
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [activityItemTypes, setActivityItemTypes] = useState<ActivityItemType[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis state
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContentResponse | null>(null);
  const [selectedExtractedItems, setSelectedExtractedItems] = useState<Set<number>>(new Set());

  // Load plan items when project changes
  useEffect(() => {
    if (currentProject) {
      fetchPlanItems(currentProject.id);
    }
  }, [currentProject?.id]);

  // Load content types and activity item types
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const [ctResponse, atResponse] = await Promise.all([
          contentItemsApi.getContentTypes(),
          contentItemsApi.getActivityItemTypes(),
        ]);
        if (ctResponse.success && ctResponse.data) {
          setContentTypes(ctResponse.data);
        }
        if (atResponse.success && atResponse.data) {
          setActivityItemTypes(atResponse.data);
        }
      } catch (err) {
        console.error('Failed to load types:', err);
      }
    };
    loadTypes();
  }, []);

  // Build hierarchical plan items for cascading dropdown
  const buildHierarchy = (items: PlanItem[]): PlanItem[] => {
    const itemMap = new Map<string, PlanItem>();
    const rootItems: PlanItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        rootItems.push(node);
      }
    });

    return rootItems;
  };

  // Flatten hierarchy for dropdown display with indentation
  const flattenForDropdown = (items: PlanItem[], depth = 0): { item: PlanItem; depth: number }[] => {
    const result: { item: PlanItem; depth: number }[] = [];
    items.forEach(item => {
      result.push({ item, depth });
      if (item.children && item.children.length > 0) {
        result.push(...flattenForDropdown(item.children, depth + 1));
      }
    });
    return result;
  };

  const hierarchicalItems = buildHierarchy(planItems);
  const flatItems = flattenForDropdown(hierarchicalItems);

  // Toggle plan item selection
  const togglePlanItem = (id: string) => {
    setSelectedPlanItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle content type selection
  const toggleContentType = (id: number) => {
    setSelectedContentTypeIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle activity type selection
  const toggleActivityType = (id: number) => {
    setSelectedActivityTypeIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Add tag
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // File drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ];
      if (validTypes.includes(droppedFile.type) || droppedFile.name.endsWith('.md')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF, DOCX, TXT, or MD file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Analyze content with AI
  const handleAnalyze = async () => {
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }
    if (!rawContent.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await contentItemsApi.analyze({
        projectId: currentProject.id,
        content: rawContent.trim(),
        title: title.trim() || undefined,
        dateOccurred: dateOccurred || undefined,
        selectedContentTypeIds: selectedContentTypeIds.length > 0 ? selectedContentTypeIds : undefined,
        selectedActivityTypeIds: selectedActivityTypeIds.length > 0 ? selectedActivityTypeIds : undefined,
        selectedPlanItemIds: selectedPlanItemIds.length > 0 ? selectedPlanItemIds : undefined,
      });

      if (response.success && response.data) {
        setAnalysisResult(response.data);
        // Auto-select all extracted items
        setSelectedExtractedItems(new Set(response.data.analysis.extractedItems.map((_, i) => i)));
        setViewMode('analysis');
      } else {
        setError(response.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Accept AI suggestions
  const handleAcceptSuggestions = async () => {
    if (!analysisResult || !currentProject) return;

    setSaving(true);
    setError(null);

    try {
      const analysis = analysisResult.analysis;

      // Build final content type IDs (user selections + AI suggestions)
      const finalContentTypeIds = new Set(selectedContentTypeIds);
      analysis.suggestedContentTypes.forEach(s => finalContentTypeIds.add(s.id));

      // Build final activity type IDs
      const finalActivityTypeIds = new Set(selectedActivityTypeIds);
      analysis.suggestedActivityTypes.forEach(s => finalActivityTypeIds.add(s.id));

      // Build final plan item IDs
      const finalPlanItemIds = new Set(selectedPlanItemIds);
      analysis.suggestedPlanItems.forEach(s => finalPlanItemIds.add(s.id));

      // Build final tags
      const finalTags = new Set(tags);
      analysis.tags.forEach(t => finalTags.add(t));

      // Get selected extracted items
      const extractedItems = analysis.extractedItems
        .filter((_, i) => selectedExtractedItems.has(i))
        .map(item => ({
          type: item.type,
          title: item.title,
          description: item.description,
          owner: item.owner,
          dueDate: item.dueDate,
          status: item.status,
          relatedPlanItemIds: item.relatedPlanItemIds,
          metadata: item.metadata,
        }));

      const input: SaveAnalyzedContentInput = {
        projectId: currentProject.id,
        title: (analysis.suggestedTitle || title).trim(),
        dateOccurred,
        rawContent: rawContent.trim(),
        sourceType: file ? 'file' : 'text',
        contentTypeIds: Array.from(finalContentTypeIds),
        activityTypeIds: Array.from(finalActivityTypeIds),
        planItemIds: Array.from(finalPlanItemIds),
        tags: Array.from(finalTags),
        aiSummary: analysis.summary,
        aiExtractedEntities: { analysis },
        extractedItems,
      };

      const response = await contentItemsApi.saveAnalyzed(input);
      if (response.success) {
        setSuccess(true);
        resetForm();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error?.message || 'Failed to save content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Save raw without AI processing
  const handleSaveRaw = async () => {
    if (!currentProject) {
      setError('Please select a project first');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!dateOccurred) {
      setError('Please select a date');
      return;
    }
    if (!rawContent.trim() && !file) {
      setError('Please enter content or upload a file');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input: SaveAnalyzedContentInput = {
        projectId: currentProject.id,
        title: title.trim(),
        dateOccurred,
        rawContent: rawContent.trim(),
        sourceType: file ? 'file' : 'text',
        contentTypeIds: selectedContentTypeIds,
        activityTypeIds: selectedActivityTypeIds,
        planItemIds: selectedPlanItemIds,
        tags,
      };

      const response = await contentItemsApi.saveAnalyzed(input);
      if (response.success) {
        setSuccess(true);
        resetForm();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error?.message || 'Failed to save content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDateOccurred(new Date().toISOString().split('T')[0]);
    setSelectedPlanItemIds([]);
    setSelectedContentTypeIds([]);
    setSelectedActivityTypeIds([]);
    setTags([]);
    setRawContent('');
    setFile(null);
    setViewMode('form');
    setAnalysisResult(null);
    setSelectedExtractedItems(new Set());
  };

  // Toggle extracted item selection
  const toggleExtractedItem = (index: number) => {
    setSelectedExtractedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Get confidence badge color
  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800">Low</Badge>;
    }
  };

  // Get activity type icon
  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'action_item':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'blocker':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Tag className="h-4 w-4 text-blue-500" />;
    }
  };

  // If no project selected
  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Intake Agent</h1>
            <p className="text-muted-foreground">Submit content for AI processing</p>
          </div>
          <ProjectSwitcher />
        </div>

        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground mb-4">
              Select a project from the dropdown above to submit content
            </p>
            <ProjectSwitcher />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analysis Results View
  if (viewMode === 'analysis' && analysisResult) {
    const { analysis, context } = analysisResult;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Analysis Results</h1>
            <p className="text-muted-foreground">Review and accept AI suggestions</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode('form')}>
            Back to Form
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Content saved successfully!</span>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            {analysis.suggestedTitle && title !== analysis.suggestedTitle && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Suggested Title:</p>
                <p className="text-sm text-purple-700">{analysis.suggestedTitle}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Suggested Classifications */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Classifications</CardTitle>
              <CardDescription>AI detected these content and activity types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Types */}
              {analysis.suggestedContentTypes.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Content Types</Label>
                  <div className="mt-2 space-y-2">
                    {analysis.suggestedContentTypes.map(suggestion => {
                      const type = context.contentTypes.find(ct => ct.id === suggestion.id);
                      return type ? (
                        <div key={suggestion.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="font-medium text-sm">{type.name}</span>
                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(suggestion.confidence)}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Activity Types */}
              {analysis.suggestedActivityTypes.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Activity Types</Label>
                  <div className="mt-2 space-y-2">
                    {analysis.suggestedActivityTypes.map(suggestion => {
                      const type = context.activityTypes.find(at => at.id === suggestion.id);
                      return type ? (
                        <div key={suggestion.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="font-medium text-sm">{type.name}</span>
                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(suggestion.confidence)}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Plan Items */}
              {analysis.suggestedPlanItems.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Related Plan Items</Label>
                  <div className="mt-2 space-y-2">
                    {analysis.suggestedPlanItems.map(suggestion => {
                      const item = context.planItems.find(pi => pi.id === suggestion.id);
                      return item ? (
                        <div key={suggestion.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="font-medium text-sm">{item.fullPath}</span>
                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(suggestion.confidence)}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {analysis.tags.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Suggested Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Items */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Items</CardTitle>
              <CardDescription>
                {analysis.extractedItems.length} items extracted from content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.extractedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific items extracted</p>
              ) : (
                <div className="space-y-3">
                  {analysis.extractedItems.map((item, index) => (
                    <label
                      key={index}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedExtractedItems.has(index)
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedExtractedItems.has(index)}
                          onCheckedChange={() => toggleExtractedItem(index)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityTypeIcon(item.type)}
                            <span className="font-medium text-sm">{item.title}</span>
                            {getConfidenceBadge(item.confidence)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          {(item.owner || item.dueDate) && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {item.owner && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {item.owner}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {item.dueDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="py-4 text-red-700 text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleAcceptSuggestions}
            disabled={saving}
            className="flex-1"
            size="lg"
          >
            {saving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Save
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode('form')}
            disabled={saving}
            size="lg"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={handleSaveRaw}
            disabled={saving}
            size="lg"
          >
            Store Raw Only
          </Button>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intake Agent</h1>
          <p className="text-muted-foreground">Submit content for AI processing</p>
        </div>
        <ProjectSwitcher />
      </div>

      {/* Success Message */}
      {success && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700 font-medium">Content saved successfully!</span>
          </CardContent>
        </Card>
      )}

      {/* Intake Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Main Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>Basic information about the content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title (optional - AI can suggest)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Date Occurred */}
              <div className="space-y-2">
                <Label htmlFor="date">Date Occurred *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={dateOccurred}
                    onChange={e => setDateOccurred(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Plan Item Selector */}
              <div className="space-y-2">
                <Label htmlFor="planItem">Link to Plan Items</Label>
                {planItemsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner className="h-4 w-4" />
                    <span>Loading plan items...</span>
                  </div>
                ) : (
                  <select
                    id="planItem"
                    value=""
                    onChange={e => {
                      if (e.target.value) togglePlanItem(e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">-- Add a plan item link (optional) --</option>
                    {flatItems.filter(({ item }) => !selectedPlanItemIds.includes(item.id)).map(({ item, depth }) => (
                      <option key={item.id} value={item.id}>
                        {'  '.repeat(depth)}
                        {depth > 0 ? '└ ' : ''}
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedPlanItemIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPlanItemIds.map(id => {
                      const item = planItems.find(p => p.id === id);
                      return item ? (
                        <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                          {item.name}
                          <button
                            type="button"
                            onClick={() => togglePlanItem(id)}
                            className="ml-1 hover:bg-slate-300 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-slate-300 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Area */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Enter text or upload a file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Area */}
              <div className="space-y-2">
                <Label htmlFor="content">Text Content *</Label>
                <textarea
                  id="content"
                  value={rawContent}
                  onChange={e => setRawContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                  className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Or Upload a File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-slate-400" />
                        <div className="text-left">
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Supports: PDF, DOCX, TXT, MD
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileChange}
                      />
                      <Button type="button" variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select File
                        </label>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Classifications */}
        <div className="space-y-6">
          {/* Content Types */}
          <Card>
            <CardHeader>
              <CardTitle>Content Type</CardTitle>
              <CardDescription>What type of content is this? (Optional - AI can detect)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {contentTypes.map(type => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedContentTypeIds.includes(type.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={selectedContentTypeIds.includes(type.id)}
                      onCheckedChange={() => toggleContentType(type.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Types */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Type</CardTitle>
              <CardDescription>What kind of activity does this contain? (Optional - AI can detect)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {activityItemTypes.map(type => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedActivityTypeIds.includes(type.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={selectedActivityTypeIds.includes(type.id)}
                      onCheckedChange={() => toggleActivityType(type.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="py-4 text-red-700 text-sm">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              disabled={analyzing || !rawContent.trim()}
            >
              {analyzing ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleSaveRaw}
              disabled={saving || (!rawContent.trim() && !file)}
            >
              {saving ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Without Analysis'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
