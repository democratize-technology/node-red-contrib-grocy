/**
 * Request interceptor middleware for comprehensive API call logging
 * Wraps Grocy API calls with logging, correlation tracking, and performance monitoring
 * 
 * @module request-interceptor
 */

const { createLogger, generateCorrelationId } = require('./logger');

/**
 * Performance thresholds for different operation types (in ms)
 */
const PERFORMANCE_THRESHOLDS = {
  GET: 1000,
  POST: 2000,
  PUT: 2000,
  DELETE: 1500,
  DEFAULT: 3000
};

/**
 * Create an intercepted API wrapper with logging
 */
class LoggingAPIWrapper {
  constructor(originalAPI, logger, options = {}) {
    this.api = originalAPI;
    this.logger = logger;
    this.enableRequestLogging = options.enableRequestLogging !== false;
    this.enableResponseLogging = options.enableResponseLogging !== false;
    this.enablePerformanceTracking = options.enablePerformanceTracking !== false;
    this.logRequestBody = options.logRequestBody === true; // Default false for security
    this.logResponseBody = options.logResponseBody === true; // Default false for size
    this.performanceThresholds = { ...PERFORMANCE_THRESHOLDS, ...options.performanceThresholds };
    
    // Wrap all API methods
    this._wrapAPIMethods();
  }
  
  /**
   * Wrap all methods of the API object with logging
   */
  _wrapAPIMethods() {
    const methodsToWrap = Object.getOwnPropertyNames(Object.getPrototypeOf(this.api))
      .filter(prop => typeof this.api[prop] === 'function' && prop !== 'constructor');
    
    methodsToWrap.forEach(methodName => {
      const originalMethod = this.api[methodName].bind(this.api);
      
      // Create wrapped version
      this[methodName] = this._createWrappedMethod(methodName, originalMethod);
    });
    
    // Also wrap the direct properties
    Object.keys(this.api).forEach(prop => {
      if (!(prop in this) && typeof this.api[prop] !== 'function') {
        this[prop] = this.api[prop];
      }
    });
  }
  
  /**
   * Create a wrapped method with logging
   */
  _createWrappedMethod(methodName, originalMethod) {
    return async (...args) => {
      const correlationId = generateCorrelationId();
      const startTime = Date.now();
      
      // Prepare request context
      const requestContext = {
        correlationId,
        methodName,
        startTime,
        args: this.logRequestBody ? args : `[${args.length} arguments]`
      };
      
      // Log request start
      if (this.enableRequestLogging) {
        this.logger.logRequest(
          this._inferHttpMethod(methodName),
          methodName,
          {
            argumentCount: args.length,
            arguments: this.logRequestBody ? args : undefined
          },
          correlationId
        );
      }
      
      try {
        // Execute original method
        const result = await originalMethod(...args);
        
        // Calculate duration
        const duration = Date.now() - startTime;
        
        // Log successful response
        if (this.enableResponseLogging) {
          const responseData = {
            success: true,
            duration: `${duration}ms`,
            hasResult: result !== undefined && result !== null
          };
          
          if (this.logResponseBody && result !== undefined) {
            // Limit response body size in logs
            const resultStr = JSON.stringify(result);
            if (resultStr.length > 1000) {
              responseData.resultSummary = `${resultStr.substring(0, 1000)}...[truncated]`;
              responseData.resultSize = resultStr.length;
            } else {
              responseData.result = result;
            }
          }
          
          this.logger.logResponse(requestContext, 200, responseData);
        }
        
        // Track performance
        if (this.enablePerformanceTracking) {
          this._trackPerformance(methodName, duration, true);
        }
        
        return result;
        
      } catch (error) {
        // Calculate duration even for errors
        const duration = Date.now() - startTime;
        
        // Enhanced error logging
        if (this.enableResponseLogging) {
          const errorData = {
            success: false,
            duration: `${duration}ms`,
            errorType: error.constructor.name,
            errorCode: error.code,
            errorMessage: error.message
          };
          
          // Add additional context for specific error types
          if (error.response) {
            errorData.httpStatus = error.response.status;
            errorData.httpStatusText = error.response.statusText;
          }
          
          if (error.config) {
            errorData.requestUrl = error.config.url;
            errorData.requestMethod = error.config.method;
          }
          
          this.logger.logResponse(requestContext, error.response?.status || 500, errorData, error);
        }
        
        // Track performance for failed requests too
        if (this.enablePerformanceTracking) {
          this._trackPerformance(methodName, duration, false, error.code);
        }
        
        // Re-throw the error
        throw error;
      }
    };
  }
  
