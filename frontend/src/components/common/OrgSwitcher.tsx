import { ChevronDown, Building2, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

export function OrgSwitcher() {
  const navigate = useNavigate();
  const { user, currentOrg, setCurrentOrg, currentRole } = useAuthStore();
  const { fetchPermissions } = usePermissionsStore();
  const { fetchFeatureFlags } = useFeatureFlagsStore();

  const organizations = user?.organizations || [];
  const isPlatformAdmin = currentRole?.level === 100;

  const handleOrgSwitch = async (orgId: number) => {
    if (orgId === currentOrg?.id) return;

    setCurrentOrg(orgId);

    // Refetch permissions and feature flags for new org
    try {
      await Promise.all([fetchPermissions(orgId), fetchFeatureFlags(orgId)]);
    } catch (error) {
      console.error('Error switching organization:', error);
    }

    // Navigate to dashboard for fresh start
    navigate('/dashboard');
  };

  if (organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 hover:bg-muted transition-colors">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium max-w-[150px] truncate">
            {currentOrg?.name || 'Select organization'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSwitch(org.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.role.name}</p>
              </div>
            </div>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        {isPlatformAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/platform/organizations')}>
              <Plus className="mr-2 h-4 w-4" />
              View all organizations
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
