/**
 * Unified error handling for Grocy operations
 * Provides comprehensive error classification, recovery patterns,
 * and user-friendly feedback for Node-RED flows
 */
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
      text: this.sanitizeForDisplay(errorInfo.statusText)
    });

    // Create error response
    const errorResponse = {
      error: {
        message: this.sanitizeForDisplay(errorInfo.message),
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
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, errorInfo);
    }
    // HTTP response errors
    else if (error.response) {
      return this.handleHttpError(error, errorInfo);
    }
    // Authentication and authorization errors
    else if (this.isAuthError(error)) {
      return this.handleAuthError(error, errorInfo);
    }
    // Validation errors
    else if (this.isValidationError(error)) {
      return this.handleValidationError(error, errorInfo);
    }
    // Configuration errors
    else if (this.isConfigError(error)) {
      return this.handleConfigError(error, errorInfo);
    }
    // Timeout errors
    else if (this.isTimeoutError(error)) {
      return this.handleTimeoutError(error, errorInfo);
    }
    // Rate limit errors
    else if (this.isRateLimitError(error)) {
      return this.handleRateLimitError(error, errorInfo);
    }
    // API parsing errors
    else if (this.isParsingError(error)) {
      return this.handleParsingError(error, errorInfo);
    }
    // Operation errors
    else if (this.isOperationError(error)) {
      return this.handleOperationError(error, errorInfo);
    }
    // Generic errors
    else {
      errorInfo.statusText = this.sanitizeForDisplay(this.truncateMessage(error.message, 20));
    }

    return errorInfo;
  }

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
   * Truncate message for status display
   * @param {string} message - The message to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated message
   */
  static truncateMessage(message, maxLength = 30) {
    if (!message || typeof message !== 'string') {
      return 'error';
    }
    
    if (message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength - 3) + '...';
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
    if (!error) return false;
    
    const networkCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 
                         'ENETUNREACH', 'EAI_AGAIN', 'ECONNABORTED'];
    const message = error.message || '';
    
    return networkCodes.includes(error.code) || 
           message.includes('network') || 
           message.includes('connection failed');
  }

  /**
   * Check if error is an authentication/authorization error
   * @param {Error} error - The error to check
   * @returns {boolean} True if auth error
   */
  static isAuthError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    const status = error.statusCode || (error.response && error.response.status);
    
    return status === 401 || status === 403 ||
           message.includes('401') || message.includes('403') ||
           message.includes('unauthorized') || message.includes('forbidden') ||
           message.includes('API key') || message.includes('authentication');
  }

  /**
   * Check if error is a validation error
   * @param {Error} error - The error to check
   * @returns {boolean} True if validation error
   */
  static isValidationError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    
    return error.type === 'validation' ||
           message.includes('required') || 
           message.includes('invalid') ||
           message.includes('Missing') ||
           message.includes('must be') ||
           message.includes('validation failed');
  }

  /**
   * Check if error is a configuration error
   * @param {Error} error - The error to check
   * @returns {boolean} True if config error
   */
  static isConfigError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    
    return message.includes('configuration') ||
           message.includes('Missing API') ||
           message.includes('server config') ||
           message.includes('Invalid config') ||
           message.includes('not initialized');
  }

  /**
   * Check if error is a timeout error
   * @param {Error} error - The error to check
   * @returns {boolean} True if timeout error
   */
  static isTimeoutError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    
    return error.code === 'ETIMEDOUT' || 
           error.code === 'TIMEOUT' ||
           message.includes('timeout') ||
           message.includes('timed out');
  }

  /**
   * Check if error is a rate limit error
   * @param {Error} error - The error to check
   * @returns {boolean} True if rate limit error
   */
  static isRateLimitError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    const status = error.statusCode || (error.response && error.response.status);
    
    return status === 429 ||
           message.includes('429') ||
           message.includes('rate limit') ||
           message.includes('too many requests');
  }

  /**
   * Check if error is a parsing/format error
   * @param {Error} error - The error to check
   * @returns {boolean} True if parsing error
   */
  static isParsingError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    
    return message.includes('JSON') ||
           message.includes('parse') ||
           message.includes('SyntaxError') ||
           message.includes('unexpected token');
  }

  /**
   * Check if error is an operation error
   * @param {Error} error - The error to check
   * @returns {boolean} True if operation error
   */
  static isOperationError(error) {
    if (!error) return false;
    
    const message = error.message || '';
    
    return message.includes('operation') ||
           message.includes('Unknown') ||
           message.includes('not supported') ||
           error.type === 'operation';
  }

  // Specialized error handlers

  /**
   * Handle network connectivity errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleNetworkError(error, errorInfo) {
    errorInfo.type = 'network';
    errorInfo.category = 'connectivity';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.retryAfter = this.getRetryDelay(error);
    errorInfo.severity = 'warning';

    // Specific network error messages
    switch (error.code) {
      case 'ECONNREFUSED':
        errorInfo.message = 'Connection refused - Grocy server may be down';
        errorInfo.statusText = 'server down';
        break;
      case 'ENOTFOUND':
        errorInfo.message = 'Host not found - Check Grocy server URL';
        errorInfo.statusText = 'host not found';
        errorInfo.isTemporary = false; // DNS issues usually aren't temporary
        errorInfo.canRetry = false;
        break;
      case 'ETIMEDOUT':
        errorInfo.message = 'Connection timeout - Grocy server not responding';
        errorInfo.statusText = 'timeout';
        break;
      case 'ECONNRESET':
        errorInfo.message = 'Connection reset - Network interruption';
        errorInfo.statusText = 'connection reset';
        break;
      case 'ENETUNREACH':
        errorInfo.message = 'Network unreachable - Check network connectivity';
        errorInfo.statusText = 'network unreachable';
        break;
      default:
        errorInfo.statusText = 'network error';
    }

    return errorInfo;
  }

  /**
   * Handle HTTP response errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleHttpError(error, errorInfo) {
    errorInfo.type = 'http';
    errorInfo.category = 'api';
    
    const response = error.response || {};
    const status = response.status || error.statusCode || 500;
    
    errorInfo.statusCode = status;
    errorInfo.statusText = `HTTP ${status}`;

    // Classify by status code
    if (status >= 500) {
      errorInfo.isTemporary = true;
      errorInfo.canRetry = true;
      errorInfo.retryAfter = this.getRetryDelay(error, 5000); // 5 second base delay
      errorInfo.severity = 'error';
      errorInfo.message = 'Server error - Please try again later';
    } else if (status >= 400 && status < 500) {
      errorInfo.isTemporary = false;
      errorInfo.canRetry = false;
      errorInfo.severity = 'error';
      
      switch (status) {
        case 400:
          errorInfo.message = 'Bad request - Invalid parameters';
          break;
        case 401:
          errorInfo.message = 'Unauthorized - Check API key';
          errorInfo.type = 'auth';
          break;
        case 403:
          errorInfo.message = 'Forbidden - Insufficient permissions';
          errorInfo.type = 'auth';
          break;
        case 404:
          errorInfo.message = 'Not found - Resource does not exist';
          break;
        case 409:
          errorInfo.message = 'Conflict - Resource already exists or operation not allowed';
          break;
        case 422:
          errorInfo.message = 'Unprocessable entity - Validation failed';
          errorInfo.type = 'validation';
          break;
        case 429:
          errorInfo.message = 'Too many requests - Rate limited';
          errorInfo.type = 'ratelimit';
          errorInfo.isTemporary = true;
          errorInfo.canRetry = true;
          errorInfo.retryAfter = this.extractRetryAfter(response);
          break;
      }
    }

    // Extract more detailed error message from response
    if (response.data) {
      const responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          const parsed = JSON.parse(responseData);
          errorInfo.message = parsed.error_message || parsed.message || errorInfo.message;
        } catch (e) {
          // If it's not JSON, use as is if it's informative
          if (responseData.length < 200 && !responseData.includes('<')) {
            errorInfo.message = responseData;
          }
        }
      } else if (typeof responseData === 'object') {
        errorInfo.message = responseData.error_message || 
                           responseData.message || 
                           responseData.error || 
                           errorInfo.message;
      }
    }

    return errorInfo;
  }

  /**
   * Handle authentication/authorization errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleAuthError(error, errorInfo) {
    errorInfo.type = 'auth';
    errorInfo.category = 'security';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'error';
    
    const message = error.message || '';
    const status = error.statusCode || (error.response && error.response.status);
    
    if (status === 401 || message.includes('401') || message.includes('unauthorized')) {
      errorInfo.statusCode = 401;
      errorInfo.message = 'Authentication failed - Check API key configuration';
      errorInfo.statusText = 'unauthorized';
    } else if (status === 403 || message.includes('403') || message.includes('forbidden')) {
      errorInfo.statusCode = 403;
      errorInfo.message = 'Access forbidden - Insufficient permissions';
      errorInfo.statusText = 'forbidden';
    } else {
      errorInfo.message = 'Authentication error - Check credentials';
      errorInfo.statusText = 'auth error';
    }

    return errorInfo;
  }

  /**
   * Handle validation errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleValidationError(error, errorInfo) {
    errorInfo.type = 'validation';
    errorInfo.category = 'input';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'warning';
    errorInfo.statusText = 'invalid input';

    // Keep the original validation message as it's usually descriptive
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      errorInfo.message = error.validationErrors.join(', ');
    } else if (error.message) {
      errorInfo.message = error.message;
    }

    return errorInfo;
  }

  /**
   * Handle configuration errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleConfigError(error, errorInfo) {
    errorInfo.type = 'config';
    errorInfo.category = 'configuration';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'error';
    errorInfo.statusText = 'config error';

    if (error.message.includes('Missing API') || error.message.includes('API key')) {
      errorInfo.message = 'Missing or invalid API key in server configuration';
    } else if (error.message.includes('server config')) {
      errorInfo.message = 'Grocy server configuration not found or invalid';
    } else if (error.message.includes('not initialized')) {
      errorInfo.message = 'Node not properly initialized - Check configuration';
    } else {
      errorInfo.message = error.message || 'Configuration error';
    }

    return errorInfo;
  }

  /**
   * Handle timeout errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleTimeoutError(error, errorInfo) {
    errorInfo.type = 'timeout';
    errorInfo.category = 'performance';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.retryAfter = this.getRetryDelay(error, 3000);
    errorInfo.severity = 'warning';
    errorInfo.message = 'Operation timed out - Server may be slow or overloaded';
    errorInfo.statusText = 'timeout';

    return errorInfo;
  }

  /**
   * Handle rate limit errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleRateLimitError(error, errorInfo) {
    errorInfo.type = 'ratelimit';
    errorInfo.category = 'throttling';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.statusCode = 429;
    errorInfo.severity = 'warning';
    errorInfo.message = 'Rate limit exceeded - Too many requests';
    errorInfo.statusText = 'rate limited';
    
    // Try to extract retry-after header
    errorInfo.retryAfter = this.extractRetryAfter(error.response) || 60000; // Default 1 minute

    return errorInfo;
  }

  /**
   * Handle parsing/format errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleParsingError(error, errorInfo) {
    errorInfo.type = 'parsing';
    errorInfo.category = 'format';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'error';
    errorInfo.message = 'Invalid response format from server';
    errorInfo.statusText = 'parse error';

    return errorInfo;
  }

  /**
   * Handle operation errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handleOperationError(error, errorInfo) {
    errorInfo.type = 'operation';
    errorInfo.category = 'business';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'warning';
    errorInfo.statusText = 'invalid operation';

    if (error.message.includes('Unknown') || error.message.includes('not supported')) {
      errorInfo.message = error.message;
    } else {
      errorInfo.message = 'Invalid operation requested';
    }

    return errorInfo;
  }

  // Utility methods

  /**
   * Calculate retry delay based on error type
   * @param {Error} error - The error
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Retry delay in milliseconds
   */
  static getRetryDelay(error, baseDelay = 1000) {
    // Exponential backoff for network errors
    if (this.isNetworkError(error)) {
      return baseDelay * 2; // Double the delay for network issues
    }
    
    // Server errors get longer delays
    const status = (error.response && error.response.status) || error.statusCode;
    if (status && status >= 500) {
      return baseDelay * 3;
    }
    
    return baseDelay;
  }

  /**
   * Extract Retry-After header value
   * @param {Object} response - HTTP response object
   * @returns {number|null} Retry delay in milliseconds
   */
  static extractRetryAfter(response) {
    if (!response || !response.headers) {
      return null;
    }
    
    const retryAfter = response.headers['retry-after'] || response.headers['Retry-After'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000; // Convert to milliseconds
      }
    }
    
    return null;
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
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key'];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error messages for display to prevent XSS attacks
   * Escapes HTML characters that could be used for XSS injection
   * @param {string} message - The error message to sanitize
   * @returns {string} HTML-escaped message safe for display
   */
  static sanitizeForDisplay(message) {
    if (!message || typeof message !== 'string') {
      return '';
    }

    // HTML escape map for preventing XSS
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
      ':': '&#x3A;'
    };

    // Replace potentially dangerous characters with HTML entities
    return message.replace(/[&<>"'`=\/:]/g, (s) => htmlEscapeMap[s]);
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
}

module.exports = ErrorHandler;