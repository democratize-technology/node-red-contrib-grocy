/**
 * Operation error handler for business logic and operation errors
 * Handles invalid operations and unsupported requests
 */
class OperationErrorHandler {
  /**
   * Handle operation errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
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
}

module.exports = OperationErrorHandler;