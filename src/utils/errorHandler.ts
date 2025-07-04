// Centralized Error Handler with Retry Logic and User Feedback

import { logger } from './logger';

// Error types (simplified for backend)
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  context?: string;
  isRetryable?: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: AppError, attempt: number) => boolean;
}

export interface ErrorHandlerOptions {
  retry?: RetryOptions;
  logError?: boolean;
  context?: string;
}

// Error classification
export const classifyError = (error: any, context: string): AppError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      context,
      isRetryable: false
    };
  }
  
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    context,
    isRetryable: false
  };
};

// Error type checks
export const isRetryableError = (error: AppError): boolean => {
  return error.isRetryable === true;
};

export const isNetworkError = (error: AppError): boolean => {
  return error.code === 'NETWORK_ERROR';
};

export const isApiError = (error: AppError): boolean => {
  return error.code === 'API_ERROR';
};

export const isBlockchainError = (error: AppError): boolean => {
  return error.code === 'BLOCKCHAIN_ERROR';
};

export const isFormError = (error: AppError): boolean => {
  return error.code === 'FORM_ERROR';
};

export const isAuthError = (error: AppError): boolean => {
  return error.code === 'AUTH_ERROR';
};

// Error creation helpers
export const createApiError = (message: string, statusCode: number = 500): AppError => ({
  message,
  code: 'API_ERROR',
  statusCode,
  isRetryable: statusCode >= 500
});

export const createBlockchainError = (message: string, isRetryable: boolean = false): AppError => ({
  message,
  code: 'BLOCKCHAIN_ERROR',
  isRetryable
});

export const createFormError = (message: string, field?: string): AppError => ({
  message,
  code: 'FORM_ERROR',
  context: field
});

export class ErrorHandler {
  private static defaultRetryOptions: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error: AppError) => isRetryableError(error),
  };

  /**
   * Execute a function with retry logic and error handling
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    const {
      retry = {},
      logError = true,
      context = 'unknown'
    } = options;

    const retryConfig = { ...this.defaultRetryOptions, ...retry };
    
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = classifyError(error, context);
        
        if (attempt < retryConfig.maxRetries && retryConfig.retryCondition(lastError, attempt)) {
          const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
          
          logger.warn('Retrying operation', {
            attempt,
            maxAttempts: retryConfig.maxRetries,
            delay,
            error: lastError.message,
            context
          });
          
          await this.delay(delay);
          continue;
        }
        
        // Don't retry, handle the error
        break;
      }
    }

    // Handle final error
    if (lastError) {
      this.handleError(lastError, { logError });
      throw lastError;
    }

    throw new Error('Operation failed after all retry attempts');
  }

  /**
   * Handle API errors with proper classification and logging
   */
  static handleApiError(error: unknown, context: string): AppError {
    const appError = classifyError(error, context);
    
    if (isApiError(appError)) {
      logger.error('API Error', {
        status: appError.statusCode,
        message: appError.message,
        context
      });
    }
    
    return appError;
  }

  /**
   * Handle form errors with logging
   */
  static handleFormError(error: unknown, context: string, field?: string): AppError {
    const appError = classifyError(error, context);
    
    if (isFormError(appError)) {
      logger.warn('Form Error', {
        field: field || appError.context,
        message: appError.message,
        context
      });
    }
    
    return appError;
  }

  /**
   * Handle blockchain errors with chain-specific logic
   */
  static handleBlockchainError(error: unknown, context: string, chain: string, address?: string): AppError {
    const appError = classifyError(error, context);
    
    if (isBlockchainError(appError)) {
      logger.error('Blockchain Error', {
        chain,
        address,
        message: appError.message,
        context,
        isRetryable: appError.isRetryable
      });
    }
    
    return appError;
  }

  /**
   * Handle network errors with retry recommendations
   */
  static handleNetworkError(error: unknown, context: string): AppError {
    const appError = classifyError(error, context);
    
    if (isNetworkError(appError)) {
      logger.error('Network Error', {
        message: appError.message,
        context
      });
    }
    
    return appError;
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: unknown, context: string): AppError {
    const appError = classifyError(error, context);
    
    if (isAuthError(appError)) {
      logger.error('Auth Error', {
        message: appError.message,
        context
      });
    }
    
    return appError;
  }

  /**
   * Handle errors with logging
   */
  static handleError(error: AppError, options: { logError?: boolean } = {}): void {
    const { logError = true } = options;
    
    if (logError) {
      logger.error('Error occurred', {
        message: error.message,
        code: error.code,
        context: error.context,
        isRetryable: error.isRetryable
      });
    }
  }

  /**
   * Wrap a function with error handling
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    context: string,
    options: ErrorHandlerOptions = {}
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      const appError = classifyError(error, context);
      this.handleError(appError, options);
      return { success: false, error: appError };
    }
  }

  /**
   * Wrap a synchronous function with error handling
   */
  static wrapSync<T>(
    fn: () => T,
    context: string,
    options: ErrorHandlerOptions = {}
  ): { success: boolean; data?: T; error?: AppError } {
    try {
      const result = fn();
      return { success: true, data: result };
    } catch (error) {
      const appError = classifyError(error, context);
      this.handleError(appError, options);
      return { success: false, error: appError };
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 