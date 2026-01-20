import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Shield, Palette, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { OrgSwitcher } from '@/components/common/OrgSwitcher';
import { ProjectSwitcher } from '@/components/plan/ProjectSwitcher';
import authApi from '@/api/auth.api';

export function Header() {
  const navigate = useNavigate();
  const { user, currentOrg, refreshToken, logout } = useAuthStore();

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

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Left side: Org Switcher + Project Switcher */}
      <div className="flex items-center gap-4">
        <OrgSwitcher />
        <div className="h-6 w-px bg-border" />
        <ProjectSwitcher />
      </div>

      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="text-sm text-left">
              <p className="font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{currentOrg?.role.name}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
    </header>
  );
}
