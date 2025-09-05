/**
 * Rate limit error handler for throttling and rate limiting
 * Handles too many requests and quota exceeded errors
 */
const ErrorFormatter = require('./formatter');

class RateLimitErrorHandler {
  /**
   * Handle rate limit errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
    errorInfo.type = 'ratelimit';
    errorInfo.category = 'throttling';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.statusCode = 429;
    errorInfo.severity = 'warning';
    errorInfo.message = 'Rate limit exceeded - Too many requests';
    errorInfo.statusText = 'rate limited';
    
    // Try to extract retry-after header
    errorInfo.retryAfter = ErrorFormatter.extractRetryAfter(error.response) || 60000; // Default 1 minute

    return errorInfo;
  }
}

module.exports = RateLimitErrorHandler;