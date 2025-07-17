/**
 * Production-safe logging utility
 * Automatically disables logging in production builds
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const isDevelopment = import.meta.env.MODE === 'development';

const createLogger = (): Logger => {
  const createLogFunction = (level: LogLevel) => {
    return (...args: any[]) => {
      if (isDevelopment) {
        console[level](...args);
      }
    };
  };

  return {
    log: createLogFunction('log'),
    warn: createLogFunction('warn'),
    error: createLogFunction('error'),
    info: createLogFunction('info'),
    debug: createLogFunction('debug'),
  };
};

export const logger = createLogger();

// Enhanced error logging with context
export const logError = (error: Error, context?: string) => {
  if (isDevelopment) {
    console.error(`[${context || 'Unknown'}] Error:`, error);
  }
  
  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (!isDevelopment) {
  //   errorTrackingService.captureError(error, { context });
  // }
};

// Success logging with context
export const logSuccess = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(`✅ ${message}`, data);
  }
};

// Warning logging with context
export const logWarning = (message: string, data?: any) => {
  if (isDevelopment) {
    console.warn(`⚠️ ${message}`, data);
  }
};

export default logger;