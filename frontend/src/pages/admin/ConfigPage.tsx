/**
 * Admin Configuration Page
 * Manage Projects, Plan Item Types, Content Types, and Activity Types
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Search,
  FolderKanban,
  Layers,
  FileType,
  Activity,
  Lock,
  Loader2,
  Key,
  Copy,
  Check,
  BookOpen,
  Bot,
  Sparkles,
  Building2,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useProjectStore } from '@/stores/projectStore';
import { projectsApi } from '@/api/projects.api';
import type { Project } from '@/types';
import {
  configApi,
  type PlanItemType,
  type ContentType,
  type ActivityType,
  type CreatePlanItemTypeInput,
  type CreateContentTypeInput,
  type CreateActivityTypeInput,
} from '@/api/config.api';
import {
  apiKeysApi,
  type ApiKey,
  type CreateApiKeyResponse,
} from '@/api/api-keys.api';
import { AISettingsTab } from '@/components/admin/AISettingsTab';
import { PromptTemplatesTab } from '@/components/admin/PromptTemplatesTab';
import { OrganizationTab } from '@/components/admin/OrganizationTab';
import { RolesTab } from '@/components/admin/RolesTab';
import { useAuthStore } from '@/stores/authStore';

export function ConfigPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const { currentRole, currentOrgId } = useAuthStore();
  const isPlatformAdmin = (currentRole?.level ?? 0) >= 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Configuration</h1>
            <p className="text-muted-foreground">
              Manage projects and system configuration types.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open('/api/docs', '_blank')}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          API Documentation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="plan-item-types" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Plan Item Types
          </TabsTrigger>
          <TabsTrigger value="content-types" className="flex items-center gap-2">
            <FileType className="h-4 w-4" />
            Content Types
          </TabsTrigger>
          <TabsTrigger value="activity-types" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Types
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          {isPlatformAdmin && (
            <TabsTrigger value="prompt-templates" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Prompt Templates
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>

        <TabsContent value="plan-item-types">
          <PlanItemTypesTab />
        </TabsContent>

        <TabsContent value="content-types">
          <ContentTypesTab />
        </TabsContent>

        <TabsContent value="activity-types">
          <ActivityTypesTab />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="ai-settings">
          <AISettingsTab
            isPlatformAdmin={isPlatformAdmin}
            organizationId={currentOrgId || 0}
          />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        {isPlatformAdmin && (
          <TabsContent value="prompt-templates">
            <PromptTemplatesTab isPlatformAdmin={isPlatformAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============ Projects Tab ============

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { setCurrentProject } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectsApi.list();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    await projectsApi.delete(projectToDelete.id);
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    fetchProjects();
  };

  const handleViewProject = (project: Project) => {
    setCurrentProject(project);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Manage your organization's projects.</CardDescription>
          </div>
          <Button onClick={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.client || '-'}</TableCell>
                  <TableCell>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProject(project)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSaved={fetchProjects}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ============ Plan Item Types Tab ============

function PlanItemTypesTab() {
  const [types, setTypes] = useState<PlanItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<PlanItemType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<PlanItemType | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await configApi.listPlanItemTypes({ search });
      if (response.success && response.data) {
        setTypes(response.data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: PlanItemType) => {
    if (type.isSystem) return;
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleDelete = (type: PlanItemType) => {
    if (type.isSystem) return;
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    await configApi.deletePlanItemType(typeToDelete.id);
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
    fetchTypes();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plan Item Types</CardTitle>
            <CardDescription>Define the hierarchy levels for project plans.</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{type.slug}</code>
                  </TableCell>
                  <TableCell>{type.level}</TableCell>
                  <TableCell>
                    {type.isSystem ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type)}
                        disabled={type.isSystem}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type)}
                        disabled={type.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <PlanItemTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={editingType}
        onSaved={fetchTypes}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan Item Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ============ Content Types Tab ============

function ContentTypesTab() {
  const [types, setTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ContentType | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await configApi.listContentTypes({ search });
      if (response.success && response.data) {
        setTypes(response.data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: ContentType) => {
    if (type.isSystem) return;
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleDelete = (type: ContentType) => {
    if (type.isSystem) return;
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    await configApi.deleteContentType(typeToDelete.id);
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
    fetchTypes();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Types</CardTitle>
            <CardDescription>Define the types of content that can be ingested.</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{type.slug}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {type.description || '-'}
                  </TableCell>
                  <TableCell>
                    {type.isSystem ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type)}
                        disabled={type.isSystem}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type)}
                        disabled={type.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ContentTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={editingType}
        onSaved={fetchTypes}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ============ Activity Types Tab ============

function ActivityTypesTab() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ActivityType | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await configApi.listActivityTypes({ search });
      if (response.success && response.data) {
        setTypes(response.data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: ActivityType) => {
    if (type.isSystem) return;
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleDelete = (type: ActivityType) => {
    if (type.isSystem) return;
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    await configApi.deleteActivityType(typeToDelete.id);
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
    fetchTypes();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Types</CardTitle>
            <CardDescription>Define the types of activities that can be extracted.</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{type.slug}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {type.description || '-'}
                  </TableCell>
                  <TableCell>
                    {type.isSystem ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type)}
                        disabled={type.isSystem}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type)}
                        disabled={type.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ActivityTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={editingType}
        onSaved={fetchTypes}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ============ API Keys Tab ============

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiKeysApi.list();
      setKeys(data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = () => {
    setCreatedKey(null);
    setDialogOpen(true);
  };

  const handleDelete = (key: ApiKey) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;
    try {
      await apiKeysApi.revoke(keyToDelete.id);
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
      fetchKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyCreated = (newKey: CreateApiKeyResponse) => {
    setCreatedKey(newKey);
    fetchKeys();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access. Keys provide full user-level access.
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{key.keyPrefix}</code>
                  </TableCell>
                  <TableCell>{formatDate(key.createdAt)}</TableCell>
                  <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                  <TableCell>{key.expiresAt ? formatDate(key.expiresAt) : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No API keys found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create API Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setCreatedKey(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? 'Copy your API key now. It will not be shown again!'
                : 'Create a new API key for programmatic access.'}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Key className="h-4 w-4" />
                  <span className="font-medium">Save this key now!</span>
                </div>
                <p className="text-sm text-amber-700">
                  This is the only time you will see the full API key. Store it securely.
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                    {createdKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyKey(createdKey.key)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p>{createdKey.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expires</Label>
                  <p>{createdKey.expiresAt ? formatDate(createdKey.expiresAt) : 'Never'}</p>
                </div>
              </div>
            </div>
          ) : (
            <CreateApiKeyForm
              onCreated={handleKeyCreated}
              onCancel={() => setDialogOpen(false)}
            />
          )}

          {createdKey && (
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)}>Done</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{keyToDelete?.name}"? This action cannot be
              undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface CreateApiKeyFormProps {
  onCreated: (key: CreateApiKeyResponse) => void;
  onCancel: () => void;
}

function CreateApiKeyForm({ onCreated, onCancel }: CreateApiKeyFormProps) {
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const result = await apiKeysApi.create({
        name: name.trim(),
        expiresAt: expiresAt || undefined,
      });
      onCreated(result);
    } catch (err) {
      setError('Failed to create API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="key-name">Name *</Label>
        <Input
          id="key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Production API Key"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="key-expires">Expiration Date (optional)</Label>
        <Input
          id="key-expires"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Leave empty for a key that never expires.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Key
        </Button>
      </DialogFooter>
    </div>
  );
}

// ============ Dialogs ============

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaved: () => void;
}

function ProjectDialog({ open, onOpenChange, project, onSaved }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [status, setStatus] = useState<Project['status']>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClient(project.client || '');
      setDescription(project.description || '');
      setStartDate(project.startDate?.split('T')[0] || '');
      setTargetEndDate(project.targetEndDate?.split('T')[0] || '');
      setStatus(project.status);
    } else {
      setName('');
      setClient('');
      setDescription('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetEndDate('');
      setStatus('active');
    }
  }, [project, open]);

  const handleSave = async () => {
    if (!name.trim() || !startDate) return;

    setSaving(true);
    try {
      if (project) {
        await projectsApi.update(project.id, {
          name,
          client: client || null,
          description: description || null,
          startDate,
          targetEndDate: targetEndDate || null,
          status,
        });
      } else {
        await projectsApi.create({
          name,
          client: client || undefined,
          description: description || undefined,
          startDate,
          targetEndDate: targetEndDate || undefined,
          status,
        });
      }

      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details.' : 'Create a new project.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetEndDate">Target End Date</Label>
              <Input
                id="targetEndDate"
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as Project['status'])}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !startDate || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PlanItemTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: PlanItemType | null;
  onSaved: () => void;
}

function PlanItemTypeDialog({ open, onOpenChange, type, onSaved }: PlanItemTypeDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type) {
      setName(type.name);
      setSlug(type.slug);
      setDescription(type.description || '');
      setLevel(type.level);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setLevel(1);
    }
  }, [type, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!type) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    try {
      const data: CreatePlanItemTypeInput = { name, slug, description, level };

      if (type) {
        await configApi.updatePlanItemType(type.id, data);
      } else {
        await configApi.createPlanItemType(data);
      }

      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? 'Edit Plan Item Type' : 'Create Plan Item Type'}</DialogTitle>
          <DialogDescription>
            Plan item types define the hierarchy levels in your project plans.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Phase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., phase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Level *</Label>
            <Input
              id="level"
              type="number"
              min={1}
              max={10}
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)}
            />
            <p className="text-sm text-muted-foreground">
              Hierarchy level (1 = top level, 5 = deepest)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !slug.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type ? 'Save Changes' : 'Create Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ContentTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContentType | null;
  onSaved: () => void;
}

function ContentTypeDialog({ open, onOpenChange, type, onSaved }: ContentTypeDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type) {
      setName(type.name);
      setSlug(type.slug);
      setDescription(type.description || '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
    }
  }, [type, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!type) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    try {
      const data: CreateContentTypeInput = { name, slug, description };

      if (type) {
        await configApi.updateContentType(type.id, data);
      } else {
        await configApi.createContentType(data);
      }

      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? 'Edit Content Type' : 'Create Content Type'}</DialogTitle>
          <DialogDescription>
            Content types categorize the content you ingest into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Presentation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., presentation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !slug.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type ? 'Save Changes' : 'Create Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ActivityTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ActivityType | null;
  onSaved: () => void;
}

function ActivityTypeDialog({ open, onOpenChange, type, onSaved }: ActivityTypeDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type) {
      setName(type.name);
      setSlug(type.slug);
      setDescription(type.description || '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
    }
  }, [type, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!type) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    try {
      const data: CreateActivityTypeInput = { name, slug, description };

      if (type) {
        await configApi.updateActivityType(type.id, data);
      } else {
        await configApi.createActivityType(data);
      }

      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? 'Edit Activity Type' : 'Create Activity Type'}</DialogTitle>
          <DialogDescription>
            Activity types categorize the activities extracted from content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Key Decision"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., key_decision"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !slug.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type ? 'Save Changes' : 'Create Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Helpers ============

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colorMap[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default ConfigPage;
