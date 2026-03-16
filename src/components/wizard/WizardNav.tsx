import { ChevronLeft, ChevronRight, Rocket, SkipForward } from 'lucide-react';

interface WizardNavProps {
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  loading?: boolean;
  hideContinue?: boolean;
}

export default function WizardNav({
  currentStep,
  totalSteps,
  canContinue,
  onBack,
  onContinue,
  onSkip,
  continueLabel,
  loading,
  hideContinue,
}: WizardNavProps) {
  const isLast = currentStep === totalSteps - 1;
  const label = continueLabel ?? (isLast ? 'Deploy' : 'Continue');

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-8 py-4 bg-white">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        {onSkip && !hideContinue && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <SkipForward size={16} />
            Skip Setup
          </button>
        )}
      </div>
      {!hideContinue && (
        <button
          onClick={onContinue}
          disabled={!canContinue || loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-intel-600 rounded-lg hover:bg-intel-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isLast ? (
            <Rocket size={16} />
          ) : null}
          {label}
          {!isLast && !loading && <ChevronRight size={16} />}
        </button>
      )}
    </div>
  );
}
