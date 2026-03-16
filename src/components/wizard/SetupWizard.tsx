import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper, { type StepDef } from './Stepper';
import WizardNav from './WizardNav';
import DeploymentSetup from '../steps/DeploymentSetup';
import NodeSelection from '../steps/NodeSelection';
import PreflightChecks from '../steps/PreflightChecks';
import RoleAssignment from '../steps/RoleAssignment';
import ConfigReview from '../steps/ConfigReview';
import Deployment from '../steps/Deployment';
import { useWizardState } from '../../hooks/useWizardState';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import AlertBanner from '../shared/AlertBanner';
import { syncInventory, executeAction, applyConfigDefaults } from '../../api/onramp';
import { listNodes } from '../../api/nodes';
import { markStepComplete } from '../../api/wizard';
import { getDeployStepsForRoles } from '../../config/deployOrder';

const STEPS: StepDef[] = [
  { label: 'Deployment', description: 'Create deployment' },
  { label: 'Nodes', description: 'Select hosts' },
  { label: 'Preflight', description: 'Check readiness' },
  { label: 'Roles', description: 'Assign roles' },
  { label: 'Config', description: 'Review settings' },
  { label: 'Deploy', description: 'Install stack' },
];

interface SetupWizardProps {
  initialStep?: number;
}

export default function SetupWizard({ initialStep = 0 }: SetupWizardProps) {
  const health = useHealthCheck();
  const navigate = useNavigate();
  const { data, update, setStep } = useWizardState(initialStep);
  const { currentStep } = data;
  const [continueLoading, setContinueLoading] = useState(false);

  useEffect(() => {
    if (initialStep > 0 && data.nodes.length === 0) {
      listNodes()
        .then((nodes) => {
          const nodeList = nodes ?? [];
          const roleAssignments: Record<string, string[]> = {};
          nodeList.forEach((n) => {
            if (n.roles && n.roles.length > 0) {
              roleAssignments[n.id] = n.roles;
            }
          });
          const verification: Record<string, 'pending' | 'verified' | 'failed'> = {};
          nodeList.forEach((n) => {
            verification[n.id] = 'pending';
          });
          update({ nodes: nodeList, nodeVerification: verification, roleAssignments });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const includedNodes = useMemo(() => {
    const excl = new Set(data.excludedNodeIds);
    return data.nodes.filter((n) => !excl.has(n.id));
  }, [data.nodes, data.excludedNodeIds]);

  const allRoles = useMemo(
    () => [...new Set(includedNodes.flatMap((n) => data.roleAssignments[n.id] ?? []))],
    [data.roleAssignments, includedNodes]
  );

  const deploySteps = useMemo(() => getDeployStepsForRoles(allRoles), [allRoles]);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 0:
        return data.deploymentName.trim().length >= 3;
      case 1:
        return includedNodes.length > 0;
      case 2: {
        const allIncludedNodesVerified = includedNodes.length > 0 &&
          includedNodes.every((n) => data.nodeVerification[n.id] === 'verified');
        return data.preflightPassed && allIncludedNodesVerified;
      }
      case 3:
        return true;
      case 4:
        return !data.defaultsLoading;
      case 5:
        return false;
      default:
        return false;
    }
  }, [currentStep, includedNodes, data.preflightPassed, data.defaultsLoading, data.nodeVerification, data.deploymentName]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (!data.deploymentStarted) setStep(step);
    },
    [data.deploymentStarted, setStep]
  );

  const handleBack = useCallback(() => {
    if (data.deploymentStarted) return;
    if (currentStep > 0) setStep(currentStep - 1);
  }, [currentStep, data.deploymentStarted, setStep]);

  const handleContinue = useCallback(async () => {
    if (currentStep >= STEPS.length - 1) return;
    setContinueLoading(true);
    try {
      if (currentStep === 0) {
        await markStepComplete('deployment');
      } else if (currentStep === 1) {
        try { await syncInventory(); } catch { /* continue anyway */ }
        await markStepComplete('nodes');
      } else if (currentStep === 2) {
        await markStepComplete('preflight');
      } else if (currentStep === 3) {
        await markStepComplete('roles');
      } else if (currentStep === 4) {
        await markStepComplete('config');
      }
    } catch {
      // proceed even if marking fails
    } finally {
      setContinueLoading(false);
    }

    setStep(currentStep + 1);

    if (currentStep === 3) {
      update({ defaultsLoading: true, configDefaultsErrors: [], configDefaultsApplied: [] });
      applyConfigDefaults()
        .then((result) => {
          update({
            onrampConfig: result.config,
            configDefaultsApplied: result.applied ?? [],
            configDefaultsErrors: result.errors ?? [],
            defaultsLoading: false,
          });
        })
        .catch((err) => {
          update({
            configDefaultsErrors: [
              err instanceof Error ? err.message : 'Failed to compute config defaults',
            ],
            defaultsLoading: false,
          });
        });
    }
  }, [currentStep, setStep, update]);

  const handleStartDeploy = useCallback(async () => {
    update({ deploymentStarted: true });

    try { await syncInventory(); } catch { /* best effort */ }

    if (deploySteps.length > 0) {
      const firstStep = deploySteps[0];
      try {
        await executeAction(firstStep.component, firstStep.action);
      } catch {
        // banner will detect and handle
      }
    }

    try { await markStepComplete('deployment'); } catch { /* best effort */ }

    navigate('/dashboard', { replace: true });
  }, [deploySteps, navigate, update]);

  const handleSkipSetup = useCallback(async () => {
    try {
      await markStepComplete('deployment');
      await markStepComplete('nodes');
      await markStepComplete('preflight');
      await markStepComplete('roles');
      await markStepComplete('config');
      await markStepComplete('deployment');
    } catch {
      // proceed even if marking fails
    }
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <DeploymentSetup data={data} update={update} />;
      case 1:
        return <NodeSelection data={data} update={update} />;
      case 2:
        return <PreflightChecks data={data} update={update} />;
      case 3:
        return <RoleAssignment data={data} update={update} />;
      case 4:
        return <ConfigReview data={data} update={update} />;
      case 5:
        return <Deployment data={data} deploySteps={deploySteps} onStartDeploy={handleStartDeploy} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-intel-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Aether WebUI</h1>
              <p className="text-xs text-gray-500">Initial Setup</p>
            </div>
          </div>
        </div>
      </header>

      <AlertBanner health={health} />

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />
        <div className="flex-1 px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[480px]">
            <div className="flex-1 p-6 sm:p-8">{renderStep()}</div>
            <WizardNav
              currentStep={currentStep}
              totalSteps={STEPS.length}
              canContinue={canContinue}
              onBack={handleBack}
              onContinue={handleContinue}
              onSkip={handleSkipSetup}
              loading={continueLoading}
              hideContinue={currentStep === STEPS.length - 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
