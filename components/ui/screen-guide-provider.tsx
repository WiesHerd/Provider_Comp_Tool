'use client';

import { usePathname } from 'next/navigation';
import { ScreenGuideModal } from './screen-guide-modal';
import { SCREEN_GUIDES } from '@/lib/screen-guides';

export function ScreenGuideProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine which guide to show based on current path
  const getCurrentGuide = () => {
    if (pathname === '/') {
      return SCREEN_GUIDES.home;
    } else if (pathname === '/wrvu-modeler') {
      return SCREEN_GUIDES.wrvuModeler;
    } else if (pathname === '/fmv-calculator' || pathname.startsWith('/fmv-calculator/')) {
      return SCREEN_GUIDES.fmvCalculator;
    } else if (pathname === '/call-pay-modeler') {
      return SCREEN_GUIDES.callPayModeler;
    } else if (pathname === '/wrvu-forecaster') {
      return SCREEN_GUIDES.wrvuForecaster;
    } else if (pathname === '/scenarios') {
      return SCREEN_GUIDES.scenarios;
    }
    return null;
  };

  const currentGuide = getCurrentGuide();

  return (
    <>
      {children}
      {currentGuide && (
        <ScreenGuideModal
          title={currentGuide.title}
          description={currentGuide.description}
          storageKey={currentGuide.storageKey}
          autoShow={pathname === '/'} // Only auto-show on home page
          delay={600}
        />
      )}
    </>
  );
}

