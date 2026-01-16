import { usePermissionsStore } from '@/stores/permissionsStore';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

interface RBACGuardProps {
  menuSlug: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RBACGuard({ menuSlug, action = 'read', fallback = null, children }: RBACGuardProps) {
  const { hasPermission } = usePermissionsStore();

  if (!hasPermission(menuSlug, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface FeatureFlagGuardProps {
  flagKey: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureFlagGuard({ flagKey, fallback = null, children }: FeatureFlagGuardProps) {
  const { isEnabled } = useFeatureFlagsStore();

  if (!isEnabled(flagKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
