import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  ChevronDown,
  ChevronUp,
  Ban,
  Rocket,
  Square,
  X,
} from 'lucide-react';
import { listDeployments, cancelDeployment } from '../../api/onramp';
import { useDeploymentPoller } from '../../hooks/useDeploymentPoller';
import { useTaskPoller } from '../../hooks/useTaskPoller';
import { DEPLOY_ORDER } from '../../config/deployOrder';
import TaskMonitorModal from '../steps/TaskMonitorModal';
import type { Deployment, DeploymentStatus } from '../../types/api';

type BannerState = 'loading' | 'idle' | 'active' | 'succeeded' | 'failed' | 'canceled';

function labelForAction(component: string, action: string): string {
  const match = DEPLOY_ORDER.find((s) => s.component === component && s.action === action);
  return match?.label ?? `${component}/${action}`;
}

function bannerStateFromDeployment(d: Deployment | null): BannerState {
  if (!d) return 'idle';
  switch (d.status) {
    case 'pending':
    case 'running':
      return 'active';
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return 'idle';
  }
}

export default function DeploymentBanner() {
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null);
  const [initDone, setInitDone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [monitorActionId, setMonitorActionId] = useState<string | null>(null);
  const [monitorLabel, setMonitorLabel] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { deployment, error: pollError } = useDeploymentPoller(activeDeploymentId);
  const { task, error: taskError, reset: resetPoller } = useTaskPoller(monitorActionId);

  useEffect(() => {
    let cancelled = false;
    listDeployments()
      .then((deployments) => {
        if (cancelled) return;
        if (Array.isArray(deployments)) {
          const active = deployments.find(
            (d) => d.status === 'running' || d.status === 'pending',
          );
          if (active) setActiveDeploymentId(active.id);
        }
        setInitDone(true);
      })
      .catch(() => {
        if (!cancelled) setInitDone(true);
      });
    return () => { cancelled = true; };
  }, []);

  const bannerState = useMemo<BannerState>(() => {
    if (!initDone) return 'loading';
    return bannerStateFromDeployment(deployment);
  }, [initDone, deployment]);

  const runningAction = useMemo(() => {
    if (!deployment) return null;
    return deployment.actions.find((a) => a.status === 'running') ?? null;
  }, [deployment]);

  const completedCount = useMemo(
    () => deployment?.actions.filter((a) => a.status === 'succeeded').length ?? 0,
    [deployment],
  );

  const totalCount = deployment?.actions.length ?? 0;

  const currentLabel = runningAction
    ? labelForAction(runningAction.component, runningAction.action)
    : '';

  const failedAction = useMemo(() => {
    if (!deployment) return null;
    return deployment.actions.find((a) => a.status === 'failed') ?? null;
  }, [deployment]);

  const failedLabel = failedAction
    ? labelForAction(failedAction.component, failedAction.action)
    : '';

  const openMonitor = useCallback(
    (actionId: string, label: string) => {
      resetPoller();
      setMonitorActionId(actionId);
      setMonitorLabel(label);
      setShowMonitor(true);
    },
    [resetPoller],
  );

  const handleCancel = useCallback(async () => {
    if (!activeDeploymentId) return;
    setCanceling(true);
    try {
      await cancelDeployment(activeDeploymentId);
    } catch {
      // poller will pick up actual state
    } finally {
      setCanceling(false);
    }
  }, [activeDeploymentId]);

  const stepIcon = (status: DeploymentStatus) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'running':
        return <Loader2 size={16} className="text-sky-500 animate-spin" />;
      case 'canceled':
        return <Ban size={16} className="text-gray-400" />;
      default:
        return <Circle size={16} className="text-gray-300" />;
    }
  };

  if (bannerState === 'loading' || bannerState === 'idle' || dismissed) return null;

  const barColor =
    bannerState === 'succeeded'
      ? 'bg-emerald-50 border-emerald-200'
      : bannerState === 'failed'
        ? 'bg-red-50 border-red-200'
        : bannerState === 'canceled'
          ? 'bg-gray-50 border-gray-200'
          : 'bg-sky-50 border-sky-200';

  const barTextColor =
    bannerState === 'succeeded'
      ? 'text-emerald-800'
      : bannerState === 'failed'
        ? 'text-red-800'
        : bannerState === 'canceled'
          ? 'text-gray-700'
          : 'text-sky-800';

  return (
    <div className={`relative border-b ${barColor}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`w-full flex items-center gap-3 pl-6 pr-12 py-3 text-left ${barTextColor}`}
      >
        {bannerState === 'active' && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
        {bannerState === 'succeeded' && <CheckCircle size={16} className="flex-shrink-0" />}
        {bannerState === 'failed' && <XCircle size={16} className="flex-shrink-0" />}
        {bannerState === 'canceled' && <Ban size={16} className="flex-shrink-0" />}

        <span className="text-sm font-medium flex-1">
          {bannerState === 'succeeded' && 'Deployment Complete'}
          {bannerState === 'failed' && `Deployment Failed: ${failedLabel}`}
          {bannerState === 'canceled' && 'Deployment Canceled'}
          {bannerState === 'active' && `Deploying: ${currentLabel} (${completedCount}/${totalCount} complete)`}
        </span>

        {pollError && (
          <span className="text-xs text-red-500 mr-2">Poll error</span>
        )}

        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <button
        onClick={() => setDismissed(true)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-50 hover:opacity-100 transition-opacity ${barTextColor}`}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>

      {expanded && deployment && (
        <div className="px-6 pb-4 space-y-2">
          {deployment.actions.map((action) => {
            const label = labelForAction(action.component, action.action);
            const canViewOutput = action.status === 'running' || action.status === 'failed' || action.status === 'succeeded';
            return (
              <div
                key={action.action_id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  action.status === 'running'
                    ? 'bg-sky-100/60'
                    : action.status === 'failed'
                      ? 'bg-red-100/60'
                      : action.status === 'succeeded'
                        ? 'bg-emerald-100/40'
                        : action.status === 'canceled'
                          ? 'bg-gray-100/40'
                          : 'bg-white/60'
                }`}
              >
                {stepIcon(action.status)}
                <span className="flex-1 font-medium text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">{action.component}/{action.action}</span>
                {canViewOutput && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openMonitor(action.action_id, label); }}
                    className={`text-xs font-medium ml-2 ${
                      action.status === 'failed'
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-sky-600 hover:text-sky-700'
                    }`}
                  >
                    View Output
                  </button>
                )}
              </div>
            );
          })}

          {bannerState === 'succeeded' && (
            <div className="flex items-center gap-3 pt-2">
              <Rocket size={16} className="text-emerald-500" />
              <span className="text-sm text-emerald-700 font-medium">
                All components installed successfully.
              </span>
            </div>
          )}

          {bannerState === 'active' && (
            <div className="pt-2">
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Square size={12} />
                {canceling ? 'Canceling...' : 'Cancel Deployment'}
              </button>
            </div>
          )}
        </div>
      )}

      <TaskMonitorModal
        open={showMonitor}
        onClose={() => { setShowMonitor(false); setMonitorActionId(null); }}
        task={task}
        error={taskError}
        label={monitorLabel}
      />
    </div>
  );
}
