/**
 * Validation error handler for input validation and parameter errors
 * Handles missing required fields, invalid formats, and constraint violations
 */
class ValidationErrorHandler {
  /**
   * Handle validation errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
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
}

module.exports = ValidationErrorHandler;