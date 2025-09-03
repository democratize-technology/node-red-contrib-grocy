const ErrorHandler = require('./error-handler');

/**
 * Timeout and retry handling for Grocy operations
 * Provides configurable timeout, retry logic with exponential backoff,
 * and circuit breaker pattern to handle cascading failures
 */
class TimeoutHandler {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffFactor = options.backoffFactor || 2;
    
    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000 // 1 minute
    };
  }

  /**
   * Execute operation with timeout and retry logic
   * @param {Function} operation - The async operation to execute
   * @param {Object} context - Operation context for logging
   * @param {Object} options - Execution options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, context = {}, options = {}) {
    const {
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
      retryCondition = this.defaultRetryCondition.bind(this),
      onRetry = null
    } = options;

    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (this.shouldAttemptRecovery()) {
        this.circuitBreaker.state = 'HALF_OPEN';
      } else {
        throw ErrorHandler.configError('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    let lastError;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const result = await this.executeWithTimeout(operation, timeout, context);
        
        // Success - reset circuit breaker
        if (this.circuitBreaker.state === 'HALF_OPEN') {
          this.circuitBreaker.state = 'CLOSED';
          this.circuitBreaker.failures = 0;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        this.recordFailure(error);
        
        // Check if we should retry
        if (attempt >= retries || !retryCondition(error, attempt)) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(error, attempt + 1, delay);
        }

        // Wait before retry
        await this.delay(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Execute operation with timeout
   * @param {Function} operation - The async operation
   * @param {number} timeout - Timeout in milliseconds
   * @param {Object} context - Operation context
   * @returns {Promise<*>} Operation result
   */
  async executeWithTimeout(operation, timeout, context) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(ErrorHandler.timeoutError(context.operation || 'unknown', timeout));
      }, timeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Default retry condition
   * @param {Error} error - The error that occurred
   * @param {number} attempt - Current attempt number
   * @returns {boolean} True if should retry
   */
  defaultRetryCondition(error, attempt) {
    // Don't retry certain error types
    if (ErrorHandler.isValidationError(error) || 
        ErrorHandler.isAuthError(error) ||
        ErrorHandler.isConfigError(error)) {
      return false;
    }

    // Don't retry 4xx errors (except 429 - rate limit)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      return false;
    }

    // Retry network errors, timeouts, 5xx errors, and rate limits
    return ErrorHandler.isNetworkError(error) ||
           ErrorHandler.isTimeoutError(error) ||
           ErrorHandler.isRateLimitError(error) ||
           (error.statusCode && error.statusCode >= 500);
  }

  /**
   * Calculate delay for retry attempt
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(this.backoffFactor, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);
    
    return Math.floor(delay);
  }

  /**
   * Record operation failure for circuit breaker
   * @param {Error} error - The error that occurred
   */
  recordFailure(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Open circuit breaker if failure threshold reached
    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
    }
  }

  /**
   * Check if circuit breaker should attempt recovery
   * @returns {boolean} True if should attempt recovery
   */
  shouldAttemptRecovery() {
    const now = Date.now();
    return (now - this.circuitBreaker.lastFailureTime) >= this.circuitBreaker.recoveryTimeout;
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      isHealthy: this.circuitBreaker.state === 'CLOSED'
    };
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  resetCircuitBreaker() {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailureTime = null;
  }

  /**
   * Create a rate limiter for API calls
   * @param {number} requestsPerSecond - Maximum requests per second
   * @returns {Function} Rate limiter function
   */
  createRateLimiter(requestsPerSecond = 10) {
    const queue = [];
    const interval = 1000 / requestsPerSecond; // milliseconds between requests
    let lastRequestTime = 0;

    return async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < interval) {
        const delayNeeded = interval - timeSinceLastRequest;
        await this.delay(delayNeeded);
      }
      
      lastRequestTime = Date.now();
    };
  }

  /**
   * Create timeout wrapper for promises
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} operation - Operation name for error messages
   * @returns {Function} Timeout wrapper function
   */
  createTimeoutWrapper(timeout, operation = 'operation') {
    return (promise) => {
      return this.executeWithTimeout(() => promise, timeout, { operation });
    };
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create abort controller with timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Object} Object with controller and timeout handler
   */
  createAbortController(timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    return {
      controller,
      signal: controller.signal,
      clearTimeout: () => clearTimeout(timeoutId)
    };
  }

  /**
   * Batch operations with concurrency limit
   * @param {Array} operations - Array of operation functions
   * @param {Object} options - Batch options
   * @returns {Promise<Array>} Array of results
   */
  async batchExecute(operations, options = {}) {
    const {
      concurrency = 5,
      failFast = false,
      timeout = this.defaultTimeout,
      onProgress = null
    } = options;

    const results = [];
    const errors = [];
    let completed = 0;

    // Execute operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchPromises = batch.map(async (operation, index) => {
        try {
          const result = await this.executeWithTimeout(
            operation, 
            timeout, 
            { operation: `batch_${i + index}` }
          );
          results[i + index] = result;
          completed++;
          
          if (onProgress) {
            onProgress(completed, operations.length, null);
          }
          
          return result;
        } catch (error) {
          errors[i + index] = error;
          completed++;
          
          if (onProgress) {
            onProgress(completed, operations.length, error);
          }
          
          if (failFast) {
            throw error;
          }
          
          return null;
        }
      });

      await Promise.all(batchPromises);
    }

    return {
      results,
      errors,
      successCount: results.filter(r => r !== undefined).length,
      errorCount: errors.filter(e => e !== undefined).length
    };
  }
}

module.exports = TimeoutHandler;