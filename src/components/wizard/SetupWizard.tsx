import { useCallback, useMemo } from 'react';
import Stepper, { type StepDef } from './Stepper';
import WizardNav from './WizardNav';
import NodeSelection from '../steps/NodeSelection';
import PreflightChecks from '../steps/PreflightChecks';
import RoleAssignment from '../steps/RoleAssignment';
import Deployment from '../steps/Deployment';
import { useWizardState } from '../../hooks/useWizardState';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import AlertBanner from '../shared/AlertBanner';

const STEPS: StepDef[] = [
  { label: 'Nodes', description: 'Select hosts' },
  { label: 'Preflight', description: 'Check readiness' },
  { label: 'Roles', description: 'Assign roles' },
  { label: 'Deploy', description: 'Install stack' },
];

export default function SetupWizard() {
  const health = useHealthCheck();
  const { data, update, setStep } = useWizardState();
  const { currentStep } = data;

  const includedNodes = useMemo(() => {
    const excl = new Set(data.excludedNodeIds);
    return data.nodes.filter((n) => !excl.has(n.id));
  }, [data.nodes, data.excludedNodeIds]);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 0:
        return includedNodes.length > 0;
      case 1:
        return data.preflightPassed;
      case 2:
        return true;
      case 3:
        return false;
      default:
        return false;
    }
  }, [currentStep, includedNodes, data.preflightPassed]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setStep(currentStep - 1);
  }, [currentStep, setStep]);

  const handleContinue = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1);
    }
  }, [currentStep, setStep]);

  const continueLabel = useMemo(() => {
    if (currentStep === 2) {
      const allRoles = includedNodes.flatMap((n) => data.roleAssignments[n.id] ?? []);
      if (allRoles.length === 0) return 'Skip to Dashboard';
      return 'Deploy';
    }
    return undefined;
  }, [currentStep, data.roleAssignments, includedNodes]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <NodeSelection data={data} update={update} />;
      case 1:
        return <PreflightChecks data={data} update={update} />;
      case 2:
        return <RoleAssignment data={data} update={update} />;
      case 3:
        return <Deployment data={data} update={update} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
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
        <Stepper steps={STEPS} currentStep={currentStep} />
        <div className="flex-1 px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[480px]">
            <div className="flex-1 p-6 sm:p-8">{renderStep()}</div>
            {currentStep < 3 && (
              <WizardNav
                currentStep={currentStep}
                totalSteps={STEPS.length}
                canContinue={canContinue}
                onBack={handleBack}
                onContinue={handleContinue}
                continueLabel={continueLabel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
