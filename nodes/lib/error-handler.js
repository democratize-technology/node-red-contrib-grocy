/**
 * Unified error handling for Grocy operations
 * Provides comprehensive error classification, recovery patterns,
 * and user-friendly feedback for Node-RED flows
 */
const {
  ErrorClassifier,
  ErrorFormatter,
  ErrorFactory,
  NetworkErrorHandler,
  HttpErrorHandler,
  AuthErrorHandler,
  ValidationErrorHandler,
  ConfigErrorHandler,
  TimeoutErrorHandler,
  RateLimitErrorHandler,
  ParsingErrorHandler,
  OperationErrorHandler
} = require('./error-handlers');

class ErrorHandler {
  /**
   * Handle and format errors for Node-RED
   * @param {Error} error - The error to handle
   * @param {Object} node - The Node-RED node
   * @param {Object} msg - The message object
   * @param {Function} done - The done callback
   * @param {Object} context - Additional context for error handling
   * @returns {Object} Formatted error response
   */
  static handle(error, node, msg, done, context = {}) {
    const errorInfo = this.formatError(error, context);
    
    // Log error details for debugging
    this.logError(error, node, errorInfo, context);
    
    // Update node status
    node.status({
      fill: 'red',
      shape: errorInfo.isTemporary ? 'ring' : 'dot',
      text: ErrorFormatter.sanitizeForDisplay(errorInfo.statusText)
    });

    // Create error response
    const errorResponse = {
      error: {
        message: ErrorFormatter.sanitizeForDisplay(errorInfo.message),
        type: errorInfo.type,
        statusCode: errorInfo.statusCode,
        isTemporary: errorInfo.isTemporary,
        canRetry: errorInfo.canRetry,
        retryAfter: errorInfo.retryAfter,
        timestamp: new Date().toISOString(),
        operation: context.operation,
        payload: context.sanitizedPayload
      },
      originalMessage: msg
    };

    // Call done with error or send error through node.error
    if (done) {
      done(error);
    } else {
      node.error(error, msg);
    }

    return errorResponse;
  }

