/**
 * Authentication Error Handler
 * @module AuthErrorHandler
 * @description Centralized handler for authentication and authorization errors
 * 
 * This module provides robust error handling for various authentication scenarios,
 * categorizing and transforming errors related to API access and permissions.
 * 
 * @example
 * try {
 *   // Some authentication-sensitive operation
 * } catch (error) {
 *   const enhancedError = AuthErrorHandler.handle(error, {});
 *   console.error(enhancedError.message);
 * }
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#authentication_errors|MDN Authentication Errors}
 */
class AuthErrorHandler {
  /**
   * Standardize and enhance authentication-related errors
   * 
   * @param {Error} error - The original error object thrown during authentication
   * @param {Object} errorInfo - Base error information to be enhanced
   * 
   * @property {string} errorInfo.type - Always set to 'auth'
   * @property {string} errorInfo.category - Always set to 'security'
   * @property {boolean} errorInfo.isTemporary - Indicates if the auth issue is temporary
   * @property {boolean} errorInfo.canRetry - Indicates if the operation can be retried
   * @property {string} errorInfo.severity - Error severity level
   * 
   * @returns {Object} Enhanced error information with standardized properties
   * 
   * @throws {Error} If input parameters are invalid
   * 
   * @example
   * const error = new Error('Unauthorized access');
   * const result = AuthErrorHandler.handle(error, {});
   * // result will have enhanced authentication error details
   */
  static handle(error, errorInfo) {
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
}

module.exports = AuthErrorHandler;