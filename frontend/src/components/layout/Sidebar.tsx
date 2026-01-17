import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Download,
  Settings,
  History,
  Building2,
  Shield,
  Sliders,
  Building,
  ShieldCheck,
  ListTree,
  Inbox,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useAuthStore } from '@/stores/authStore';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Download,
  Settings,
  History,
  Building2,
  Shield,
  Sliders,
  Buildings: Building, // lucide uses 'Building' not 'Buildings'
  ShieldCheck,
  ListTree,
  Inbox,
  ClipboardList,
};

export function Sidebar() {
  const { menus } = usePermissionsStore();
  const { currentRole } = useAuthStore();

  const isPlatformAdmin = (currentRole?.level ?? 0) >= 100;
  const isOrgAdmin = (currentRole?.level ?? 0) >= 40;

  // Group menus by section
  const mainMenus = menus.filter((m) => m.section === 'MAIN');
  const adminMenus = menus.filter((m) => m.section === 'ADMIN');
  const platformMenus = menus.filter((m) => m.section === 'PLATFORM_ADMIN');

  const renderMenuItem = (menu: typeof menus[0]) => {
    const Icon = iconMap[menu.icon || 'FileText'] || FileText;

    return (
      <NavLink
        key={menu.slug}
        to={menu.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
      >
        <Icon className="h-4 w-4" />
        {menu.name}
      </NavLink>
    );
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">AI Project Manager</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Main Section */}
        {mainMenus.length > 0 && (
          <div className="space-y-1">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </h2>
            {mainMenus.map(renderMenuItem)}
          </div>
        )}

        {/* Admin Section */}
        {isOrgAdmin && adminMenus.length > 0 && (
          <div className="space-y-1">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </h2>
            {adminMenus.map(renderMenuItem)}
          </div>
        )}

        {/* Platform Admin Section */}
        {isPlatformAdmin && platformMenus.length > 0 && (
          <div className="space-y-1">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </h2>
            {platformMenus.map(renderMenuItem)}
          </div>
        )}
      </nav>
    </aside>
  );
}
