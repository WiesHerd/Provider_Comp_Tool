'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps.length / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isPast = index < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  'border-2',
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                    ? 'bg-primary border-primary text-white ring-4 ring-primary/20'
                    : isPast
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center max-w-[100px]">
                <div
                  className={cn(
                    'text-xs font-semibold',
                    isCurrent || isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



















