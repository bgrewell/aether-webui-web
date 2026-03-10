import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Rocket,
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  RotateCcw,
  ExternalLink,
  Play,
} from 'lucide-react';
import { syncInventory, executeAction } from '../../api/onramp';
import { useTaskPoller } from '../../hooks/useTaskPoller';
import { getDeployStepsForRoles, type DeployStep } from '../../config/deployOrder';
import { displayNameForRole } from '../../config/roles';
import type { WizardData } from '../../hooks/useWizardState';
import TaskMonitorModal from './TaskMonitorModal';

type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed';

interface DeploymentProps {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
  onDeployComplete?: () => void;
}

export default function Deployment({ data, update, onDeployComplete }: DeploymentProps) {
  const excluded = useMemo(() => new Set(data.excludedNodeIds), [data.excludedNodeIds]);
  const includedNodes = useMemo(
    () => data.nodes.filter((n) => !excluded.has(n.id)),
    [data.nodes, excluded]
  );

  const allRoles = useMemo(
    () => [...new Set(includedNodes.flatMap((n) => data.roleAssignments[n.id] ?? []))],
    [data.roleAssignments, includedNodes]
  );

  const deploySteps = useMemo(() => getDeployStepsForRoles(allRoles), [allRoles]);

  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    () => deploySteps.map(() => 'pending')
  );
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);
  const [monitorLabel, setMonitorLabel] = useState('');
  const [deployStarted, setDeployStarted] = useState(data.deploymentStarted);
  const [deployComplete, setDeployComplete] = useState(false);
  const runningRef = useRef(false);

  const { task, error: taskError, reset: resetPoller } = useTaskPoller(currentTaskId);

  useEffect(() => {
    if (!task || !runningRef.current) return;
    if (task.status === 'succeeded') {
      setStepStatuses((prev) => {
        const next = [...prev];
        next[currentStepIdx] = 'succeeded';
        return next;
      });
      advanceToNext(currentStepIdx + 1);
    } else if (task.status === 'failed') {
      setStepStatuses((prev) => {
        const next = [...prev];
        next[currentStepIdx] = 'failed';
        return next;
      });
      runningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.status]);

  const runStep = useCallback(
    async (step: DeployStep, idx: number) => {
      setCurrentStepIdx(idx);
      setStepStatuses((prev) => {
        const next = [...prev];
        next[idx] = 'running';
        return next;
      });
      setMonitorLabel(step.label);
      resetPoller();
      try {
        const t = await executeAction(step.component, step.action);
        setCurrentTaskId(t.id);
      } catch {
        setStepStatuses((prev) => {
          const next = [...prev];
          next[idx] = 'failed';
          return next;
        });
        runningRef.current = false;
      }
    },
    [resetPoller]
  );

  const advanceToNext = useCallback(
    (nextIdx: number) => {
      if (nextIdx >= deploySteps.length) {
        runningRef.current = false;
        setDeployComplete(true);
        return;
      }
      runStep(deploySteps[nextIdx], nextIdx);
    },
    [deploySteps, runStep]
  );

  const startDeployment = useCallback(async () => {
    setDeployStarted(true);
    update({ deploymentStarted: true });
    runningRef.current = true;
    setShowMonitor(true);
    try {
      await syncInventory();
    } catch {
      // continue anyway
    }
    runStep(deploySteps[0], 0);
  }, [deploySteps, runStep, update]);

  const retryFailed = useCallback(() => {
    if (currentStepIdx < 0 || currentStepIdx >= deploySteps.length) return;
    runningRef.current = true;
    runStep(deploySteps[currentStepIdx], currentStepIdx);
    setShowMonitor(true);
  }, [currentStepIdx, deploySteps, runStep]);

  const stepIcon = (status: StepStatus) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle size={18} className="text-emerald-500" />;
      case 'failed':
        return <XCircle size={18} className="text-red-500" />;
      case 'running':
        return <Loader2 size={18} className="text-sky-500 animate-spin" />;
      default:
        return <Circle size={18} className="text-gray-300" />;
    }
  };

  if (deploySteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Rocket size={28} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Components to Deploy</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          No roles were assigned that require deployment. You can go back to assign roles, or proceed
          to the dashboard.
        </p>
        <button
          onClick={() => onDeployComplete?.()}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Dashboard
          <ExternalLink size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Deployment</h2>
        <p className="text-sm text-gray-500 mt-1">
          {deployStarted
            ? 'Deployment is in progress. Monitor the status of each component below.'
            : 'Review the deployment plan and start installation when ready.'}
        </p>
      </div>

      {!deployStarted && (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Deployment Summary</p>
          <div className="space-y-2">
            {includedNodes.map((node) => {
              const roles = data.roleAssignments[node.id] ?? [];
              if (roles.length === 0) return null;
              return (
                <div key={node.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 font-medium">{node.name}</span>
                  <span className="text-gray-400">-</span>
                  <div className="flex flex-wrap gap-1">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded"
                      >
                        {displayNameForRole(r)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1 mb-6">
        {deploySteps.map((step, idx) => {
          const status = stepStatuses[idx];
          return (
            <div
              key={step.component + step.action}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                status === 'running'
                  ? 'bg-sky-50 border border-sky-100'
                  : status === 'failed'
                    ? 'bg-red-50 border border-red-100'
                    : status === 'succeeded'
                      ? 'bg-emerald-50/50 border border-emerald-100'
                      : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {stepIcon(status)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                <p className="text-xs text-gray-500">
                  {step.component}/{step.action}
                </p>
              </div>
              {status === 'running' && (
                <button
                  onClick={() => setShowMonitor(true)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  View Output
                </button>
              )}
              {status === 'failed' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMonitor(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    View Output
                  </button>
                  <button
                    onClick={retryFailed}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw size={11} />
                    Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!deployStarted && (
        <button
          onClick={startDeployment}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Play size={16} />
          Start Deployment
        </button>
      )}

      {deployComplete && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Deployment Complete</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              All components have been installed successfully.
            </p>
          </div>
          <button
            onClick={() => onDeployComplete?.()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Go to Dashboard
            <ExternalLink size={14} />
          </button>
        </div>
      )}

      <TaskMonitorModal
        open={showMonitor}
        onClose={() => setShowMonitor(false)}
        task={task}
        error={taskError}
        label={monitorLabel}
      />
    </div>
  );
}
