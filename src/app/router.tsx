import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';

import { AppLayout } from './AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { FilesPage } from '@/features/files/FilesPage';
import { PreviewPage } from '@/features/files/PreviewPage';
import { ChartsPage } from '@/features/charts/ChartsPage';
import { TemplatesPage } from '@/features/templates/TemplatesPage';
import { WorkspacesPage } from '@/features/workspaces/WorkspacesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { NotFoundPage } from '@/components/NotFoundPage';

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
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/files', element: <FilesPage /> },
          { path: '/files/:datasetId', element: <PreviewPage /> },
          { path: '/charts', element: <ChartsPage /> },
          { path: '/templates', element: <TemplatesPage /> },
          { path: '/workspaces', element: <WorkspacesPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
