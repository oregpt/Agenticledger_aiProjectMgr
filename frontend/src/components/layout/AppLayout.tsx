import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import apiClient from '@/api/client';
import authApi from '@/api/auth.api';
import { PageLoader } from '@/components/common/LoadingSpinner';

export function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setUser, currentOrgId } = useAuthStore();
  const { setMenus } = usePermissionsStore();
  const { setFlags } = useFeatureFlagsStore();

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
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [isAuthenticated, currentOrgId]);

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
