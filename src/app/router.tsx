import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  {
    path: '*',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">404</h1>
          <p className="text-sm text-muted-foreground">Page not found</p>
        </div>
      </div>
    ),
  },
]);
