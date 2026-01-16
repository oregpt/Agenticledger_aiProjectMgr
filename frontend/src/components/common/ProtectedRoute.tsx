import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PageLoader } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoleLevel?: number;
}

export function ProtectedRoute({ children, requiredRoleLevel }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, currentRole } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role level if required
  if (requiredRoleLevel && currentRole && currentRole.level < requiredRoleLevel) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
