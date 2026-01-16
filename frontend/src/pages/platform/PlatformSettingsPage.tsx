import { useState, useEffect } from 'react';
import { Settings, Flag, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import platformApi from '@/api/platform.api';
import type { PlatformSetting, FeatureFlag } from '@/types';

export function PlatformSettingsPage() {
  const { currentRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);

  // Edit states
  const [editedSettings, setEditedSettings] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const isPlatformAdmin = currentRole && currentRole.level >= 100;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [settingsRes, flagsRes] = await Promise.all([
        platformApi.getSettings(),
        platformApi.getFeatureFlags(),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
        const settingsMap = new Map<string, string>();
        settingsRes.data.forEach((s) => settingsMap.set(s.key, s.value));
        setEditedSettings(settingsMap);
      }
      if (flagsRes.success && flagsRes.data) {
        setFeatureFlags(flagsRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load platform settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings((prev) => {
      const updated = new Map(prev);
      updated.set(key, value);
      return updated;
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError('');

    try {
      const promises = Array.from(editedSettings.entries()).map(([key, value]) =>
        platformApi.updateSetting(key, value)
      );
      await Promise.all(promises);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeatureFlag = async (flagId: number, enabled: boolean) => {
    try {
      await platformApi.updateFeatureFlag(flagId, enabled);
      setFeatureFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, defaultEnabled: enabled } : f))
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update feature flag');
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, PlatformSetting[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            You don't have permission to access platform settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and feature flags.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="feature-flags">
            <Flag className="mr-2 h-4 w-4" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key}>{setting.key}</Label>
                        <Badge variant="outline" className="text-xs">
                          {setting.type}
                        </Badge>
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      )}
                      {setting.type === 'BOOLEAN' ? (
                        <Switch
                          id={setting.key}
                          checked={editedSettings.get(setting.key) === 'true'}
                          onCheckedChange={(checked) =>
                            handleSettingChange(setting.key, String(checked))
                          }
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          type={setting.type === 'NUMBER' ? 'number' : 'text'}
                          value={editedSettings.get(setting.key) || ''}
                          onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="feature-flags">
          <Card>
            <CardHeader>
              <CardTitle>Platform Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable features globally. Organizations can further restrict these for
                their users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{flag.name}</p>
                        <Badge variant="outline" className="text-xs font-mono">
                          {flag.key}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={flag.defaultEnabled}
                      onCheckedChange={(checked) => handleToggleFeatureFlag(flag.id, checked)}
                    />
                  </div>
                ))}
                {featureFlags.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No feature flags configured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
