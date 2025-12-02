'use client';

import { motion } from 'framer-motion';
import { useAutoHideSticky } from '@/hooks/use-auto-hide-sticky';
import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface AutoHideStickyProps {
  children: ReactNode;
  className?: string;
  /** Distance from bottom to always show (default: 200px) */
  bottomThreshold?: number;
  /** Scroll distance before hiding starts (default: 50px) */
  hideThreshold?: number;
  /** Only enable on mobile (default: true) */
  mobileOnly?: boolean;
}

/**
 * Auto-hiding sticky container for action buttons
 * Hides when scrolling down, shows when scrolling up
 * Always shows when near bottom of page or at top
 */
export function AutoHideSticky({
  children,
  className,
  bottomThreshold = 200,
  hideThreshold = 50,
  mobileOnly = true,
}: AutoHideStickyProps) {
  const isVisible = useAutoHideSticky({ bottomThreshold, hideThreshold, mobileOnly });

  return (
    <motion.div
      initial={false}
      animate={{
        y: isVisible ? 0 : 100,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={cn('sticky bottom-24 md:static', className)}
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {children}
    </motion.div>
  );
}