  /**
   * Track performance metrics
   */
  _trackPerformance(methodName, duration, success, errorCode = null) {
    const httpMethod = this._inferHttpMethod(methodName);
    const threshold = this.performanceThresholds[httpMethod] || this.performanceThresholds.DEFAULT;
    
    const perfData = {
      method: methodName,
      httpMethod,
      duration,
      success,
      threshold,
      isSlowRequest: duration > threshold
    };
    
    if (errorCode) {
      perfData.errorCode = errorCode;
    }
    
    if (duration > threshold) {
      this.logger.warn(`Slow API call detected: ${methodName}`, perfData);
    }
    
    this.logger.logPerformance(`API.${methodName}`, duration, perfData);
  }
  
  /**
   * Infer HTTP method from method name
   */
  _inferHttpMethod(methodName) {
    const lowerMethod = methodName.toLowerCase();
    
    if (lowerMethod.startsWith('get') || lowerMethod.startsWith('fetch') || 
        lowerMethod.startsWith('list') || lowerMethod.startsWith('search')) {
      return 'GET';
    } else if (lowerMethod.startsWith('create') || lowerMethod.startsWith('add') || 
               lowerMethod.startsWith('post')) {
      return 'POST';
    } else if (lowerMethod.startsWith('update') || lowerMethod.startsWith('edit') || 
               lowerMethod.startsWith('put') || lowerMethod.startsWith('patch')) {
      return 'PUT';
    } else if (lowerMethod.startsWith('delete') || lowerMethod.startsWith('remove')) {
      return 'DELETE';
    } else if (lowerMethod === 'request') {
      return 'REQUEST'; // Generic request method
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * Get direct access to underlying API (bypass logging)
   */
  getUnwrappedAPI() {
    return this.api;
  }
  
  /**
   * Get current metrics from logger
   */
  getMetrics() {
    return this.logger.getMetrics();
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.logger.resetMetrics();
  }
}

/**
 * Create request interceptor for Grocy Client
 */
function createRequestInterceptor(grocyClient, loggerConfig = {}) {
  // Create logger for this client
  const logger = createLogger({
    id: loggerConfig.nodeId || 'grocy-client',
    type: loggerConfig.nodeType || 'grocy-api',
    node: loggerConfig.node,
    ...loggerConfig
  });
  
  // Get the API instance from client
  const api = grocyClient.getAPI ? grocyClient.getAPI() : grocyClient.api;
  
  if (!api) {
    throw new Error('Unable to get API instance from Grocy client');
  }
  
  // Create wrapped API
  const wrappedAPI = new LoggingAPIWrapper(api, logger, loggerConfig);
  
  // Replace the API in the client
  if (grocyClient.api) {
    grocyClient.api = wrappedAPI;
  }
  
  // Return wrapped client
  return {
    client: grocyClient,
    logger: logger,
    wrapper: wrappedAPI
  };
}

/**
 * Middleware for Node-RED nodes
 */
function nodeRedLoggingMiddleware(node, config) {
  const loggerConfig = {
    nodeId: node.id,
    nodeType: node.type,
    node: node,
    enableRequestLogging: config.enableRequestLogging !== false,
    enableResponseLogging: config.enableResponseLogging !== false,
    enablePerformanceTracking: config.enablePerformanceTracking !== false,
    logRequestBody: config.logRequestBody === true,
    logResponseBody: config.logResponseBody === true,
    logLevel: config.logLevel || 'INFO'
  };
  
  // Store original send method
  const originalSend = node.send.bind(node);
  
  // Create logger
  const logger = createLogger(loggerConfig);
  
  // Wrap node.send to log outputs
  node.send = function(msg) {
    if (msg && msg.payload !== undefined) {
      logger.debug('Node output', {
        hasPayload: true,
        payloadType: typeof msg.payload,
        topic: msg.topic,
        correlationId: msg._correlationId
      });
    }
    return originalSend(msg);
  };
  
  // Add logging methods to node
  node.logRequest = (method, endpoint, data) => {
    return logger.logRequest(method, endpoint, data);
  };
  
  node.logResponse = (requestContext, status, data, error) => {
    return logger.logResponse(requestContext, status, data, error);
  };
  
  node.logPerformance = (operation, duration, metadata) => {
    return logger.logPerformance(operation, duration, metadata);
  };
  
  node.getLogMetrics = () => logger.getMetrics();
  
  return logger;
}

module.exports = {
  LoggingAPIWrapper,
  createRequestInterceptor,
  nodeRedLoggingMiddleware,
  PERFORMANCE_THRESHOLDS
};