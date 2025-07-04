"use strict";
// Centralized Error Handler with Retry Logic and User Feedback
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.createFormError = exports.createBlockchainError = exports.createApiError = exports.isAuthError = exports.isFormError = exports.isBlockchainError = exports.isApiError = exports.isNetworkError = exports.isRetryableError = exports.classifyError = void 0;
const logger_1 = require("./logger");
// Error classification
const classifyError = (error, context) => {
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
exports.classifyError = classifyError;
// Error type checks
const isRetryableError = (error) => {
    return error.isRetryable === true;
};
exports.isRetryableError = isRetryableError;
const isNetworkError = (error) => {
    return error.code === 'NETWORK_ERROR';
};
exports.isNetworkError = isNetworkError;
const isApiError = (error) => {
    return error.code === 'API_ERROR';
};
exports.isApiError = isApiError;
const isBlockchainError = (error) => {
    return error.code === 'BLOCKCHAIN_ERROR';
};
exports.isBlockchainError = isBlockchainError;
const isFormError = (error) => {
    return error.code === 'FORM_ERROR';
};
exports.isFormError = isFormError;
const isAuthError = (error) => {
    return error.code === 'AUTH_ERROR';
};
exports.isAuthError = isAuthError;
// Error creation helpers
const createApiError = (message, statusCode = 500) => ({
    message,
    code: 'API_ERROR',
    statusCode,
    isRetryable: statusCode >= 500
});
exports.createApiError = createApiError;
const createBlockchainError = (message, isRetryable = false) => ({
    message,
    code: 'BLOCKCHAIN_ERROR',
    isRetryable
});
exports.createBlockchainError = createBlockchainError;
const createFormError = (message, field) => ({
    message,
    code: 'FORM_ERROR',
    context: field
});
exports.createFormError = createFormError;
class ErrorHandler {
    /**
     * Execute a function with retry logic and error handling
     */
    static withRetry(fn, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { retry = {}, logError = true, context = 'unknown' } = options;
            const retryConfig = Object.assign(Object.assign({}, this.defaultRetryOptions), retry);
            let lastError = null;
            for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
                try {
                    const result = yield fn();
                    return result;
                }
                catch (error) {
                    lastError = (0, exports.classifyError)(error, context);
                    if (attempt < retryConfig.maxRetries && retryConfig.retryCondition(lastError, attempt)) {
                        const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
                        logger_1.logger.warn('Retrying operation', {
                            attempt,
                            maxAttempts: retryConfig.maxRetries,
                            delay,
                            error: lastError.message,
                            context
                        });
                        yield this.delay(delay);
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
        });
    }
    /**
     * Handle API errors with proper classification and logging
     */
    static handleApiError(error, context) {
        const appError = (0, exports.classifyError)(error, context);
        if ((0, exports.isApiError)(appError)) {
            logger_1.logger.error('API Error', {
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
    static handleFormError(error, context, field) {
        const appError = (0, exports.classifyError)(error, context);
        if ((0, exports.isFormError)(appError)) {
            logger_1.logger.warn('Form Error', {
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
    static handleBlockchainError(error, context, chain, address) {
        const appError = (0, exports.classifyError)(error, context);
        if ((0, exports.isBlockchainError)(appError)) {
            logger_1.logger.error('Blockchain Error', {
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
    static handleNetworkError(error, context) {
        const appError = (0, exports.classifyError)(error, context);
        if ((0, exports.isNetworkError)(appError)) {
            logger_1.logger.error('Network Error', {
                message: appError.message,
                context
            });
        }
        return appError;
    }
    /**
     * Handle authentication errors
     */
    static handleAuthError(error, context) {
        const appError = (0, exports.classifyError)(error, context);
        if ((0, exports.isAuthError)(appError)) {
            logger_1.logger.error('Auth Error', {
                message: appError.message,
                context
            });
        }
        return appError;
    }
    /**
     * Handle errors with logging
     */
    static handleError(error, options = {}) {
        const { logError = true } = options;
        if (logError) {
            logger_1.logger.error('Error occurred', {
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
    static wrap(fn, context, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield fn();
                return { success: true, data: result };
            }
            catch (error) {
                const appError = (0, exports.classifyError)(error, context);
                this.handleError(appError, options);
                return { success: false, error: appError };
            }
        });
    }
    /**
     * Wrap a synchronous function with error handling
     */
    static wrapSync(fn, context, options = {}) {
        try {
            const result = fn();
            return { success: true, data: result };
        }
        catch (error) {
            const appError = (0, exports.classifyError)(error, context);
            this.handleError(appError, options);
            return { success: false, error: appError };
        }
    }
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ErrorHandler = ErrorHandler;
ErrorHandler.defaultRetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error) => (0, exports.isRetryableError)(error),
};
