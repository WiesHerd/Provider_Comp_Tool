'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  highlight?: string; // Element to highlight
  image?: string; // Optional illustration
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'step1',
    title: 'Step 1: Set Your Context',
    description: 'Start by entering your specialty, number of providers on call, and rotation ratio. This helps us calculate how call coverage is distributed among your team.',
    highlight: 'context-card',
  },
  {
    id: 'step2',
    title: 'Step 2: Configure Call Tiers',
    description: 'For each tier (C1-C5), enable it and enter:\n\n• Coverage type (In-house, home call, etc.)\n• Payment method (Daily rate, stipend, etc.)\n• Rates for weekday, weekend, and holidays\n• Call burden (total calls/shifts needed per month)',
    highlight: 'tier-card',
  },
  {
    id: 'step3',
    title: 'Step 3: Review Your Budget',
    description: 'Your annual call pay budget is calculated automatically as you enter values. You can also set a target budget to track spending and see if you\'re over or under budget.',
    highlight: 'impact-summary',
  },
];

interface WelcomeWalkthroughProps {
  onComplete?: () => void;
  onNavigateToStep?: (stepIndex: number, elementId: string) => void;
}

export function WelcomeWalkthrough({ onComplete, onNavigateToStep }: WelcomeWalkthroughProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);

  useEffect(() => {
    // Check if user has seen walkthrough before
    const seen = localStorage.getItem('call-pay-walkthrough-seen');
    if (!seen) {
      // Show walkthrough after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHasSeenWalkthrough(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Navigate to the highlighted section for the next step
      const nextStepData = WALKTHROUGH_STEPS[nextStep];
      if (nextStepData.highlight && onNavigateToStep) {
        onNavigateToStep(nextStep, nextStepData.highlight);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Navigate to the highlighted section for the previous step
      const prevStepData = WALKTHROUGH_STEPS[prevStep];
      if (prevStepData.highlight && onNavigateToStep) {
        onNavigateToStep(prevStep, prevStepData.highlight);
      }
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem('call-pay-walkthrough-seen', 'true');
    // Navigate to first step on completion
    const firstStepData = WALKTHROUGH_STEPS[0];
    if (firstStepData.highlight && onNavigateToStep) {
      setTimeout(() => {
        onNavigateToStep(0, firstStepData.highlight!);
      }, 300);
    }
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === WALKTHROUGH_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  if (hasSeenWalkthrough && !isOpen) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] md:max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                  Welcome to Call Pay Modeler
                </Dialog.Title>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Step {currentStep + 1} of {WALKTHROUGH_STEPS.length}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Step Content */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {WALKTHROUGH_STEPS.map((_, index) => (
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
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip walkthrough
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


