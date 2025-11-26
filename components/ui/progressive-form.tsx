'use client';

import { useState, ReactNode, createContext, useContext } from 'react';
import { Button } from './button';
import { ChevronLeft } from 'lucide-react';
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
  validateStep: _validateStep,
  allowStepJump = true,
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
  disabled?: boolean;
  className?: string;
}

export function ProgressiveFormNavigation({
  onNext,
  onPrevious,
  nextLabel = 'Continue',
  previousLabel = 'Back',
  showPrevious = true,
  disabled = false,
  className,
}: ProgressiveFormNavigationProps) {
  const { currentStep, totalSteps, nextStep, previousStep } = useProgressiveForm();

  const handleNext = () => {
    if (disabled) return;
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
        'pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {showPrevious && currentStep > 1 && (
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="w-auto max-w-[280px] mx-auto sm:flex-initial sm:min-w-[120px] sm:mx-0"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {previousLabel}
        </Button>
      )}
      <Button
        onClick={handleNext}
        disabled={disabled}
        className={cn(
          'w-auto max-w-[280px] mx-auto sm:flex-initial sm:ml-auto sm:max-w-none',
          isLastStep && 'sm:min-w-[140px]',
          !isLastStep && 'sm:min-w-[140px]'
        )}
      >
        {isLastStep ? 'Complete' : nextLabel}
      </Button>
    </div>
  );
}

