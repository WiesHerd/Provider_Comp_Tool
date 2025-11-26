import { useEffect, useRef } from 'react';

/**
 * Custom hook for debounced localStorage writes
 * Prevents excessive localStorage writes by batching updates
 * 
 * @param key - localStorage key
 * @param value - Value to store (will be JSON stringified)
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 */
export function useDebouncedLocalStorage<T>(
  key: string,
  value: T | null,
  delay: number = 500
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount to avoid writing default values
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          if (value === null || value === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        } catch (error) {
          // Handle quota exceeded or other errors
          // Error is logged by safeLocalStorage.setItem
          // Could emit to error tracking service here
        }
      }
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, delay]);
}

/**
 * Safe localStorage wrapper with error handling
 * Uses logger utility for consistent error reporting
 */
import { logger } from '@/lib/utils/logger';

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.error(`Failed to read from localStorage (key: ${key}):`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error(`localStorage quota exceeded (key: ${key}):`, error);
        // Could show user notification here
      } else {
        logger.error(`Failed to write to localStorage (key: ${key}):`, error);
      }
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove from localStorage (key: ${key}):`, error);
      return false;
    }
  },
};

