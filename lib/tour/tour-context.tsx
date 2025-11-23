'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface TourStep {
  id: string;
  screen: string; // Route path
  title: string;
  description: string;
  highlight?: string; // CSS selector or element ID
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string; // Icon name from lucide-react
  action?: 'navigate' | 'scroll' | 'highlight';
  waitForElement?: boolean; // Wait for element to appear
  scrollOffset?: number; // Offset for scrolling
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  stopTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  currentStepData: TourStep | null;
  progress: number; // 0-100
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const STORAGE_KEY = 'complens-tour-progress';

export function TourProvider({ 
  children, 
  steps 
}: { 
  children: React.ReactNode; 
  steps: TourStep[];
}) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load saved progress
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { step, active } = JSON.parse(saved);
          if (active && step < steps.length) {
            setCurrentStep(step);
            setIsActive(true);
          }
        } catch (e) {
          // Invalid saved data, ignore
        }
      }
    }
  }, [steps.length]);

  // Save progress
  useEffect(() => {
    if (typeof window !== 'undefined' && isActive) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step: currentStep,
        active: isActive && !isPaused,
      }));
    }
  }, [currentStep, isActive, isPaused]);

  // Navigate to step's screen if needed
  useEffect(() => {
    if (isActive && !isPaused && steps[currentStep]) {
      const step = steps[currentStep];
      // Wait a bit for page to load before navigating
      const timer = setTimeout(() => {
        if (step.screen !== pathname) {
          router.push(step.screen);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, isPaused, currentStep, pathname, router, steps]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setIsPaused(false);
    if (steps[0] && steps[0].screen !== pathname) {
      router.push(steps[0].screen);
    }
  }, [router, pathname, steps]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const pauseTour = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTour = useCallback(() => {
    setIsPaused(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      stopTour();
    }
  }, [currentStep, steps.length, stopTour]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const currentStepData = steps[currentStep] || null;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <TourContext.Provider
      value={{
        isActive: isActive && !isPaused,
        currentStep,
        steps,
        startTour,
        stopTour,
        pauseTour,
        resumeTour,
        nextStep,
        previousStep,
        goToStep,
        currentStepData,
        progress,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

