/**
 * Network error handler for connectivity and network-related errors
 * Handles DNS resolution, connection failures, timeouts, and network issues
 */
const ErrorFormatter = require('./formatter');

class NetworkErrorHandler {
  /**
   * Handle network connectivity errors
   * @param {Error} error - The error to handle
   * @param {Object} errorInfo - Base error info
   * @returns {Object} Enhanced error info
   */
  static handle(error, errorInfo) {
    errorInfo.type = 'network';
    errorInfo.category = 'connectivity';
    errorInfo.isTemporary = true;
    errorInfo.canRetry = true;
    errorInfo.retryAfter = ErrorFormatter.getRetryDelay(error);
    errorInfo.severity = 'warning';

    // Specific network error messages
    switch (error.code) {
      case 'ECONNREFUSED':
        errorInfo.message = 'Connection refused - Grocy server may be down';
        errorInfo.statusText = 'server down';
        break;
      case 'ENOTFOUND':
        errorInfo.message = 'Host not found - Check Grocy server URL';
        errorInfo.statusText = 'host not found';
        errorInfo.isTemporary = false; // DNS issues usually aren't temporary
        errorInfo.canRetry = false;
        break;
      case 'ETIMEDOUT':
        errorInfo.message = 'Connection timeout - Grocy server not responding';
        errorInfo.statusText = 'timeout';
        break;
      case 'ECONNRESET':
        errorInfo.message = 'Connection reset - Network interruption';
        errorInfo.statusText = 'connection reset';
        break;
      case 'ENETUNREACH':
        errorInfo.message = 'Network unreachable - Check network connectivity';
        errorInfo.statusText = 'network unreachable';
        break;
      default:
        errorInfo.statusText = 'network error';
    }

    return errorInfo;
  }
}

module.exports = NetworkErrorHandler;