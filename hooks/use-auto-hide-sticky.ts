'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for auto-hiding sticky elements (like action buttons)
 * Hides when scrolling down, shows when scrolling up
 * Always shows when near bottom of page or at top
 * 
 * @param options Configuration options
 * @returns Boolean indicating if element should be visible
 */
export function useAutoHideSticky(options: {
  /** Distance from bottom to always show (default: 200px) */
  bottomThreshold?: number;
  /** Scroll distance before hiding starts (default: 50px) */
  hideThreshold?: number;
  /** Only enable on mobile (default: true) */
  mobileOnly?: boolean;
} = {}) {
  const {
    bottomThreshold = 200,
    hideThreshold = 50,
    mobileOnly = true,
  } = options;

  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mobileOnly && !isMobile) {
      setIsVisible(true);
      return;
    }

    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const documentHeight = document.documentElement.scrollHeight;
          const viewportHeight = window.innerHeight;
          const distanceFromBottom = documentHeight - (currentScrollY + viewportHeight);

          // Always show at top of page
          if (currentScrollY === 0) {
            setIsVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Always show when near bottom of page
          if (distanceFromBottom < bottomThreshold) {
            setIsVisible(true);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Hide when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > hideThreshold) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bottomThreshold, hideThreshold, mobileOnly, isMobile]);

  return isVisible;
}

