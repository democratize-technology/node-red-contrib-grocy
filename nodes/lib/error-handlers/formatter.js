/**
 * Error formatting utilities for message preparation and sanitization
 * Handles message formatting, XSS protection, and display preparation
 */
class ErrorFormatter {
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
   * Calculate retry delay based on error type
   * @param {Error} error - The error
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Retry delay in milliseconds
   */
  static getRetryDelay(error, baseDelay = 1000) {
    // Import classifier to avoid circular dependency
    const ErrorClassifier = require('./classifier');
    
    // Exponential backoff for network errors
    if (ErrorClassifier.isNetworkError(error)) {
      return baseDelay * 2; // Double the delay for network issues
    }
    
    // Server errors get longer delays
    const status = (error.response && error.response.status) || error.statusCode;
    if (status && status >= 500) {
      return baseDelay * 3;
    }
    
    return baseDelay;
  }
}

module.exports = ErrorFormatter;