import { useEffect, useState } from 'react';

export type HealthStatus = 'loading' | 'healthy' | 'unreachable' | 'unhealthy';

export interface HealthCheckState {
  status: HealthStatus;
  detail?: string;
  checkedUrl: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? window.location.origin;

export function useHealthCheck(): HealthCheckState {
  const checkedUrl = `${BACKEND_URL}/healthz`;
  const [state, setState] = useState<HealthCheckState>({ status: 'loading', checkedUrl });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(checkedUrl, { signal: AbortSignal.timeout(5000) });
        if (cancelled) return;
        if (res.ok) {
          setState({ status: 'healthy', checkedUrl });
        } else {
          let detail: string | undefined;
          try {
            const body = await res.json();
            detail = body?.detail ?? body?.message ?? body?.error;
          } catch {
            detail = res.statusText || `HTTP ${res.status}`;
          }
          setState({ status: 'unhealthy', detail, checkedUrl });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'unreachable', detail: message, checkedUrl });
      }
    }

    check();
    return () => { cancelled = true; };
  }, [checkedUrl]);

  return state;
}
