'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  disableOnTouch?: boolean;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

type CalculatedPosition = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  x: number;
  y: number;
  arrowX?: number;
  arrowY?: number;
};

const VIEWPORT_PADDING = 8;
const TOOLTIP_OFFSET = 8;

export function Tooltip({ 
  children, 
  content, 
  side = 'top', 
  className, 
  disableOnTouch = false,
  align = 'center',
  sideOffset = TOOLTIP_OFFSET,
  alignOffset = 0,
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [position, setPosition] = React.useState<CalculatedPosition | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isMeasuring, setIsMeasuring] = React.useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const delayTimeoutRef = React.useRef<NodeJS.Timeout>();
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const positionUpdateRef = React.useRef<number>();

  // Detect touch device and mount state
  React.useEffect(() => {
    setMounted(true);
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  // Calculate optimal tooltip position
  const calculatePosition = React.useCallback((): CalculatedPosition | null => {
    if (!wrapperRef.current || !tooltipRef.current) return null;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const preferredSide = side;
    let bestPosition: CalculatedPosition | null = null;
    let bestScore = -Infinity;

    // Check all sides to find the best fit
    const sidesToCheck: Array<'top' | 'bottom' | 'left' | 'right'> = [
      preferredSide,
      ...(['top', 'bottom', 'left', 'right'] as const).filter(s => s !== preferredSide)
    ];

    for (const checkSide of sidesToCheck) {
      let x = 0;
      let y = 0;
      let arrowX: number | undefined;
      let arrowY: number | undefined;
      let score = 0;
      let finalAlign = align;

      // Calculate base position for this side
      if (checkSide === 'top') {
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.top - sideOffset;
        arrowX = triggerRect.left + triggerRect.width / 2;
        arrowY = triggerRect.top;
        score = triggerRect.top - tooltipRect.height - VIEWPORT_PADDING;
        
        // Adjust for horizontal alignment
        if (align === 'start') {
          x = triggerRect.left + alignOffset;
        } else if (align === 'end') {
          x = triggerRect.right - alignOffset;
        }
        
        // Keep tooltip within viewport horizontally
        const tooltipHalfWidth = tooltipRect.width / 2;
        if (x - tooltipHalfWidth < VIEWPORT_PADDING) {
          x = tooltipHalfWidth + VIEWPORT_PADDING;
          finalAlign = 'start';
        } else if (x + tooltipHalfWidth > viewportWidth - VIEWPORT_PADDING) {
          x = viewportWidth - tooltipHalfWidth - VIEWPORT_PADDING;
          finalAlign = 'end';
        }
      } else if (checkSide === 'bottom') {
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.bottom + sideOffset;
        arrowX = triggerRect.left + triggerRect.width / 2;
        arrowY = triggerRect.bottom;
        score = viewportHeight - triggerRect.bottom - tooltipRect.height - VIEWPORT_PADDING;
        
        // Adjust for horizontal alignment
        if (align === 'start') {
          x = triggerRect.left + alignOffset;
        } else if (align === 'end') {
          x = triggerRect.right - alignOffset;
        }
        
        // Keep tooltip within viewport horizontally
        const tooltipHalfWidth = tooltipRect.width / 2;
        if (x - tooltipHalfWidth < VIEWPORT_PADDING) {
          x = tooltipHalfWidth + VIEWPORT_PADDING;
          finalAlign = 'start';
        } else if (x + tooltipHalfWidth > viewportWidth - VIEWPORT_PADDING) {
          x = viewportWidth - tooltipHalfWidth - VIEWPORT_PADDING;
          finalAlign = 'end';
        }
      } else if (checkSide === 'left') {
        x = triggerRect.left - sideOffset;
        y = triggerRect.top + triggerRect.height / 2;
        arrowX = triggerRect.left;
        arrowY = triggerRect.top + triggerRect.height / 2;
        score = triggerRect.left - tooltipRect.width - VIEWPORT_PADDING;
        
        // Adjust for vertical alignment
        if (align === 'start') {
          y = triggerRect.top + alignOffset;
        } else if (align === 'end') {
          y = triggerRect.bottom - alignOffset;
        }
        
        // Keep tooltip within viewport vertically
        const tooltipHalfHeight = tooltipRect.height / 2;
        if (y - tooltipHalfHeight < VIEWPORT_PADDING) {
          y = tooltipHalfHeight + VIEWPORT_PADDING;
          finalAlign = 'start';
        } else if (y + tooltipHalfHeight > viewportHeight - VIEWPORT_PADDING) {
          y = viewportHeight - tooltipHalfHeight - VIEWPORT_PADDING;
          finalAlign = 'end';
        }
      } else { // right
        x = triggerRect.right + sideOffset;
        y = triggerRect.top + triggerRect.height / 2;
        arrowX = triggerRect.right;
        arrowY = triggerRect.top + triggerRect.height / 2;
        score = viewportWidth - triggerRect.right - tooltipRect.width - VIEWPORT_PADDING;
        
        // Adjust for vertical alignment
        if (align === 'start') {
          y = triggerRect.top + alignOffset;
        } else if (align === 'end') {
          y = triggerRect.bottom - alignOffset;
        }
        
        // Keep tooltip within viewport vertically
        const tooltipHalfHeight = tooltipRect.height / 2;
        if (y - tooltipHalfHeight < VIEWPORT_PADDING) {
          y = tooltipHalfHeight + VIEWPORT_PADDING;
          finalAlign = 'start';
        } else if (y + tooltipHalfHeight > viewportHeight - VIEWPORT_PADDING) {
          y = viewportHeight - tooltipHalfHeight - VIEWPORT_PADDING;
          finalAlign = 'end';
        }
      }

      // Calculate final score (prefer preferred side, then by available space)
      if (checkSide === preferredSide) score += 1000;
      if (score < 0) score = -10000; // Heavily penalize positions that don't fit

      if (score > bestScore) {
        bestScore = score;
        bestPosition = {
          side: checkSide,
          align: finalAlign,
          x,
          y,
          arrowX,
          arrowY,
        };
      }
    }

    return bestPosition;
  }, [side, align, sideOffset, alignOffset]);

  // Update position when tooltip opens or viewport changes
  React.useEffect(() => {
    if (!isOpen || !mounted) {
      setPosition(null);
      setIsMeasuring(true);
      return;
    }

    // First render tooltip off-screen to measure it, then position it
    const updatePosition = () => {
      if (wrapperRef.current && tooltipRef.current) {
        const newPosition = calculatePosition();
        if (newPosition) {
          setPosition(newPosition);
          setIsMeasuring(false);
        }
      }
    };

    // Initial position calculation after render - use double RAF to ensure layout
    requestAnimationFrame(() => {
      requestAnimationFrame(updatePosition);
    });

    // Update on scroll/resize with debouncing
    const handleUpdate = () => {
      if (positionUpdateRef.current) {
        cancelAnimationFrame(positionUpdateRef.current);
      }
      positionUpdateRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      if (positionUpdateRef.current) {
        cancelAnimationFrame(positionUpdateRef.current);
      }
    };
  }, [isOpen, mounted, calculatePosition]);

  const handleMouseEnter = () => {
    if (disableOnTouch && isTouchDevice) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    
    delayTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (disableOnTouch && isTouchDevice) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (isOpen) {
      setIsOpen(false);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      setIsOpen(true);
    }
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  React.useEffect(() => {
    const timeoutRefValue = timeoutRef;
    const delayTimeoutRefValue = delayTimeoutRef;
    
    return () => {
      if (timeoutRefValue.current) clearTimeout(timeoutRefValue.current);
      if (delayTimeoutRefValue.current) clearTimeout(delayTimeoutRefValue.current);
    };
  }, []);

  if (disableOnTouch && isTouchDevice) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <>
      {isOpen && mounted && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-[9999] px-3 py-2.5 text-sm rounded-xl shadow-2xl border',
            'pointer-events-none whitespace-normal',
            'bg-white/95 backdrop-blur-sm text-gray-900',
            'border-gray-200/80 dark:bg-gray-800/95 dark:text-gray-100 dark:border-gray-700/80',
            !isMeasuring && 'animate-in fade-in-0 zoom-in-95 duration-200',
            'max-w-[280px] sm:max-w-[320px] md:max-w-[360px]',
            isMeasuring && 'invisible',
            className
          )}
          role="tooltip"
          style={{
            left: position 
              ? `${position.x}px` 
              : isMeasuring 
              ? '-9999px' 
              : '0px',
            top: position 
              ? `${position.y}px` 
              : isMeasuring 
              ? '-9999px' 
              : '0px',
            transform: position
              ? (position.side === 'top' 
                  ? `translate(-50%, -100%)` 
                  : position.side === 'bottom'
                  ? `translate(-50%, 0)`
                  : position.side === 'left'
                  ? `translate(-100%, -50%)`
                  : `translate(0, -50%)`)
              : 'none',
            zIndex: 9999,
          }}
        >
          <div className="leading-relaxed tracking-wide">
            {typeof content === 'string' ? (
              <div className="whitespace-pre-line">{content}</div>
            ) : (
              content
            )}
          </div>
          {/* Arrow */}
          {position && position.arrowX !== undefined && position.arrowY !== undefined && wrapperRef.current && (
            (() => {
              let arrowLeft: string | number = 0;
              let arrowTop: string | number = 0;
              
              if (position.side === 'top' || position.side === 'bottom') {
                // Arrow is centered horizontally, positioned at top/bottom edge
                arrowLeft = '50%';
                arrowTop = position.side === 'top' ? '100%' : '0%';
              } else {
                // Arrow is centered vertically, positioned at left/right edge
                arrowLeft = position.side === 'left' ? '100%' : '0%';
                arrowTop = '50%';
              }
              
              return (
                <div
                  className={cn(
                    'absolute w-2 h-2 rotate-45',
                    'bg-white/95 backdrop-blur-sm',
                    'dark:bg-gray-800/95',
                    position.side === 'top' && 'border-b border-r border-gray-200/80 dark:border-gray-700/80',
                    position.side === 'bottom' && 'border-t border-l border-gray-200/80 dark:border-gray-700/80',
                    position.side === 'left' && 'border-r border-t border-gray-200/80 dark:border-gray-700/80',
                    position.side === 'right' && 'border-l border-b border-gray-200/80 dark:border-gray-700/80'
                  )}
                  style={{
                    left: arrowLeft,
                    top: arrowTop,
                    transform: 
                      position.side === 'top' 
                        ? 'translate(-50%, 50%)' 
                        : position.side === 'bottom'
                        ? 'translate(-50%, -50%)'
                        : position.side === 'left'
                        ? 'translate(50%, -50%)'
                        : 'translate(-50%, -50%)',
                  }}
                />
              );
            })()
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <div 
        ref={wrapperRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleClick}
      >
        {children}
      </div>
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
}
