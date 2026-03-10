import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, WifiOff, ServerCrash } from 'lucide-react';
import type { HealthCheckState } from '../../hooks/useHealthCheck';

interface AlertBannerProps {
  health: HealthCheckState;
}

const COLLAPSED_MESSAGES: Record<string, string> = {
  unreachable: 'Cannot reach the backend service — check that it is running.',
  unhealthy: 'Backend service is running but reporting an unhealthy state.',
};

const EXPANDED_TITLES: Record<string, string> = {
  unreachable: 'Backend unreachable',
  unhealthy:   'Backend unhealthy',
};

export default function AlertBanner({ health }: AlertBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (health.status === 'loading' || health.status === 'healthy') return null;

  const isUnreachable = health.status === 'unreachable';
  const Icon = isUnreachable ? WifiOff : ServerCrash;
  const collapsedMsg = COLLAPSED_MESSAGES[health.status];
  const expandedTitle = EXPANDED_TITLES[health.status];

  return (
    <div className="border-b border-red-200 bg-red-50 text-red-900">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-red-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-inset"
        aria-expanded={expanded}
      >
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="flex-1 text-sm font-medium text-red-800 truncate">{collapsedMsg}</span>
        <span className="text-xs text-red-500 shrink-0 mr-1">
          {expanded ? 'Hide details' : 'Show details'}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-red-500 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1">
          <div className="flex items-start gap-3 bg-white border border-red-200 rounded-lg p-4">
            <Icon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold text-red-800">{expandedTitle}</p>

              {isUnreachable ? (
                <p className="text-sm text-red-700">
                  The frontend could not establish a connection to the backend API. Verify the
                  service is running and accessible, then refresh the page.
                </p>
              ) : (
                <p className="text-sm text-red-700">
                  The backend responded but its health check returned a non-OK status. Some
                  operations may fail until the service is healthy again.
                </p>
              )}

              <div className="space-y-1 pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-red-500 uppercase tracking-wide w-16 shrink-0">
                    Endpoint
                  </span>
                  <code className="text-xs text-red-800 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 break-all">
                    {health.checkedUrl}
                  </code>
                </div>

                {health.detail && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-red-500 uppercase tracking-wide w-16 shrink-0">
                      Detail
                    </span>
                    <span className="text-xs text-red-700 break-all">{health.detail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
