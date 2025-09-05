/**
 * Configuration error handler for setup and configuration errors
 * Handles missing API keys, invalid server configs, and initialization issues
 */
class ConfigErrorHandler {
  /**
   * Handle configuration errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
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
}

module.exports = ConfigErrorHandler;