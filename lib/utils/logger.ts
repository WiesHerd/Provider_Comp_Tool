/**
 * Centralized logging utility
 * Only logs in development mode to avoid console noise in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, but could integrate with error tracking service
    if (isDevelopment) {
      console.error(...args);
    }
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // errorTrackingService.captureException(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

