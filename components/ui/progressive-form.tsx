'use client';

import { useState, ReactNode, createContext, useContext } from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProgressiveFormContextType {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  isStepComplete: (step: number) => boolean;
  markStepComplete: (step: number) => void;
  completedSteps: number[];
}

const ProgressiveFormContext = createContext<ProgressiveFormContextType | null>(null);

export function useProgressiveForm() {
  const context = useContext(ProgressiveFormContext);
  if (!context) {
    throw new Error('useProgressiveForm must be used within ProgressiveForm');
  }
  return context;
}

interface ProgressiveFormProps {
  totalSteps: number;
  children: ReactNode;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  validateStep?: (step: number) => boolean;
  allowStepJump?: boolean;
  stepNames?: string[];
  className?: string;
}

export function ProgressiveForm({
  totalSteps,
  children,
  onStepChange,
  onComplete,
  validateStep,
  allowStepJump = true,
  stepNames,
  className,
}: ProgressiveFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const goToStep = (step: number) => {
    if (step < 1 || step > totalSteps) return;
    if (!allowStepJump && step > currentStep + 1) return;
    
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      onStepChange?.(next);
    } else {
      onComplete?.();
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      onStepChange?.(currentStep - 1);
    }
  };

  const isStepComplete = (step: number) => {
    return completedSteps.includes(step);
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => [...new Set([...prev, step])]);
  };

  const canProceed = validateStep ? validateStep(currentStep) : true;

  const contextValue: ProgressiveFormContextType = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    isStepComplete,
    markStepComplete,
    completedSteps,
  };

  // Always allow going back to previous steps, but restrict forward navigation if allowStepJump is false
  const handleStepClick = (step: number) => {
    // Always allow going back to completed steps
    if (step < currentStep) {
      goToStep(step);
    } 
    // Allow forward navigation only if allowStepJump is true
    else if (allowStepJump && step > currentStep) {
      goToStep(step);
    }
    // Allow clicking current step (no-op, but provides feedback)
    else if (step === currentStep) {
      // Already on this step, do nothing but provide visual feedback
    }
  };

  return (
    <ProgressiveFormContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </ProgressiveFormContext.Provider>
  );
}

interface ProgressiveFormStepProps {
  step: number;
  children: ReactNode;
  className?: string;
}

export function ProgressiveFormStep({ step, children, className }: ProgressiveFormStepProps) {
  const { currentStep } = useProgressiveForm();

  if (currentStep !== step) {
    return null;
  }

  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-right-4 duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ProgressiveFormNavigationProps {
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  showPrevious?: boolean;
  className?: string;
}

export function ProgressiveFormNavigation({
  onNext,
  onPrevious,
  nextLabel = 'Continue',
  previousLabel = 'Back',
  showPrevious = true,
  className,
}: ProgressiveFormNavigationProps) {
  const { currentStep, totalSteps, nextStep, previousStep } = useProgressiveForm();

  const handleNext = () => {
    onNext?.();
    nextStep();
  };

  const handlePrevious = () => {
    onPrevious?.();
    previousStep();
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div
      className={cn(
        'flex gap-3 sm:gap-4 mt-8 sm:mt-10',
        'sticky bottom-0',
        'pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800',
        'safe-area-inset-bottom',
        className
      )}
    >
      {showPrevious && currentStep > 1 && (
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex-1 sm:flex-initial sm:min-w-[120px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {previousLabel}
        </Button>
      )}
      <Button
        onClick={handleNext}
        className={cn(
          'flex-1 sm:flex-initial sm:ml-auto',
          isLastStep && 'sm:min-w-[140px]',
          !isLastStep && 'sm:min-w-[140px]'
        )}
      >
        {isLastStep ? 'Complete' : nextLabel}
      </Button>
    </div>
  );
}

