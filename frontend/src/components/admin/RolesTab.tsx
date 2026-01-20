/**
 * Roles Tab - Wrapper component for roles & permissions management within Admin Config
 */

import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import rolesApi, { type RolePermissionInput } from '@/api/roles.api';
import type { Role, Menu, Permission } from '@/types';

export function RolesTab() {
  const { currentOrgId, currentRole } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<Map<number, RolePermissionInput>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Create role dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleBaseId, setNewRoleBaseId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isOrgAdmin = currentRole && currentRole.level >= 40;

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId]);

  const loadData = async () => {
    if (!currentOrgId) return;
    setIsLoading(true);
    setError('');

    try {
      const [rolesRes, menusRes] = await Promise.all([
        rolesApi.list(currentOrgId),
        rolesApi.getMenus(),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
        // Select first role by default
        if (rolesRes.data.length > 0 && !selectedRole) {
          selectRole(rolesRes.data[0]);
        }
      }
      if (menusRes.success && menusRes.data) {
        setMenus(menusRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const selectRole = async (role: Role) => {
    if (!currentOrgId) return;
    setSelectedRole(role);
    setIsEditing(false);

    try {
      const response = await rolesApi.get(currentOrgId, role.id);
      if (response.success && response.data) {
        setRolePermissions(response.data.permissions);
        // Initialize edited permissions
        const permMap = new Map<number, RolePermissionInput>();
        response.data.permissions.forEach((p) => {
          permMap.set(p.menuId, {
            menuId: p.menuId,
            canCreate: p.canCreate,
            canRead: p.canRead,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
          });
        });
        setEditedPermissions(permMap);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load role permissions');
    }
  };

  const handlePermissionChange = (
    menuId: number,
    action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
    value: boolean
  ) => {
    setEditedPermissions((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(menuId) || {
        menuId,
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      };
      updated.set(menuId, { ...existing, [action]: value });
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!currentOrgId || !selectedRole) return;
    setIsSaving(true);

    try {
      const permissions = Array.from(editedPermissions.values());
      const response = await rolesApi.updatePermissions(currentOrgId, selectedRole.id, permissions);

      if (response.success) {
        setIsEditing(false);
        // Refresh role permissions
        await selectRole(selectedRole);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!currentOrgId || !newRoleName) return;
    setIsCreating(true);

    try {
      const response = await rolesApi.create(currentOrgId, {
        name: newRoleName,
        description: newRoleDescription || undefined,
        baseRoleId: newRoleBaseId || undefined,
      });

      if (response.success && response.data) {
        setRoles((prev) => [...prev, response.data!]);
        selectRole(response.data);
        setNewRoleName('');
        setNewRoleDescription('');
        setNewRoleBaseId(null);
        setIsCreateOpen(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create role');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!currentOrgId) return;

    try {
      const response = await rolesApi.delete(currentOrgId, roleId);
      if (response.success) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
          setRolePermissions([]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete role');
    }
  };

  const getPermissionForMenu = (menuId: number) => {
    if (isEditing) {
      return editedPermissions.get(menuId) || {
        menuId,
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      };
    }
    return rolePermissions.find((p) => p.menuId === menuId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isOrgAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have permission to access this section.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles and configure permissions for each page.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
              <DialogDescription>
                Create a new role for your organization. You can optionally inherit permissions from
                an existing role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Report Editor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description (optional)</Label>
                <Input
                  id="roleDescription"
                  placeholder="Brief description of the role"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseRole">Inherit from (optional)</Label>
                <select
                  id="baseRole"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newRoleBaseId || ''}
                  onChange={(e) => setNewRoleBaseId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Start from scratch</option>
                  {roles
                    .filter((r) => r.isSystem)
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Inherit all permissions from an existing system role.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={isCreating || !newRoleName}>
                {isCreating ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Roles List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedRole?.id === role.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => selectRole(role)}
                >
                  <div className="flex items-center gap-3">
                    <Shield
                      className={`h-4 w-4 ${
                        selectedRole?.id === role.id ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Level {role.level}
                        </Badge>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Permissions Matrix */}
        <div className="col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedRole ? `${selectedRole.name} Permissions` : 'Select a Role'}
                </CardTitle>
                <CardDescription>
                  {selectedRole?.description || 'Configure what actions this role can perform.'}
                </CardDescription>
              </div>
              {selectedRole && !selectedRole.isSystem && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleSavePermissions} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Permissions
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedRole ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page / Menu</TableHead>
                      <TableHead className="text-center w-24">Create</TableHead>
                      <TableHead className="text-center w-24">Read</TableHead>
                      <TableHead className="text-center w-24">Update</TableHead>
                      <TableHead className="text-center w-24">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menus.map((menu) => {
                      const perm = getPermissionForMenu(menu.id);
                      return (
                        <TableRow key={menu.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{menu.name}</p>
                              <p className="text-xs text-muted-foreground">{menu.path}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canCreate || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(menu.id, 'canCreate', !!checked)
                              }
                              disabled={!isEditing || selectedRole.isSystem}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canRead || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(menu.id, 'canRead', !!checked)
                              }
                              disabled={!isEditing || selectedRole.isSystem}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canUpdate || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(menu.id, 'canUpdate', !!checked)
                              }
                              disabled={!isEditing || selectedRole.isSystem}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canDelete || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(menu.id, 'canDelete', !!checked)
                              }
                              disabled={!isEditing || selectedRole.isSystem}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a role to view and edit its permissions.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
