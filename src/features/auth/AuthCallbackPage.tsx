import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { FullPageSpinner } from '@/components/Spinner';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/dashboard' : '/login', { replace: true });
  }, [session, loading, navigate]);

  return <FullPageSpinner label="Signing you in…" />;
}
