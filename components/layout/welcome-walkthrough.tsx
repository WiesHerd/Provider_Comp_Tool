'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles, Calculator, TrendingUp, Phone, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { parseDescription } from '@/lib/utils/text-parser';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'step1',
    title: 'Welcome to CompLens™',
    description: 'CompLens is your comprehensive tool for provider compensation modeling and FMV (Fair Market Value) analysis. Whether you\'re planning compensation structures, analyzing market benchmarks, or modeling call pay scenarios, CompLens helps you make informed decisions.',
    icon: <Sparkles className="w-6 h-6 text-primary" />,
  },
  {
    id: 'step2',
    title: 'Powerful Tools',
    description: 'CompLens offers comprehensive compensation modeling tools:\n\n• **CF Modelling**: Model conversion factors and productivity levels. Enter market data, select a CF model, and see how wRVU percentiles align with TCC percentiles.\n\n• **FMV Calculator**: Perform fast FMV reasonableness checks and percentile analysis across TCC, wRVU, and Conversion Factor metrics.\n\n• **Provider Comparison**: Quickly compare providers side-by-side with different pay, CF models, and productivity levels to see how they calculate incentives and total cash compensation.\n\n• **Call Pay Modeler**: Model call-pay structures with per-call, per-shift, or tiered payment methods and see annualized outputs.\n\n• **wRVU Forecaster**: Forecast annual wRVUs and compensation based on your schedule and patient load.',
    icon: <Calculator className="w-6 h-6 text-primary" />,
  },
  {
    id: 'step3',
    title: 'Easy Navigation',
    description: 'Navigate between tools using the bottom navigation tabs (mobile). Click the logo in the header to return to home, or use the back button to go back in history. You can access your saved Scenarios anytime. Each tool is designed to be intuitive and mobile-friendly.',
    icon: <Navigation className="w-6 h-6 text-primary" />,
  },
  {
    id: 'step4',
    title: 'Getting Started',
    description: 'Choose the tool that matches your needs:\n\n• Use **CF Modelling** to model conversion factors and see how productivity aligns with compensation\n• Use **FMV Calculator** to check if compensation is within market benchmarks\n• Use **Provider Comparison** to quickly compare different providers side-by-side\n• Try **Call Pay Modeler** to structure call coverage payments\n• Use **wRVU Forecaster** to forecast annual wRVUs based on your schedule\n\nYou can save scenarios and compare multiple options as you work.',
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
  },
  {
    id: 'step5',
    title: 'Ready to Start',
    description: 'Click on any of the feature cards below to begin, or use the navigation tabs to explore. All your work is saved automatically in your browser. Let\'s get started!',
    icon: <Phone className="w-6 h-6 text-primary" />,
  },
];

interface WelcomeWalkthroughProps {
  onComplete?: () => void;
  openOnDemand?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeWalkthrough({ onComplete, openOnDemand, onOpenChange }: WelcomeWalkthroughProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Handle on-demand opening
  useEffect(() => {
    if (openOnDemand !== undefined) {
      setIsOpen(openOnDemand);
    }
  }, [openOnDemand]);

  // Handle controlled open state
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    // Check if user has seen walkthrough before
    if (typeof window === 'undefined') return;
    
    // Don't auto-show if it's being controlled externally
    if (openOnDemand !== undefined) return;
    
    const seen = localStorage.getItem('complens-welcome-seen');
    if (!seen) {
      // Show walkthrough after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [openOnDemand]);

  // Listen for custom event to show walkthrough on-demand
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleShowWalkthrough = () => {
      setIsOpen(true);
      setCurrentStep(0); // Reset to first step
    };

    window.addEventListener('complens:show-walkthrough', handleShowWalkthrough);
    return () => {
      window.removeEventListener('complens:show-walkthrough', handleShowWalkthrough);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    handleOpenChange(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('complens-welcome-seen', 'true');
    }
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === WALKTHROUGH_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Always render the dialog so it can be triggered on-demand
  // Only skip rendering if we're not open and it's the initial auto-show (not on-demand)

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleSkip();
      } else {
        handleOpenChange(open);
      }
    }}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in"
          onClick={handleSkip}
        />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-[calc(100vw-2rem)] max-h-[min(calc(100vh-6rem),600px)] md:max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleSkip();
          }}
          onEscapeKeyDown={handleSkip}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {currentStepData.icon || <Sparkles className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold flex items-baseline">
                  <span>Welcome to </span><span className="text-gray-900 dark:text-white">Comp</span><span className="text-purple-600 dark:text-purple-200">Lens</span><sup className="text-xs font-normal text-gray-900 dark:text-white opacity-90 ml-0.5">™</sup>
                </Dialog.Title>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Step {currentStep + 1} of {WALKTHROUGH_STEPS.length}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSkip();
                }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Step Content */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">
              {currentStep === 0 ? (
                <>
                  <span>Welcome to </span><span className="text-gray-900 dark:text-white">Comp</span><span className="text-purple-600 dark:text-purple-200">Lens</span><sup className="text-xs font-normal text-gray-900 dark:text-white opacity-90 ml-0.5">™</sup>
                </>
              ) : (
                <span className="text-gray-900 dark:text-white">{currentStepData.title}</span>
              )}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
              {parseDescription(currentStepData.description)}
            </div>
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

          {/* Disclaimer */}
          {isLastStep && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
                <strong className="text-gray-700 dark:text-gray-300">Note:</strong> For planning and analysis purposes only. Not a substitute for formal FMV opinions, legal review, or regulatory compliance verification.
              </p>
            </div>
          )}

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSkip();
              }}
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

