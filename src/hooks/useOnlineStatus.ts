import { useEffect, useState } from 'react';

export type ConnectionStatus = 'online' | 'degraded' | 'offline';

const SUPABASE_PING_INTERVAL_MS = 60_000;
const PING_TIMEOUT_MS = 5_000;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Three-state connection indicator:
 *   - online   → browser online AND Supabase health endpoint reachable
 *   - degraded → browser online but Supabase last ping failed (network or 5xx)
 *   - offline  → browser reports no network
 *
 * The Supabase ping hits the public auth health endpoint, which:
 *   - Requires no auth header (works for logged-out users too)
 *   - Returns a small JSON payload (< 200 bytes)
 *   - Is independent of session state, so failures here mean "Supabase unreachable"
 *     rather than "your session expired" — exactly the signal we want.
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
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!cancelled) setSupabaseHealthy(false);
        return;
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!cancelled) setSupabaseHealthy(response.ok);
      } catch {
        if (!cancelled) setSupabaseHealthy(false);
      } finally {
        window.clearTimeout(timer);
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
