'use client';

import { useTour } from '@/hooks/use-tour';
import { TourSpotlight } from './tour-spotlight';
import { TourWizard } from './tour-wizard';
import { useEffect, useState } from 'react';

export function AppTour() {
  const { isActive, currentStepData, isNavigating, screenReady } = useTour();
  const [elementFound, setElementFound] = useState(false);

  // Reset element found state when step changes
  useEffect(() => {
    setElementFound(false);
  }, [currentStepData?.id]);

  // Only show spotlight when screen is ready and not navigating (mobile-friendly)
  const shouldShowSpotlight = isActive && !isNavigating && screenReady && !!currentStepData?.highlight;

  return (
    <>
      <TourSpotlight
        targetSelector={currentStepData?.highlight}
        isActive={shouldShowSpotlight}
        position={currentStepData?.position}
        onElementFound={(element) => {
          setElementFound(!!element);
        }}
      />
      <TourWizard />
    </>
  );
}


