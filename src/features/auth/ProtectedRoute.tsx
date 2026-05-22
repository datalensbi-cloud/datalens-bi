import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { AppShellSkeleton } from '@/components/AppShellSkeleton';
import { FullPageSpinner } from '@/components/Spinner';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AppShellSkeleton />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { session, loading } = useAuth();

  if (loading) return <FullPageSpinner />;

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
