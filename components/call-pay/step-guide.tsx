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
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">
            Quick Start Guide
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>

        {/* Step Indicator with Labels */}
        <div className="relative">
          {/* Steps with labels */}
          <div className="flex items-end justify-between relative pb-6 md:pb-8 gap-2 md:gap-0">
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
                  {/* Step Label */}
                  <div className="mb-3 md:mb-4 text-center min-h-[60px] md:min-h-[70px] flex flex-col justify-end px-1">
                    <div className={cn(
                      'text-xs md:text-sm font-semibold mb-1 transition-colors duration-200',
                      isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      Step {index + 1}
                    </div>
                    <div className={cn(
                      'text-xs md:text-sm transition-colors duration-200 leading-tight',
                      isCompleted || isCurrent
                        ? 'text-gray-700 dark:text-gray-300 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.label}
                    </div>
                    {isCurrent ? (
                      <div className="mt-2 h-5 md:h-6">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium shadow-sm">
                          Current
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 h-5 md:h-6" />
                    )}
                  </div>

                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm md:text-base font-semibold transition-all duration-300 relative z-20',
                      'border-2 group-hover:scale-110 group-active:scale-95 bg-white dark:bg-gray-900 touch-manipulation',
                      'shadow-sm',
                      isCompleted
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                        : isCurrent
                        ? 'border-primary text-primary ring-4 ring-primary/20 shadow-md'
                        : isPast
                        ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connecting line segments - positioned at center of circles, connecting edges only */}
          {/* Line segments connect from right edge of one circle to left edge of next */}
          
          {/* Mobile: 48px circles (24px radius), line at center */}
          {/* Segment 1: Between circle 1 and circle 2 */}
          <div 
            className="absolute h-0.5 md:hidden"
            style={{
              bottom: '26px', // Center of 48px circle on mobile (adjusted for visual center)
              left: 'calc(16.666% + 24px)', // Right edge of circle 1 (center + radius)
              width: 'calc(33.333% - 48px)', // Distance to circle 2 minus both radii
            }}
          >
            {/* Base line with subtle gradient */}
            <div className="absolute inset-0 h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 opacity-40 rounded-full" />
            {/* Progress line - show if step 1 is completed */}
            {completedCount >= 1 && (
              <div 
                className="absolute inset-0 h-full transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ 
                  background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)) / 0.9)'
                }}
              />
            )}
          </div>

          {/* Segment 2: Between circle 2 and circle 3 */}
          <div 
            className="absolute h-0.5 md:hidden"
            style={{
              bottom: '26px', // Center of 48px circle on mobile (adjusted for visual center)
              left: 'calc(50% + 24px)', // Right edge of circle 2 (center + radius)
              width: 'calc(33.333% - 48px)', // Distance to circle 3 minus both radii
            }}
          >
            {/* Base line with subtle gradient */}
            <div className="absolute inset-0 h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 opacity-40 rounded-full" />
            {/* Progress line - show if step 2 is completed */}
            {completedCount >= 2 && (
              <div 
                className="absolute inset-0 h-full transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ 
                  background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)) / 0.9)'
                }}
              />
            )}
          </div>

          {/* Desktop: 56px circles (28px radius), line at center */}
          {/* Segment 1: Between circle 1 and circle 2 */}
          <div 
            className="hidden md:block absolute h-1"
            style={{
              bottom: '30px', // Center of 56px circle on desktop (adjusted for visual center)
              left: 'calc(16.666% + 28px)', // Right edge of circle 1 (center + radius)
              width: 'calc(33.333% - 56px)', // Distance to circle 2 minus both radii
            }}
          >
            {/* Base line with subtle gradient */}
            <div className="absolute inset-0 h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 opacity-40 rounded-full" />
            {/* Progress line - show if step 1 is completed */}
            {completedCount >= 1 && (
              <div 
                className="absolute inset-0 h-full transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ 
                  background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)) / 0.9)'
                }}
              />
            )}
          </div>

          {/* Segment 2: Between circle 2 and circle 3 */}
          <div 
            className="hidden md:block absolute h-1"
            style={{
              bottom: '30px', // Center of 56px circle on desktop (adjusted for visual center)
              left: 'calc(50% + 28px)', // Right edge of circle 2 (center + radius)
              width: 'calc(33.333% - 56px)', // Distance to circle 3 minus both radii
            }}
          >
            {/* Base line with subtle gradient */}
            <div className="absolute inset-0 h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 opacity-40 rounded-full" />
            {/* Progress line - show if step 2 is completed */}
            {completedCount >= 2 && (
              <div 
                className="absolute inset-0 h-full transition-all duration-500 ease-out rounded-full shadow-sm"
                style={{ 
                  background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)) / 0.9)'
                }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

