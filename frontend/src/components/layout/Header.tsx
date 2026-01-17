import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="text-sm">
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{currentOrg?.role.name}</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
