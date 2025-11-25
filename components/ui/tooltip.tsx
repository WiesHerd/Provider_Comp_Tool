'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ children, content, side = 'top', className }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const delayTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleTouchStart = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleTouchEnd = () => {
    // Keep tooltip open briefly, then close
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 2000); // Show for 2 seconds on mobile
  };

  const handleMouseEnter = () => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    // Add delay before showing tooltip (450ms)
    delayTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 450);
  };

  const handleMouseLeave = () => {
    // Clear delay timeout if tooltip hasn't shown yet
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    // Close tooltip with slight delay for smooth transition
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative inline-block"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isOpen && (
        <div
          className={cn(
            'absolute z-[9999] px-3 py-2 text-sm rounded-lg shadow-xl border',
            'pointer-events-none whitespace-normal max-w-[250px] md:max-w-[350px]',
            'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-3',
            side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
            className
          )}
          role="tooltip"
          style={{ zIndex: 9999 }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 rotate-45 border',
              'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-l-0 border-b-0',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-r-0 border-t-0'
            )}
          />
        </div>
      )}
    </div>
  );
}

