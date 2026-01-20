/**
 * Prompt Templates Tab Component
 * Manages AI prompt templates for platform administrators
 */

import { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Info,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  promptTemplatesApi,
  type PromptTemplate,
  type PromptTemplateVariable,
} from '@/api/prompt-templates.api';

interface PromptTemplatesTabProps {
  isPlatformAdmin: boolean;
}

export function PromptTemplatesTab({ isPlatformAdmin }: PromptTemplatesTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Templates data
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // Edit state
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editUserPrompt, setEditUserPrompt] = useState('');

  // Reset confirmation dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [templateToReset, setTemplateToReset] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await promptTemplatesApi.getAll();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error?.message || 'Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load prompt templates. Templates may not be seeded yet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    setError(null);

    try {
      const response = await promptTemplatesApi.seed();
      if (response.success) {
        setSuccess('Templates seeded successfully');
        loadTemplates();
      } else {
        setError(response.error?.message || 'Failed to seed templates');
      }
    } catch (err) {
      setError('Failed to seed templates');
      console.error(err);
    } finally {
      setSeeding(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleStartEdit = (template: PromptTemplate) => {
    setEditingTemplate(template.slug);
    setEditSystemPrompt(template.systemPrompt);
    setEditUserPrompt(template.userPromptTemplate);
    setExpandedTemplate(template.slug);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditSystemPrompt('');
    setEditUserPrompt('');
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await promptTemplatesApi.update(editingTemplate, {
        systemPrompt: editSystemPrompt,
        userPromptTemplate: editUserPrompt,
      });

      if (response.success) {
        setSuccess(`Template "${editingTemplate}" updated successfully`);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        setError(response.error?.message || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleResetClick = (slug: string) => {
    setTemplateToReset(slug);
    setShowResetDialog(true);
  };

  const handleConfirmReset = async () => {
    if (!templateToReset) return;

    setSaving(true);
    setError(null);

    try {
      const response = await promptTemplatesApi.reset(templateToReset);
      if (response.success) {
        setSuccess(`Template "${templateToReset}" reset to defaults`);
        if (editingTemplate === templateToReset) {
          handleCancelEdit();
        }
        loadTemplates();
      } else {
        setError(response.error?.message || 'Failed to reset template');
      }
    } catch (err) {
      setError('Failed to reset template');
      console.error(err);
    } finally {
      setSaving(false);
      setShowResetDialog(false);
      setTemplateToReset(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'agent':
        return 'default';
      case 'utility':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>Platform admin access required to manage prompt templates.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-600 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Prompt Templates
          </CardTitle>
          <CardDescription>
            Customize the prompts used by AI agents for content analysis, report generation, and plan management.
            Changes affect all organizations using the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? 's' : ''} configured
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedTemplates}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Seed Default Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No prompt templates found.</p>
              <Button onClick={handleSeedTemplates} disabled={seeding}>
                {seeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Seed Default Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.slug}>
              <Collapsible
                open={expandedTemplate === template.slug}
                onOpenChange={(open) => {
                  setExpandedTemplate(open ? template.slug : null);
                  if (!open && editingTemplate === template.slug) {
                    handleCancelEdit();
                  }
                }}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedTemplate === template.slug ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getCategoryBadgeVariant(template.category)}>
                          {template.category}
                        </Badge>
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    {/* Variables Reference */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="h-4 w-4" />
                        <Label className="font-medium">Available Variables</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Use these placeholders in your prompts. They will be replaced with actual values at runtime.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(template.variables as PromptTemplateVariable[]).map((variable) => (
                          <TooltipProvider key={variable.name}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={variable.required ? 'default' : 'secondary'}
                                  className="font-mono text-xs"
                                >
                                  {`{{${variable.name}}}`}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{variable.description}</p>
                                {variable.required && (
                                  <p className="text-xs text-muted-foreground mt-1">Required</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                      <Label htmlFor={`system-${template.slug}`}>System Prompt</Label>
                      <Textarea
                        id={`system-${template.slug}`}
                        value={editingTemplate === template.slug ? editSystemPrompt : template.systemPrompt}
                        onChange={(e) => setEditSystemPrompt(e.target.value)}
                        disabled={editingTemplate !== template.slug}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Enter system prompt..."
                      />
                      <p className="text-xs text-muted-foreground">
                        The system prompt sets the AI's role and behavior
                      </p>
                    </div>

                    {/* User Prompt Template */}
                    <div className="space-y-2">
                      <Label htmlFor={`user-${template.slug}`}>User Prompt Template</Label>
                      <Textarea
                        id={`user-${template.slug}`}
                        value={editingTemplate === template.slug ? editUserPrompt : template.userPromptTemplate}
                        onChange={(e) => setEditUserPrompt(e.target.value)}
                        disabled={editingTemplate !== template.slug}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Enter user prompt template..."
                      />
                      <p className="text-xs text-muted-foreground">
                        The user prompt template is filled with actual data at runtime
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(template.updatedAt).toLocaleString()}
                      {template.updatedByEmail && ` by ${template.updatedByEmail}`}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetClick(template.slug)}
                        disabled={saving}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to Default
                      </Button>

                      <div className="flex gap-2">
                        {editingTemplate === template.slug ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleStartEdit(template)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Template
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Template to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the "{templateToReset}" template to its original default prompts.
              Any customizations you've made will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>
              Reset to Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PromptTemplatesTab;
