import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, ClipboardList, Inbox, Cog, User, Bell, Shield, Palette, ChevronDown, Home, ListTree, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import { useProjectStore } from '@/stores/projectStore';
import { OrgSwitcher } from '@/components/common/OrgSwitcher';
import { ProjectSwitcher } from '@/components/plan/ProjectSwitcher';
import apiClient from '@/api/client';
import authApi from '@/api/auth.api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';

const agentTabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home, requiresProject: false },
  { id: 'plan', label: 'Plan Agent', path: '/plan', icon: ListTree, requiresProject: true },
  { id: 'intake', label: 'Intake Agent', path: '/intake', icon: Inbox, requiresProject: true },
  { id: 'reporter', label: 'Activity Reporter', path: '/reporter', icon: ClipboardList, requiresProject: true },
  { id: 'admin', label: 'Admin', path: '/admin/config', icon: Cog, requiresProject: false },
];

export function AgentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setUser, currentOrgId, currentOrg, refreshToken, logout } = useAuthStore();
  const { setMenus } = usePermissionsStore();
  const { setFlags } = useFeatureFlagsStore();
  const { currentProject, fetchProjects } = useProjectStore();

  // Load user data and permissions on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        // Load user data
        if (!user) {
          const userResponse = await authApi.me();
          if (userResponse.success && userResponse.data) {
            setUser(userResponse.data);
          }
        }

        // Load user menus (with permissions)
        if (currentOrgId) {
          const menusResponse = await apiClient.get('/menus/user');
          if (menusResponse.data.success) {
            setMenus(menusResponse.data.data);
          }

          // Load feature flags
          const flagsResponse = await apiClient.get('/feature-flags/organization');
          if (flagsResponse.data.success) {
            setFlags(flagsResponse.data.data);
          }

          // Load projects
          fetchProjects();
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [isAuthenticated, currentOrgId]);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore errors
    }
    logout();
    navigate('/login');
  };

  // Get current active tab based on path
  const getActiveTab = () => {
    const path = location.pathname;
    for (const tab of agentTabs) {
      if (path.startsWith(tab.path)) {
        return tab.id;
      }
    }
    return 'plan';
  };

  const activeTab = getActiveTab();

  // Check if current tab requires project and none is selected
  const currentTabConfig = agentTabs.find(t => t.id === activeTab);
  const needsProjectSelection = currentTabConfig?.requiresProject && !currentProject;

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        {/* Left side: Logo + App Name + Project Switcher */}
        <div className="flex items-center gap-6">
          {/* Logo and App Name */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
              AI
            </div>
            <span className="font-semibold text-slate-900 text-lg hidden md:inline">
              Project Manager
            </span>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Project Switcher */}
          <ProjectSwitcher className="hidden md:flex" />
        </div>

        {/* Right side: Org Switcher + User Menu */}
        <div className="flex items-center gap-4">
          <OrgSwitcher />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="text-sm hidden lg:block text-left">
                  <p className="font-medium text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{currentOrg?.role.name}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/settings?tab=profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings?tab=notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings?tab=security')}>
                <Shield className="mr-2 h-4 w-4" />
                Security
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings?tab=appearance')}>
                <Palette className="mr-2 h-4 w-4" />
                Appearance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b bg-white">
        <div className="flex h-12 items-center px-6">
          <div className="flex gap-1">
            {agentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.requiresProject && !currentProject;

              return (
                <Link
                  key={tab.id}
                  to={isDisabled ? '#' : tab.path}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : isDisabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Project Switcher */}
          <div className="ml-auto md:hidden">
            <ProjectSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {needsProjectSelection ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <LayoutDashboard className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Select a Project
              </h2>
              <p className="text-slate-500 mb-6 max-w-md">
                Please select a project from the dropdown above to access this feature.
              </p>
              <ProjectSwitcher className="inline-flex" />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
