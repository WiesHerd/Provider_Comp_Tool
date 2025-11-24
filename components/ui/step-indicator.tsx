'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
  stepNames?: string[];
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps = [],
  onStepClick,
  stepNames,
  className,
}: StepIndicatorProps) {
  const [pressedStep, setPressedStep] = useState<number | null>(null);
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const getStepStatus = (step: number): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(step) || step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepName = (step: number): string => {
    if (stepNames && stepNames[step - 1]) {
      return stepNames[step - 1];
    }
    return `Step ${step}`;
  };

  const getAbbreviatedName = (name: string): string => {
    // Smart abbreviations for common step names
    const abbreviations: Record<string, string> = {
      'Provider Info': 'Provider',
      'FTE & wRVUs': 'FTE/wRVU',
      'Conversion Factor': 'CF',
      'Work Schedule': 'Schedule',
      'Patient Encounters': 'Encounters',
      'Compensation': 'Comp',
      'Results': 'Results',
    };
    
    if (abbreviations[name]) {
      return abbreviations[name];
    }
    
    // Fallback: take first word or first 8 characters
    const words = name.split(' ');
    if (words.length === 1) return name.length > 10 ? name.substring(0, 8) + '...' : name;
    return words[0].length > 10 ? words[0].substring(0, 8) + '...' : words[0];
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="relative mb-3 sm:mb-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Numbers with Names - Mobile optimized layout */}
      <div className="flex justify-between items-start gap-0.5 sm:gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const status = getStepStatus(step);
          // Completed steps and current step are always clickable if onStepClick is provided
          const isClickable = (status === 'completed' || status === 'current') && onStepClick;
          const stepName = getStepName(step);
          const abbreviatedName = getAbbreviatedName(stepName);
          const isPressed = pressedStep === step;

          return (
            <button
              key={step}
              type="button"
              onClick={() => isClickable && onStepClick?.(step)}
              onTouchStart={() => isClickable && setPressedStep(step)}
              onTouchEnd={() => {
                setPressedStep(null);
                // Small delay to ensure click fires on touch devices
                if (isClickable && onStepClick) {
                  setTimeout(() => onStepClick(step), 50);
                }
              }}
              onMouseDown={() => isClickable && setPressedStep(step)}
              onMouseUp={() => setPressedStep(null)}
              onMouseLeave={() => setPressedStep(null)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1 sm:gap-2 flex-1',
                'min-h-[72px] sm:min-h-[70px] touch-manipulation',
                'transition-all duration-150',
                'px-0.5 sm:px-1',
                isClickable && [
                  'cursor-pointer',
                  'hover:opacity-80',
                  'active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:rounded-lg'
                ],
                !isClickable && 'cursor-default opacity-60',
                isPressed && isClickable && 'scale-90'
              )}
              aria-label={`${stepName} - ${status === 'completed' ? 'Completed, tap to go back' : status === 'current' ? 'Current step' : 'Upcoming'}`}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0',
                  'text-sm font-semibold transition-all duration-200',
                  'border-2 relative shadow-sm',
                  status === 'completed' && [
                    'bg-primary text-white border-primary shadow-md',
                    isClickable && 'hover:bg-primary/90 hover:shadow-lg hover:scale-105'
                  ],
                  status === 'current' && [
                    'bg-primary/10 text-primary border-primary ring-2 ring-primary/20 shadow-md',
                    isClickable && 'hover:bg-primary/20 hover:ring-primary/30 hover:scale-105'
                  ],
                  status === 'upcoming' &&
                    'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-300 dark:border-gray-700',
                  isPressed && isClickable && 'scale-90 ring-4 ring-primary/30'
                )}
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <span className="text-xs sm:text-sm">{step}</span>
                )}
              </div>
              
              {/* Step Label - Mobile: 2 lines if needed, Desktop: single line */}
              <div className="text-center w-full min-h-[32px] sm:min-h-[32px] flex items-start sm:items-center justify-center pt-0.5 sm:pt-0">
                {/* Mobile: Abbreviated name with line breaks */}
                <span className="text-xs sm:hidden font-medium leading-[1.2] text-center block max-w-full">
                  {abbreviatedName.split(' ').map((word, idx, arr) => (
                    <span key={idx}>
                      {word}
                      {idx < arr.length - 1 && ' '}
                    </span>
                  ))}
                </span>
                {/* Desktop: Full name */}
                <span className="hidden sm:block text-xs font-medium leading-tight text-center">
                  {stepName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Text - Current step info */}
      <div className="text-center mt-2 sm:mt-3">
        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
          {stepNames && stepNames[currentStep - 1] && (
            <span className="hidden sm:inline">: {stepNames[currentStep - 1]}</span>
          )}
        </span>
      </div>
    </div>
  );
}
