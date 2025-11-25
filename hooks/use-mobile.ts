'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * Uses Tailwind's breakpoint: mobile < 640px (sm)
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the current viewport is tablet-sized
 * Uses Tailwind's breakpoint: tablet 640px - 1024px (sm-md)
 */
export function useTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 640 && width < 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);

    return () => {
      window.removeEventListener('resize', checkTablet);
    };
  }, []);

  return isTablet;
}

