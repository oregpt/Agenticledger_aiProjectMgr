import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

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
