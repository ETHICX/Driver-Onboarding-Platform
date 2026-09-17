import React from 'react';
import { Check, Circle } from 'lucide-react';

export type OnboardingStepId = 'personal' | 'identity' | 'vehicle' | 'documents' | 'review';

interface StepDef {
  id: OnboardingStepId;
  label: string;
  shortDesc: string;
}

const STEPS: StepDef[] = [
  { id: 'personal', label: 'Personal', shortDesc: 'Contact & Address' },
  { id: 'identity', label: 'Identity', shortDesc: 'ID & Licence' },
  { id: 'vehicle', label: 'Vehicle', shortDesc: 'Type & Specs' },
  { id: 'documents', label: 'Documents', shortDesc: 'Uploads & Files' },
  { id: 'review', label: 'Review', shortDesc: 'Final Submission' },
];

interface ProgressIndicatorProps {
  currentStep: OnboardingStepId;
  completedSteps?: OnboardingStepId[];
  onSelectStep?: (step: OnboardingStepId) => void;
  onStepClick?: (step: OnboardingStepId) => void;
  canNavigateForward?: boolean;
  hasProfile?: boolean;
  hasIdentity?: boolean;
  hasVehicle?: boolean;
  hasDocuments?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  completedSteps = [],
  onSelectStep,
  onStepClick,
  hasProfile,
  hasIdentity,
  hasVehicle,
  hasDocuments
}) => {
  const handleSelect = onSelectStep || onStepClick || (() => {});
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  // Derive completed steps if explicit boolean flags are provided or fallback to completedSteps array
  const effectiveCompletedSteps: OnboardingStepId[] = React.useMemo(() => {
    if (hasProfile !== undefined || hasIdentity !== undefined || hasVehicle !== undefined || hasDocuments !== undefined) {
      const list: OnboardingStepId[] = [];
      if (hasProfile) list.push('personal');
      if (hasIdentity) list.push('identity');
      if (hasVehicle) list.push('vehicle');
      if (hasDocuments) list.push('documents');
      return list;
    }
    return Array.isArray(completedSteps) ? completedSteps : [];
  }, [completedSteps, hasProfile, hasIdentity, hasVehicle, hasDocuments]);

  return (
    <nav aria-label="Progress" className="w-full bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs mb-8">
      <ol className="grid grid-cols-5 gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = effectiveCompletedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const canClick = isCompleted || isPast || isCurrent;

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                onClick={() => canClick && handleSelect(step.id)}
                disabled={!canClick}
                className={`w-full flex flex-col items-center sm:items-start text-left group transition-all duration-150 ${
                  canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Step indicator circle / pill */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-slate-900 text-white ring-2 ring-emerald-500 ring-offset-2'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-mono font-medium text-slate-400">
                    Step 0{index + 1}
                  </span>
                </div>

                {/* Step Label */}
                <span
                  className={`text-xs sm:text-sm font-semibold truncate w-full ${
                    isCurrent
                      ? 'text-slate-900'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>

                <span className="hidden sm:block text-[11px] text-slate-500 truncate w-full">
                  {step.shortDesc}
                </span>
              </button>

              {/* Connector line between steps */}
              {index < STEPS.length - 1 && (
                <div 
                  className={`hidden sm:block absolute top-4 left-[calc(50%+18px)] w-[calc(100%-36px)] h-0.5 -z-0 pointer-events-none ${
                    index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} 
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
