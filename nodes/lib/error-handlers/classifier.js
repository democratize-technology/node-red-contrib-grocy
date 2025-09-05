/**
 * Error classification utilities for identifying error types
 * Provides pure functions for classifying errors into specific categories
 */
class ErrorClassifier {
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

  /**
   * Check if error has HTTP response data
   * @param {Error} error - The error to check
   * @returns {boolean} True if HTTP error
   */
  static isHttpError(error) {
    return !!(error && error.response);
  }
}

module.exports = ErrorClassifier;