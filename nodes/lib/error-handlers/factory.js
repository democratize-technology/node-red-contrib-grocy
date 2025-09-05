/**
 * Error factory for creating specific error types with proper metadata
 * Provides factory methods for creating typed errors consistently
 */
class ErrorFactory {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @returns {Error} Validation error
   */
  static validationError(message) {
    const error = new Error(message);
    error.type = 'validation';
    return error;
  }

  /**
   * Create an operation error
   * @param {string} operation - The invalid operation
   * @returns {Error} Operation error
   */
  static operationError(operation) {
    const error = new Error(`Invalid operation: ${operation}`);
    error.type = 'operation';
    return error;
  }

  /**
   * Create a timeout error
   * @param {string} operation - The operation that timed out
   * @param {number} timeout - Timeout value in milliseconds
   * @returns {Error} Timeout error
   */
  static timeoutError(operation, timeout) {
    const error = new Error(`Operation '${operation}' timed out after ${timeout}ms`);
    error.type = 'timeout';
    error.code = 'ETIMEDOUT';
    error.operation = operation;
    error.timeout = timeout;
    return error;
  }

  /**
   * Create a configuration error
   * @param {string} message - Error message
   * @returns {Error} Configuration error
   */
  static configError(message) {
    const error = new Error(message);
    error.type = 'config';
    return error;
  }

  /**
   * Create a rate limit error
   * @param {number} retryAfter - Retry after seconds
   * @returns {Error} Rate limit error
   */
  static rateLimitError(retryAfter = 60) {
    const error = new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    error.type = 'ratelimit';
    error.statusCode = 429;
    error.retryAfter = retryAfter * 1000; // Convert to milliseconds
    return error;
  }

  /**
   * Create aggregated validation error from multiple validation errors
   * @param {Array<string>} errors - Array of validation error messages
   * @returns {Error} Aggregated validation error
   */
  static aggregateValidationErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
      return this.validationError('Unknown validation error');
    }

    if (errors.length === 1) {
      return this.validationError(errors[0]);
    }

    const error = new Error(`Multiple validation errors: ${errors.join('; ')}`);
    error.type = 'validation';
    error.validationErrors = errors;
    return error;
  }

  /**
   * Create a security error for security-related violations
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Error} Security error
   */
  static securityError(message, details = {}) {
    const error = new Error(`Security violation: ${message}`);
    error.type = 'security';
    error.category = 'security';
    error.severity = 'critical';
    error.details = details;
    
    // Add specific security context
    if (details.field) {
      error.field = details.field;
    }
    if (details.pattern) {
      error.pattern = details.pattern;
    }
    if (details.value) {
      // Don't expose the actual malicious value in logs
      error.attemptedValue = '[REDACTED]';
    }
    
    return error;
  }
}

module.exports = ErrorFactory;