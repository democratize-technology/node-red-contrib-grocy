/**
 * Parsing error handler for JSON and format errors
 * Handles invalid response formats and parsing failures
 */
class ParsingErrorHandler {
  /**
   * Handle parsing/format errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
    errorInfo.type = 'parsing';
    errorInfo.category = 'format';
    errorInfo.isTemporary = false;
    errorInfo.canRetry = false;
    errorInfo.severity = 'error';
    errorInfo.message = 'Invalid response format from server';
    errorInfo.statusText = 'parse error';

    return errorInfo;
  }
}

module.exports = ParsingErrorHandler;