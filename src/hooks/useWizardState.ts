import { useState, useCallback } from 'react';
import type { ManagedNode, CheckResult, ConfigDefaultApplied } from '../types/api';

export interface WizardData {
  currentStep: number;
  nodes: ManagedNode[];
  nodeVerification: Record<string, 'pending' | 'verified' | 'failed'>;
  excludedNodeIds: string[];
  preflightResults: CheckResult[];
  preflightPassed: boolean;
  roleAssignments: Record<string, string[]>;
  onrampConfig: Record<string, unknown> | null;
  configDefaultsApplied: ConfigDefaultApplied[];
  configDefaultsErrors: string[];
  defaultsLoading: boolean;
  deploymentStarted: boolean;
}

function defaultState(initialStep: number): WizardData {
  return {
    currentStep: initialStep,
    nodes: [],
    nodeVerification: {},
    excludedNodeIds: [],
    preflightResults: [],
    preflightPassed: false,
    roleAssignments: {},
    onrampConfig: null,
    configDefaultsApplied: [],
    configDefaultsErrors: [],
    defaultsLoading: false,
    deploymentStarted: false,
  };
}

export function useWizardState(initialStep = 0) {
  const [data, setData] = useState<WizardData>(() => defaultState(initialStep));

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const setStep = useCallback((step: number) => {
    setData((prev) => ({ ...prev, currentStep: step }));
  }, []);

  return { data, update, setStep };
}
