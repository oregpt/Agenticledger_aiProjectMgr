/**
 * AI Settings Tab Component
 * Manages AI provider configuration for platform and organization
 */

import { useState, useEffect } from 'react';
import {
  Bot,
  Loader2,
  Save,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useAuthStore } from '@/stores/authStore';
import {
  aiSettingsApi,
  type AIProvider,
  type PlatformAISettings,
  type OrgAISettings,
} from '@/api/ai-settings.api';

// OpenAI models
const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Faster)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
];

// Anthropic models
const ANTHROPIC_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' },
];

interface AISettingsTabProps {
  isPlatformAdmin: boolean;
  organizationId: number;
}

export function AISettingsTab({ isPlatformAdmin, organizationId }: AISettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Platform settings (only for platform admin)
  const [platformSettings, setPlatformSettings] = useState<PlatformAISettings | null>(null);

  // Org settings
  const [orgSettings, setOrgSettings] = useState<OrgAISettings | null>(null);

  // Form state
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [anthropicModel, setAnthropicModel] = useState('claude-sonnet-4-20250514');

  // Show/hide API keys
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  // Clear confirmation dialog
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, [isPlatformAdmin, organizationId]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isPlatformAdmin) {
        // Load platform settings
        const response = await aiSettingsApi.getPlatformSettings();
        if (response.success && response.data) {
          setPlatformSettings(response.data);
          // Set form values from platform settings
          if (response.data.provider) {
            setProvider(response.data.provider);
          }
          if (response.data.openai.model) {
            setOpenaiModel(response.data.openai.model);
          }
          if (response.data.anthropic.model) {
            setAnthropicModel(response.data.anthropic.model);
          }
        }
      } else {
        // Load org settings
        const response = await aiSettingsApi.getOrgSettings(organizationId);
        if (response.success && response.data) {
          setOrgSettings(response.data);
          // Set form values from org overrides or effective settings
          const overrides = response.data.overrides;
          const effective = response.data.effective;

          setProvider(overrides?.provider || effective.provider);
          setOpenaiModel(overrides?.openai.model || effective.openai.model || 'gpt-4o');
          setAnthropicModel(overrides?.anthropic.model || effective.anthropic.model || 'claude-sonnet-4-20250514');
        }
      }
    } catch (err) {
      setError('Failed to load AI settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isPlatformAdmin) {
        // Save platform settings
        const response = await aiSettingsApi.updatePlatformSettings({
          provider,
          openaiApiKey: openaiApiKey || undefined,
          openaiModel,
          anthropicApiKey: anthropicApiKey || undefined,
          anthropicModel,
        });

        if (response.success) {
          setSuccess('Platform AI settings saved successfully');
          setOpenaiApiKey('');
          setAnthropicApiKey('');
          loadSettings();
        } else {
          setError(response.error?.message || 'Failed to save settings');
        }
      } else {
        // Save org settings
        const response = await aiSettingsApi.updateOrgSettings(organizationId, {
          provider,
          openaiApiKey: openaiApiKey || undefined,
          openaiModel,
          anthropicApiKey: anthropicApiKey || undefined,
          anthropicModel,
        });

        if (response.success) {
          setSuccess('Organization AI settings saved successfully');
          setOpenaiApiKey('');
          setAnthropicApiKey('');
          loadSettings();
        } else {
          setError(response.error?.message || 'Failed to save settings');
        }
      }
    } catch (err) {
      setError('Failed to save AI settings');
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleClearOrgSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await aiSettingsApi.clearOrgSettings(organizationId);
      if (response.success) {
        setSuccess('Organization settings cleared. Using platform defaults.');
        loadSettings();
      } else {
        setError(response.error?.message || 'Failed to clear settings');
      }
    } catch (err) {
      setError('Failed to clear settings');
      console.error(err);
    } finally {
      setSaving(false);
      setShowClearDialog(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentSettings = isPlatformAdmin ? platformSettings : orgSettings?.effective;
  const hasOrgOverrides = !isPlatformAdmin && orgSettings?.overrides !== null;

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

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Current AI Configuration
          </CardTitle>
          <CardDescription>
            {isPlatformAdmin
              ? 'Platform-wide default AI provider settings'
              : 'Your organization\'s AI provider configuration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Active Provider</Label>
              <div className="flex items-center gap-2">
                <Badge variant={currentSettings?.provider === 'openai' ? 'default' : 'secondary'}>
                  {currentSettings?.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                </Badge>
                {!isPlatformAdmin && hasOrgOverrides && (
                  <Badge variant="outline">Custom</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">OpenAI Status</Label>
              <Badge variant={
                (isPlatformAdmin ? platformSettings?.openai.configured : orgSettings?.effective.openai.configured)
                  ? 'default'
                  : 'destructive'
              }>
                {(isPlatformAdmin ? platformSettings?.openai.configured : orgSettings?.effective.openai.configured)
                  ? 'Configured'
                  : 'Not Configured'}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Anthropic Status</Label>
              <Badge variant={
                (isPlatformAdmin ? platformSettings?.anthropic.configured : orgSettings?.effective.anthropic.configured)
                  ? 'default'
                  : 'destructive'
              }>
                {(isPlatformAdmin ? platformSettings?.anthropic.configured : orgSettings?.effective.anthropic.configured)
                  ? 'Configured'
                  : 'Not Configured'}
              </Badge>
            </div>

            {!isPlatformAdmin && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Settings Source</Label>
                <Badge variant="outline">
                  {hasOrgOverrides ? 'Organization Override' : 'Platform Default'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isPlatformAdmin ? 'Update Platform Settings' : 'Update Organization Settings'}
          </CardTitle>
          <CardDescription>
            {isPlatformAdmin
              ? 'Configure default AI provider settings for all organizations'
              : 'Override platform defaults with your own API keys'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select which AI provider to use for content analysis
            </p>
          </div>

          {/* OpenAI Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              OpenAI Configuration
              {(isPlatformAdmin ? platformSettings?.openai.configured : orgSettings?.effective.openai.configured) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </h4>

            <div className="space-y-2">
              <Label htmlFor="openai-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    placeholder={
                      (isPlatformAdmin ? platformSettings?.openai.apiKey : orgSettings?.overrides?.openai.apiKey) ||
                      'Enter new API key to update'
                    }
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Leave blank to keep existing key. Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Dashboard
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-model">Model</Label>
              <Select value={openaiModel} onValueChange={setOpenaiModel}>
                <SelectTrigger id="openai-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anthropic Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              Anthropic Configuration
              {(isPlatformAdmin ? platformSettings?.anthropic.configured : orgSettings?.effective.anthropic.configured) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </h4>

            <div className="space-y-2">
              <Label htmlFor="anthropic-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="anthropic-key"
                    type={showAnthropicKey ? 'text' : 'password'}
                    placeholder={
                      (isPlatformAdmin ? platformSettings?.anthropic.apiKey : orgSettings?.overrides?.anthropic.apiKey) ||
                      'Enter new API key to update'
                    }
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                >
                  {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Leave blank to keep existing key. Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic Console
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anthropic-model">Model</Label>
              <Select value={anthropicModel} onValueChange={setAnthropicModel}>
                <SelectTrigger id="anthropic-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {ANTHROPIC_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {!isPlatformAdmin && hasOrgOverrides && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClearDialog(true)}
                  disabled={saving}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Platform Defaults
                </Button>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Platform Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your organization&apos;s custom AI settings and revert to using the platform defaults.
              Any API keys you&apos;ve configured will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearOrgSettings}>
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AISettingsTab;
