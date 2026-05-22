import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type ConnectionStatus = 'online' | 'degraded' | 'offline';

const SUPABASE_PING_INTERVAL_MS = 30_000;

/**
 * Three-state connection indicator:
 *   - online   → browser online AND Supabase reachable
 *   - degraded → browser online but Supabase last ping failed
 *   - offline  → browser reports no network
 */
export function useConnectionStatus(): ConnectionStatus {
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [supabaseHealthy, setSupabaseHealthy] = useState(true);

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        const { error } = await supabase.auth.getSession();
        if (!cancelled) setSupabaseHealthy(!error);
      } catch {
        if (!cancelled) setSupabaseHealthy(false);
      }
    }
    ping();
    const id = window.setInterval(ping, SUPABASE_PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!browserOnline) return 'offline';
  if (!supabaseHealthy) return 'degraded';
  return 'online';
}
