'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CallPayContext, CallTier } from '@/types/call-pay';

interface StepGuideProps {
  context: CallPayContext;
  tiers: CallTier[];
  currentStep?: number;
}

export function StepGuide({ context, tiers, currentStep }: StepGuideProps) {
  // Determine which steps are completed
  const steps = useMemo(() => {
    const step1Complete = 
      context.specialty !== '' && 
      context.providersOnCall > 0 && 
      context.rotationRatio > 0;

    const enabledTiers = tiers.filter(t => t.enabled);
    const step2Complete = enabledTiers.length > 0 && 
      enabledTiers.some(tier => 
        tier.rates.weekday > 0 && 
        (tier.burden.weekdayCallsPerMonth > 0 || tier.burden.weekendCallsPerMonth > 0)
      );

    return [
      {
        id: 'step1',
        label: 'Set Context',
        description: 'Enter specialty, providers, and rotation ratio',
        completed: step1Complete,
        current: !step1Complete,
      },
      {
        id: 'step2',
        label: 'Configure Tiers',
        description: 'Enable tiers and enter rates & call burden',
        completed: step2Complete,
        current: step1Complete && !step2Complete,
      },
      {
        id: 'step3',
        label: 'Review Budget',
        description: 'Check your annual call pay budget',
        completed: step2Complete,
        current: step2Complete,
      },
    ];
  }, [context, tiers]);

  const completedCount = steps.filter(s => s.completed).length;
  const stepElementIds = ['context-card', 'tier-card', 'impact-summary'];

  const handleStepClick = (index: number) => {
    const elementId = stepElementIds[index];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-sm">
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="mb-3 sm:mb-4 text-center">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-0.5 tracking-tight">
            Quick Start Guide
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>

        {/* Step Indicator with Labels */}
        <div className="relative">
          {/* Steps with labels */}
          <div className="flex items-center justify-between relative pb-2 gap-1 sm:gap-2">
            {steps.map((step, index) => {
              const isCompleted = step.completed;
              const isCurrent = step.current;
              const isPast = index < (completedCount);

              return (
                <div 
                  key={step.id} 
                  className="flex flex-col items-center flex-1 relative z-10 cursor-pointer group touch-manipulation"
                  onClick={() => handleStepClick(index)}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 relative z-20 mb-1.5 sm:mb-2',
                      'border-2 group-hover:scale-110 group-active:scale-95 bg-white dark:bg-gray-900 touch-manipulation',
                      'shadow-sm',
                      isCompleted
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : isCurrent
                        ? 'border-primary text-primary ring-2 ring-primary/20 shadow-sm'
                        : isPast
                        ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Label - Compact */}
                  <div className="text-center px-0.5">
                    <div className={cn(
                      'text-[10px] sm:text-xs transition-colors duration-200 leading-tight font-medium',
                      isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div className="mt-0.5">
                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Current
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connecting line segments - Compact version */}
          {/* Segment 1: Between circle 1 and circle 2 */}
          <div 
            className="absolute h-0.5"
            style={{
              top: '16px', // Center of 32px circle (mobile: 16px, sm: 18px)
              left: 'calc(16.666% + 16px)', // Right edge of circle 1
              width: 'calc(33.333% - 32px)', // Distance to circle 2 minus both radii
            }}
          >
            <div className="absolute inset-0 h-full bg-gray-200 dark:bg-gray-700 opacity-30 rounded-full" />
            {completedCount >= 1 && (
              <div 
                className="absolute inset-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              />
            )}
          </div>

          {/* Segment 2: Between circle 2 and circle 3 */}
          <div 
            className="absolute h-0.5"
            style={{
              top: '16px', // Center of 32px circle
              left: 'calc(50% + 16px)', // Right edge of circle 2
              width: 'calc(33.333% - 32px)', // Distance to circle 3 minus both radii
            }}
          >
            <div className="absolute inset-0 h-full bg-gray-200 dark:bg-gray-700 opacity-30 rounded-full" />
            {completedCount >= 2 && (
              <div 
                className="absolute inset-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

