'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Provider } from '@/types/provider-mix';
import { MarketBenchmarks } from '@/types';

interface StepGuideProps {
  specialty: string;
  providers: Provider[];
  marketBenchmarks: MarketBenchmarks;
  onStepClick?: (index: number) => void;
}

export function ProviderMixStepGuide({
  specialty,
  providers,
  marketBenchmarks,
  onStepClick,
}: StepGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Determine which steps are completed
  const steps = useMemo(() => {
    const step1Complete = 
      specialty !== '' && 
      Object.keys(marketBenchmarks).length > 0;

    const validProviders = providers.filter(p => 
      p.name && 
      p.clinicalFTE > 0 && 
      p.basePay > 0 &&
      (p.cfModel.modelType === 'single' 
        ? (p.cfModel.parameters as { cf: number })?.cf > 0
        : p.cfModel.modelType !== 'single')
    );
    const step2Complete = validProviders.length > 0;

    const step3Complete = step2Complete && step1Complete;

    return [
      {
        id: 'step1',
        label: 'Set Context',
        description: 'Enter specialty, base pay, and CF model',
        completed: step1Complete,
        current: !step1Complete,
      },
      {
        id: 'step2',
        label: 'Add Providers',
        description: 'Configure provider details and FTE',
        completed: step2Complete,
        current: step1Complete && !step2Complete,
      },
      {
        id: 'step3',
        label: 'Review Analysis',
        description: 'View results and risk flags',
        completed: step3Complete,
        current: step2Complete && step1Complete && !step3Complete,
      },
      {
        id: 'step4',
        label: 'Export Profiles',
        description: 'Generate documentation',
        completed: step3Complete,
        current: step3Complete,
      },
    ];
  }, [specialty, providers, marketBenchmarks]);

  const completedCount = steps.filter(s => s.completed).length;
  const stepElementIds = ['setup-tab', 'providers-tab', 'analysis-tab', 'export-tab'];

  const handleStepClick = (index: number) => {
    // Add visual feedback
    const elementId = stepElementIds[index];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => {
          element.classList.remove('animate-pulse');
        }, 1000);
      }
    }
    
    if (onStepClick) {
      onStepClick(index);
    } else {
      // Fallback to original behavior
      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-sm">
      <CardContent className="p-3 sm:p-4">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-3 sm:mb-4 touch-manipulation"
        >
          <div className="text-left">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-0.5 tracking-tight">
              Quick Start Guide
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {completedCount} of {steps.length} steps completed
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2" />
          )}
        </button>

        {/* Compact Progress Bar (when collapsed) */}
        {!isExpanded && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span className="font-medium">{Math.round((completedCount / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {steps.map((step, index) => {
                const isCompleted = step.completed;
                const isCurrent = step.current;
                return (
                  <button
                    key={step.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(index);
                    }}
                    className={cn(
                      'flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation',
                      'min-h-[44px]',
                      isCurrent
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : isCompleted
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        : 'bg-transparent text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                    )}
                    <span className="truncate">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Step Indicator with Labels (when expanded) */}
        {isExpanded && (
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
                    {isCurrent && (
                      <div className="mb-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Current
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      'text-xs sm:text-sm transition-colors duration-200 leading-tight font-medium',
                      isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connecting line segments */}
          {/* Segment 1: Between circle 1 and circle 2 */}
          <div 
            className="absolute h-0.5"
            style={{
              top: '16px',
              left: 'calc(12.5% + 16px)',
              width: 'calc(25% - 32px)',
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
              top: '16px',
              left: 'calc(37.5% + 16px)',
              width: 'calc(25% - 32px)',
            }}
          >
            <div className="absolute inset-0 h-full bg-gray-200 dark:bg-gray-700 opacity-30 rounded-full" />
            {completedCount >= 2 && (
              <div 
                className="absolute inset-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              />
            )}
          </div>

          {/* Segment 3: Between circle 3 and circle 4 */}
          <div 
            className="absolute h-0.5"
            style={{
              top: '16px',
              left: 'calc(62.5% + 16px)',
              width: 'calc(25% - 32px)',
            }}
          >
            <div className="absolute inset-0 h-full bg-gray-200 dark:bg-gray-700 opacity-30 rounded-full" />
            {completedCount >= 3 && (
              <div 
                className="absolute inset-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
              />
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

