import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Users, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import platformApi from '@/api/platform.api';
import type { Organization } from '@/types';

export function AllOrganizationsPage() {
  const { currentRole, setCurrentOrg } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Create dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isPlatformAdmin = currentRole && currentRole.level >= 100;

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await platformApi.getOrganizations();
      if (response.success && response.data) {
        setOrganizations(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName) return;
    setIsCreating(true);

    try {
      const response = await platformApi.createOrganization({
        name: newOrgName,
        slug: newOrgSlug || undefined,
        description: newOrgDescription || undefined,
      });

      if (response.success && response.data) {
        setOrganizations((prev) => [...prev, response.data!]);
        setNewOrgName('');
        setNewOrgSlug('');
        setNewOrgDescription('');
        setIsCreateOpen(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteOrganization = async (orgId: number) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await platformApi.deleteOrganization(orgId);
      if (response.success) {
        setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete organization');
    }
  };

  const handleSwitchToOrg = (orgId: number) => {
    setCurrentOrg(orgId);
    window.location.href = '/dashboard';
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            You don't have permission to manage organizations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organizations on the platform.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization on the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Slug (optional)</Label>
                <Input
                  id="orgSlug"
                  placeholder="acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-generate from name.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description (optional)</Label>
                <Input
                  id="orgDescription"
                  placeholder="Brief description of the organization"
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrganization} disabled={isCreating || !newOrgName}>
                {isCreating ? 'Creating...' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter((o) => !o.isPlatform).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                {filteredOrganizations.length} organizations
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        {org.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {org.description}
                          </p>
                        )}
                      </div>
                      {org.isPlatform && (
                        <Badge variant="secondary" className="ml-2">
                          Platform
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    @{org.slug}
                  </TableCell>
                  <TableCell>{org.userCount || 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchToOrg(org.id)}
                      >
                        Switch
                      </Button>
                      {!org.isPlatform && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOrganization(org.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrganizations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No organizations found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
