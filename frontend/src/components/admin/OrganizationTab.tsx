/**
 * Organization Tab - Wrapper component for organization settings within Admin Config
 * Re-exports the OrganizationPage content for use in tabbed interface
 */

import { useState, useEffect } from 'react';
import { Building2, Users, Settings, Mail, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import organizationsApi, { type OrganizationDetails, type OrganizationUser } from '@/api/organizations.api';
import invitationsApi from '@/api/invitations.api';
import rolesApi from '@/api/roles.api';
import type { Role, Invitation, OrganizationFeatureFlag } from '@/types';

export function OrganizationTab() {
  const { currentOrgId, currentRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [featureFlags, setFeatureFlags] = useState<OrganizationFeatureFlag[]>([]);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Invite dialog states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<number | null>(null);
  const [isInviting, setIsInviting] = useState(false);

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
      const [orgRes, usersRes, invitationsRes, rolesRes, flagsRes] = await Promise.all([
        organizationsApi.getCurrent(currentOrgId),
        organizationsApi.getUsers(currentOrgId),
        invitationsApi.list(currentOrgId),
        rolesApi.list(currentOrgId),
        organizationsApi.getFeatureFlags(currentOrgId),
      ]);

      if (orgRes.success && orgRes.data) {
        setOrganization(orgRes.data);
        setOrgName(orgRes.data.name);
        setOrgDescription(orgRes.data.description || '');
      }
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      if (invitationsRes.success && invitationsRes.data) setInvitations(invitationsRes.data);
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
        const defaultRole = rolesRes.data.find((r) => r.slug === 'standard_user') || rolesRes.data[0];
        if (defaultRole) setInviteRoleId(defaultRole.id);
      }
      if (flagsRes.success && flagsRes.data) setFeatureFlags(flagsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!currentOrgId) return;
    setIsSaving(true);

    try {
      const response = await organizationsApi.update(currentOrgId, {
        name: orgName,
        description: orgDescription || undefined,
      });

      if (response.success) {
        setOrganization((prev) => (prev ? { ...prev, name: orgName, description: orgDescription } : prev));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!currentOrgId || !inviteEmail || !inviteRoleId) return;
    setIsInviting(true);

    try {
      const response = await invitationsApi.create(currentOrgId, {
        email: inviteEmail,
        roleId: inviteRoleId,
      });

      if (response.success && response.data) {
        setInvitations((prev) => [...prev, response.data!]);
        setInviteEmail('');
        setIsInviteOpen(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      const response = await invitationsApi.cancel(invitationId);
      if (response.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to cancel invitation');
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!currentOrgId) return;

    try {
      const response = await organizationsApi.removeUser(currentOrgId, userId);
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to remove user');
    }
  };

  const handleToggleFeatureFlag = async (flagId: number, enabled: boolean) => {
    if (!currentOrgId) return;

    try {
      await organizationsApi.updateFeatureFlag(currentOrgId, flagId, enabled);
      setFeatureFlags((prev) =>
        prev.map((f) =>
          f.featureFlagId === flagId
            ? { ...f, orgEnabled: enabled, effectiveEnabled: f.platformEnabled && enabled }
            : f
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update feature flag');
    }
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">
            <Building2 className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description</Label>
                <Input
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="A brief description of your organization"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={organization?.slug || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  Organization slug cannot be changed after creation.
                </p>
              </div>
              <Button onClick={handleSaveDetails} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>{users.length} members in this organization</CardDescription>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Mail className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite a new member</DialogTitle>
                      <DialogDescription>
                        Send an invitation email to join your organization.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteRole">Role</Label>
                        <select
                          id="inviteRole"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={inviteRoleId || ''}
                          onChange={(e) => setInviteRoleId(Number(e.target.value))}
                        >
                          {roles
                            .filter((r) => r.level < (currentRole?.level || 0))
                            .map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                        {isInviting ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role.name}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.role.level < (currentRole?.level || 0) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {invitations.filter((i) => i.status === 'PENDING').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    {invitations.filter((i) => i.status === 'PENDING').length} pending invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations
                        .filter((i) => i.status === 'PENDING')
                        .map((invitation) => (
                          <TableRow key={invitation.id}>
                            <TableCell className="font-medium">{invitation.email}</TableCell>
                            <TableCell>
                              {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable features for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div
                    key={flag.featureFlagId}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{flag.name}</p>
                        {!flag.platformEnabled && (
                          <Badge variant="outline" className="text-xs">
                            Disabled by Platform
                          </Badge>
                        )}
                      </div>
                      {flag.description && (
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={flag.orgEnabled}
                      onCheckedChange={(checked) =>
                        handleToggleFeatureFlag(flag.featureFlagId, checked)
                      }
                      disabled={!flag.platformEnabled}
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
