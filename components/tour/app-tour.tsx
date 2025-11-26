'use client';

import { useTour } from '@/hooks/use-tour';
import { TourSpotlight } from './tour-spotlight';
import { TourWizard } from './tour-wizard';

export function AppTour() {
  const { isActive, currentStepData, isNavigating, screenReady } = useTour();

  // Only show spotlight when screen is ready and not navigating (mobile-friendly)
  const shouldShowSpotlight = isActive && !isNavigating && screenReady && !!currentStepData?.highlight;

  return (
    <>
      <TourSpotlight
        targetSelector={currentStepData?.highlight}
        isActive={shouldShowSpotlight}
        position={currentStepData?.position}
      />
      <TourWizard />
    </>
  );
}


