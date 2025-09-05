/**
 * Timeout error handler for operation timeouts
 * Handles request timeouts and slow server responses
 */
const ErrorFormatter = require('./formatter');

class TimeoutErrorHandler {
  /**
   * Handle timeout errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
    errorInfo.type = 'timeout';
    errorInfo.category = 'performance';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.retryAfter = ErrorFormatter.getRetryDelay(error, 3000);
    errorInfo.severity = 'warning';
    errorInfo.message = 'Operation timed out - Server may be slow or overloaded';
    errorInfo.statusText = 'timeout';

    return errorInfo;
  }
}

module.exports = TimeoutErrorHandler;