'use client';

import { useTour } from '@/hooks/use-tour';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getTourIcon } from '@/lib/tour/tour-steps';
import { motion, AnimatePresence } from 'framer-motion';

export function TourWizard() {
  const {
    isActive,
    currentStep,
    steps,
    currentStepData,
    progress,
    nextStep,
    previousStep,
    stopTour,
    pauseTour,
    resumeTour,
  } = useTour();

  if (!isActive || !currentStepData) {
    return null;
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const Icon = getTourIcon(currentStepData.icon);

  // Calculate position for wizard card
  const getCardPosition = () => {
    if (currentStepData.position === 'center') {
      return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
    if (currentStepData.position === 'top') {
      return 'fixed top-4 left-1/2 -translate-x-1/2';
    }
    if (currentStepData.position === 'bottom') {
      return 'fixed bottom-4 left-1/2 -translate-x-1/2';
    }
    if (currentStepData.position === 'left') {
      return 'fixed top-1/2 left-4 -translate-y-1/2';
    }
    if (currentStepData.position === 'right') {
      return 'fixed top-1/2 right-4 -translate-y-1/2';
    }
    return 'fixed bottom-4 left-1/2 -translate-x-1/2';
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            getCardPosition(),
            'z-[9999] w-[90vw] max-w-lg pointer-events-auto'
          )}
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {currentStepData.title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                onClick={stopTour}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={isFirstStep}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1"
              >
                {isLastStep ? 'Complete Tour' : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Skip link */}
            <div className="text-center mt-4">
              <button
                onClick={stopTour}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Skip tour
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