  /**
   * Format error for consistent handling
   * @param {Error} error - The error to format
   * @param {Object} context - Additional context information
   * @returns {Object} Formatted error information
   */
  static formatError(error, context = {}) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      type: 'unknown',
      statusCode: null,
      isTemporary: false,
      canRetry: false,
      retryAfter: null,
      statusText: 'error',
      category: 'system',
      severity: 'error'
    };

    // Network connectivity errors
    if (ErrorClassifier.isNetworkError(error)) {
      return NetworkErrorHandler.handle(error, errorInfo);
    }
    // HTTP response errors
    else if (ErrorClassifier.isHttpError(error)) {
      return HttpErrorHandler.handle(error, errorInfo);
    }
    // Authentication and authorization errors
    else if (ErrorClassifier.isAuthError(error)) {
      return AuthErrorHandler.handle(error, errorInfo);
    }
    // Validation errors
    else if (ErrorClassifier.isValidationError(error)) {
      return ValidationErrorHandler.handle(error, errorInfo);
    }
    // Configuration errors
    else if (ErrorClassifier.isConfigError(error)) {
      return ConfigErrorHandler.handle(error, errorInfo);
    }
    // Timeout errors
    else if (ErrorClassifier.isTimeoutError(error)) {
      return TimeoutErrorHandler.handle(error, errorInfo);
    }
    // Rate limit errors
    else if (ErrorClassifier.isRateLimitError(error)) {
      return RateLimitErrorHandler.handle(error, errorInfo);
    }
    // API parsing errors
    else if (ErrorClassifier.isParsingError(error)) {
      return ParsingErrorHandler.handle(error, errorInfo);
    }
    // Operation errors
    else if (ErrorClassifier.isOperationError(error)) {
      return OperationErrorHandler.handle(error, errorInfo);
    }
    // Generic errors
    else {
      errorInfo.statusText = ErrorFormatter.sanitizeForDisplay(ErrorFormatter.truncateMessage(error.message, 20));
    }

    return errorInfo;
  }

  /**
   * Create a validation error
   * @param {string} message - Error message
   * @returns {Error} Validation error
   */
  static validationError(message) {
    return ErrorFactory.validationError(message);
  }

  /**
   * Create an operation error
   * @param {string} operation - The invalid operation
   * @returns {Error} Operation error
   */
  static operationError(operation) {
    return ErrorFactory.operationError(operation);
  }

  /**
   * Truncate message for status display
   * @param {string} message - The message to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated message
   */
  static truncateMessage(message, maxLength = 30) {
    return ErrorFormatter.truncateMessage(message, maxLength);
  }

  /**
   * Check if error is recoverable/temporary
   * @param {Error} error - The error to check
   * @returns {boolean} True if error might be temporary
   */
  static isTemporary(error) {
    return this.formatError(error).isTemporary;
  }

  /**
   * Check if error can be retried
   * @param {Error} error - The error to check
   * @returns {boolean} True if error can be retried
   */
  static canRetry(error) {
    return this.formatError(error).canRetry;
  }

  // Error classification methods

  /**
   * Check if error is a network connectivity error
   * @param {Error} error - The error to check
   * @returns {boolean} True if network error
   */
  static isNetworkError(error) {
    return ErrorClassifier.isNetworkError(error);
  }

  /**
   * Check if error is an authentication/authorization error
   * @param {Error} error - The error to check
   * @returns {boolean} True if auth error
   */
  static isAuthError(error) {
    return ErrorClassifier.isAuthError(error);
  }

  /**
   * Check if error is a validation error
   * @param {Error} error - The error to check
   * @returns {boolean} True if validation error
   */
  static isValidationError(error) {
    return ErrorClassifier.isValidationError(error);
  }

  /**
   * Check if error is a configuration error
   * @param {Error} error - The error to check
   * @returns {boolean} True if config error
   */
  static isConfigError(error) {
    return ErrorClassifier.isConfigError(error);
  }

  /**
   * Check if error is a timeout error
   * @param {Error} error - The error to check
   * @returns {boolean} True if timeout error
   */
  static isTimeoutError(error) {
    return ErrorClassifier.isTimeoutError(error);
  }

  /**
   * Check if error is a rate limit error
   * @param {Error} error - The error to check
   * @returns {boolean} True if rate limit error
   */
  static isRateLimitError(error) {
    return ErrorClassifier.isRateLimitError(error);
  }

  /**
   * Check if error is a parsing/format error
   * @param {Error} error - The error to check
   * @returns {boolean} True if parsing error
   */
  static isParsingError(error) {
    return ErrorClassifier.isParsingError(error);
  }

  /**
   * Check if error is an operation error
   * @param {Error} error - The error to check
   * @returns {boolean} True if operation error
   */
  static isOperationError(error) {
    return ErrorClassifier.isOperationError(error);
  }

  // Specialized error handlers (moved to separate modules)


  // Utility methods

  /**
   * Calculate retry delay based on error type
   * @param {Error} error - The error
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Retry delay in milliseconds
   */
  static getRetryDelay(error, baseDelay = 1000) {
    return ErrorFormatter.getRetryDelay(error, baseDelay);
  }

  /**
   * Extract Retry-After header value
   * @param {Object} response - HTTP response object
   * @returns {number|null} Retry delay in milliseconds
   */
  static extractRetryAfter(response) {
    return ErrorFormatter.extractRetryAfter(response);
  }

  /**
   * Log error details for debugging
   * @param {Error} error - The original error
   * @param {Object} node - The Node-RED node
   * @param {Object} errorInfo - Formatted error info
   * @param {Object} context - Additional context
   */
  static logError(error, node, errorInfo, context = {}) {
    if (!node || !node.debug) return;

    const logData = {
      type: errorInfo.type,
      category: errorInfo.category,
      statusCode: errorInfo.statusCode,
      isTemporary: errorInfo.isTemporary,
      canRetry: errorInfo.canRetry,
      operation: context.operation,
      timestamp: new Date().toISOString()
    };

    // Include stack trace for debugging in development
    if (process.env.NODE_ENV === 'development') {
      logData.stack = error.stack;
    }

    node.debug(`Error occurred: ${errorInfo.message}`, logData);
  }

  /**
   * Sanitize payload for logging (remove sensitive data)
   * @param {Object} payload - The payload to sanitize
   * @returns {Object} Sanitized payload
   */
  static sanitizePayload(payload) {
    return ErrorFormatter.sanitizePayload(payload);
  }

  /**
   * Sanitize error messages for display to prevent XSS attacks
   * Escapes HTML characters that could be used for XSS injection
   * @param {string} message - The error message to sanitize
   * @returns {string} HTML-escaped message safe for display
   */
  static sanitizeForDisplay(message) {
    return ErrorFormatter.sanitizeForDisplay(message);
  }

  /**
   * Create aggregated validation error from multiple validation errors
   * @param {Array<string>} errors - Array of validation error messages
   * @returns {Error} Aggregated validation error
   */
  static aggregateValidationErrors(errors) {
    return ErrorFactory.aggregateValidationErrors(errors);
  }

  /**
   * Create a timeout error
   * @param {string} operation - The operation that timed out
   * @param {number} timeout - Timeout value in milliseconds
   * @returns {Error} Timeout error
   */
  static timeoutError(operation, timeout) {
    return ErrorFactory.timeoutError(operation, timeout);
  }

  /**
   * Create a configuration error
   * @param {string} message - Error message
   * @returns {Error} Configuration error
   */
  static configError(message) {
    return ErrorFactory.configError(message);
  }

  /**
   * Create a rate limit error
   * @param {number} retryAfter - Retry after seconds
   * @returns {Error} Rate limit error
   */
  static rateLimitError(retryAfter = 60) {
    return ErrorFactory.rateLimitError(retryAfter);
  }

  /**
   * Create a security error for security-related violations
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Error} Security error
   */
  static securityError(message, details = {}) {
    return ErrorFactory.securityError(message, details);
  }
}

module.exports = ErrorHandler;