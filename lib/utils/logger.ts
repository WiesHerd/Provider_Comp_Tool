/**
 * Centralized logging utility
 * 
 * Logs in development mode to console. In production, errors are still logged
 * to console but can be integrated with error tracking services.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors (even in production) for debugging
    console.error(...args);
    
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // In production, you might want to send errors to a tracking service:
    // if (!isDevelopment && typeof window !== 'undefined') {
    //   errorTrackingService.captureException(...args);
    // }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
    // Optionally log warnings in production for critical issues
    // console.warn(...args);
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

