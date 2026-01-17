import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, Building, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProjectSwitcher } from '@/components/plan/ProjectSwitcher';
import { useProjectStore } from '@/stores/projectStore';
import contentItemsApi, { type ContentType, type ActivityItemType, type CreateContentItemInput } from '@/api/content-items.api';
import type { PlanItem } from '@/types';

export function IntakePage() {
  const { currentProject, planItems, planItemsLoading, fetchPlanItems } = useProjectStore();

  // Form state
  const [title, setTitle] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlanItemId, setSelectedPlanItemId] = useState<string>('');
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<number[]>([]);
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Data state
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [activityItemTypes, setActivityItemTypes] = useState<ActivityItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLoading(true);
    setError(null);

    try {
      const input: CreateContentItemInput = {
        projectId: currentProject.id,
        planItemIds: selectedPlanItemId ? [selectedPlanItemId] : [],
        contentTypeIds: selectedContentTypeIds,
        activityTypeIds: selectedActivityTypeIds,
        sourceType: file ? 'file' : 'text',
        title: title.trim(),
        dateOccurred,
        tags,
        rawContent: rawContent.trim() || null,
        fileName: file?.name || null,
        fileSize: file?.size || null,
        mimeType: file?.type || null,
      };

      const response = await contentItemsApi.create(input);
      if (response.success) {
        setSuccess(true);
        // Reset form
        setTitle('');
        setDateOccurred(new Date().toISOString().split('T')[0]);
        setSelectedPlanItemId('');
        setSelectedContentTypeIds([]);
        setSelectedActivityTypeIds([]);
        setTags([]);
        setRawContent('');
        setFile(null);
        // Hide success after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error?.message || 'Failed to save content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setLoading(false);
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
      <form onSubmit={handleSubmit}>
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
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
                  <Label htmlFor="planItem">Link to Plan Item</Label>
                  {planItemsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoadingSpinner className="h-4 w-4" />
                      <span>Loading plan items...</span>
                    </div>
                  ) : (
                    <select
                      id="planItem"
                      value={selectedPlanItemId}
                      onChange={e => setSelectedPlanItemId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">-- Select a plan item (optional) --</option>
                      {flatItems.map(({ item, depth }) => (
                        <option key={item.id} value={item.id}>
                          {'  '.repeat(depth)}
                          {depth > 0 ? '└ ' : ''}
                          {item.name}
                        </option>
                      ))}
                    </select>
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
                  <Label htmlFor="content">Text Content</Label>
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
                <CardDescription>What type of content is this?</CardDescription>
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
                <CardDescription>What kind of activity does this contain?</CardDescription>
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

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Submit Content'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
