'use client';

import { useTour } from '@/hooks/use-tour';
import { TourSpotlight } from './tour-spotlight';
import { TourWizard } from './tour-wizard';
import { useEffect, useState } from 'react';

export function AppTour() {
  const { isActive, currentStepData } = useTour();
  const [elementFound, setElementFound] = useState(false);

  // Reset element found state when step changes
  useEffect(() => {
    setElementFound(false);
  }, [currentStepData?.id]);

  return (
    <>
      <TourSpotlight
        targetSelector={currentStepData?.highlight}
        isActive={isActive && !!currentStepData?.highlight}
        position={currentStepData?.position}
        onElementFound={(element) => {
          setElementFound(!!element);
        }}
      />
      <TourWizard />
    </>
  );
}

