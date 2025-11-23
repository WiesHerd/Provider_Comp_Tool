'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface TourSpotlightProps {
  targetSelector?: string;
  isActive: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onElementFound?: (element: HTMLElement | null) => void;
}

export function TourSpotlight({ 
  targetSelector, 
  isActive, 
  position = 'bottom',
  onElementFound 
}: TourSpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find and track target element
  useEffect(() => {
    if (!isActive || !targetSelector) {
      setTargetElement(null);
      setTargetRect(null);
      onElementFound?.(null);
      return;
    }

    const findElement = () => {
      try {
        // Try ID first
        let element = document.getElementById(targetSelector.replace('#', ''));
        
        // Try data attribute
        if (!element) {
          element = document.querySelector(targetSelector) as HTMLElement;
        }

        // Try querySelector with various formats
        if (!element) {
          const selectors = [
            targetSelector,
            `[data-tour="${targetSelector}"]`,
            `#${targetSelector}`,
            `.${targetSelector}`,
          ];
          
          for (const selector of selectors) {
            element = document.querySelector(selector) as HTMLElement;
            if (element) break;
          }
        }

        if (element) {
          setTargetElement(element);
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          onElementFound?.(element);
          
          // Scroll element into view if needed
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        } else {
          setTargetElement(null);
          setTargetRect(null);
          onElementFound?.(null);
        }
      } catch (e) {
        console.warn('Tour spotlight: Error finding element', e);
        setTargetElement(null);
        setTargetRect(null);
        onElementFound?.(null);
      }
    };

    // Initial find
    findElement();

    // Set up observer for dynamic content
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              findElement();
            }
          });
        },
        { threshold: 0.1 }
      );
    }

    // Also check periodically for elements that might load later
    checkIntervalRef.current = setInterval(findElement, 500);

    // Update rect on scroll/resize
    const updateRect = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [isActive, targetSelector, targetElement, onElementFound]);

  if (!isActive) {
    return null;
  }

  // Calculate spotlight position
  const spotlightStyle: React.CSSProperties = {};
  const overlayStyle: React.CSSProperties = {};

  if (targetRect && targetElement) {
    const padding = 8;
    const spotlightTop = targetRect.top - padding;
    const spotlightLeft = targetRect.left - padding;
    const spotlightWidth = targetRect.width + padding * 2;
    const spotlightHeight = targetRect.height + padding * 2;

    // Create cutout in overlay
    overlayStyle.clipPath = `polygon(
      0% 0%,
      0% 100%,
      ${spotlightLeft}px 100%,
      ${spotlightLeft}px ${spotlightTop}px,
      ${spotlightLeft + spotlightWidth}px ${spotlightTop}px,
      ${spotlightLeft + spotlightWidth}px ${spotlightTop + spotlightHeight}px,
      ${spotlightLeft}px ${spotlightTop + spotlightHeight}px,
      ${spotlightLeft}px 100%,
      100% 100%,
      100% 0%
    )`;
  } else if (position === 'center') {
    // Center position - no spotlight, just overlay
    overlayStyle.opacity = 0.7;
  }

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none"
      aria-hidden="true"
    >
      {/* Overlay with cutout */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          targetRect ? 'opacity-100' : 'opacity-70'
        )}
        style={overlayStyle}
      />
      
      {/* Spotlight highlight ring */}
      {targetRect && targetElement && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: '12px',
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
            border: '2px solid rgba(99, 102, 241, 0.8)',
          }}
        />
      )}
    </div>
  );
}

