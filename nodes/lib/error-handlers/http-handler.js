/**
 * HTTP error handler for HTTP status codes and API response errors
 * Handles server errors, client errors, and response parsing
 */
const ErrorFormatter = require('./formatter');

class HttpErrorHandler {
  /**
   * Handle HTTP response errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
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
      errorInfo.retryAfter = ErrorFormatter.getRetryDelay(error, 5000); // 5 second base delay
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
          errorInfo.retryAfter = ErrorFormatter.extractRetryAfter(response);
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
}

module.exports = HttpErrorHandler;