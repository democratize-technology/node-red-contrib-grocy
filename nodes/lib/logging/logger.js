/**
 * Comprehensive logging system for Grocy Node-RED integration
 * Provides structured logging, correlation IDs, and performance metrics
 * 
 * @module logger
 */

const crypto = require('crypto');
const util = require('util');

/**
 * Log levels with numeric priorities
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  AUDIT: 5  // Special level for audit trail
};

const LogLevelNames = Object.fromEntries(
  Object.entries(LogLevel).map(([key, value]) => [value, key])
);

/**
 * Sensitive field patterns to sanitize from logs
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /token/i,
  /auth/i,
  /credential/i,
  /grocy[_-]?api[_-]?key/i
];

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(obj, depth = 0) {
  if (depth > 10) return '[DEPTH_EXCEEDED]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj !== 'object') {
    // Sanitize string values that look like keys/tokens
    if (typeof obj === 'string' && obj.length > 20 && /^[A-Za-z0-9+/=\-_]+$/.test(obj)) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item, depth + 1));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if key matches sensitive patterns
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'headers' && typeof value === 'object') {
      // Special handling for headers
      sanitized[key] = sanitizeHeaders(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize HTTP headers
 */
function sanitizeHeaders(headers) {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('key') || lowerKey.includes('auth') || 
        lowerKey.includes('token') || lowerKey === 'grocy-api-key') {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Format log entry as structured JSON
 */
function formatLogEntry(entry) {
  return JSON.stringify(entry, null, 2);
}

/**
 * Main logger class with configurable options
 */
class Logger {
  constructor(options = {}) {
    this.nodeId = options.nodeId || 'unknown';
    this.nodeType = options.nodeType || 'unknown';
    this.logLevel = options.logLevel !== undefined ? options.logLevel : LogLevel.INFO;
    this.enableAudit = options.enableAudit !== false;
    this.enablePerformanceMetrics = options.enablePerformanceMetrics !== false;
    this.outputHandler = options.outputHandler || console.log;
    this.errorHandler = options.errorHandler || console.error;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      slowRequests: 0,
      requestsByEndpoint: {},
      errorsByType: {}
    };
  }
  
  /**
   * Set log level
   */
  setLogLevel(level) {
    if (typeof level === 'string') {
      this.logLevel = LogLevel[level.toUpperCase()] || LogLevel.INFO;
    } else {
      this.logLevel = level;
    }
  }
  
  /**
   * Check if should log at given level
   */
  shouldLog(level) {
    return level >= this.logLevel;
  }
  
  /**
   * Core logging method
   */
  log(level, message, data = {}, correlationId = null) {
    if (!this.shouldLog(level) && level !== LogLevel.AUDIT) {
      return;
    }
    
    const entry = {
      timestamp: new Date().toISOString(),
      level: LogLevelNames[level],
      nodeId: this.nodeId,
      nodeType: this.nodeType,
      message,
      correlationId: correlationId || data.correlationId,
      ...sanitizeData(data)
    };
    
    // Remove undefined values
    Object.keys(entry).forEach(key => {
      if (entry[key] === undefined) delete entry[key];
    });
    
    const formatted = formatLogEntry(entry);
    
    if (level >= LogLevel.ERROR) {
      this.errorHandler(formatted);
    } else {
      this.outputHandler(formatted);
    }
    
    return entry;
  }
  
  // Convenience methods
  debug(message, data, correlationId) {
    return this.log(LogLevel.DEBUG, message, data, correlationId);
  }
  
  info(message, data, correlationId) {
    return this.log(LogLevel.INFO, message, data, correlationId);
  }
  
  warn(message, data, correlationId) {
    return this.log(LogLevel.WARN, message, data, correlationId);
  }
  
  error(message, data, correlationId) {
    return this.log(LogLevel.ERROR, message, data, correlationId);
  }
  
  fatal(message, data, correlationId) {
    return this.log(LogLevel.FATAL, message, data, correlationId);
  }
  
  audit(message, data, correlationId) {
    if (!this.enableAudit) return;
    return this.log(LogLevel.AUDIT, message, data, correlationId);
  }
  
  /**
   * Log API request start
   */
  logRequest(method, endpoint, data = {}, correlationId = null) {
    const cid = correlationId || generateCorrelationId();
    
    this.metrics.totalRequests++;
    
    const logData = {
      correlationId: cid,
      method,
      endpoint,
      ...data
    };
    
    this.debug(`API Request: ${method} ${endpoint}`, logData, cid);
    
    if (this.enableAudit) {
      this.audit(`API_REQUEST`, {
        correlationId: cid,
        method,
        endpoint,
        nodeId: this.nodeId,
        timestamp: new Date().toISOString()
      }, cid);
    }
    
    return {
      correlationId: cid,
      startTime: Date.now()
    };
  }
  
  /**
   * Log API response
   */
  logResponse(requestContext, status, responseData = {}, error = null) {
    const duration = Date.now() - requestContext.startTime;
    const isSlowRequest = duration > 5000; // 5 seconds threshold
    
    // Update metrics
    if (error || status >= 400) {
      this.metrics.failedRequests++;
      const errorType = error?.code || `HTTP_${status}`;
      this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    } else {
      this.metrics.successfulRequests++;
    }
    
    this.metrics.totalDuration += duration;
    if (isSlowRequest) {
      this.metrics.slowRequests++;
    }
    
    const logData = {
      correlationId: requestContext.correlationId,
      status,
      duration: `${duration}ms`,
      isSlowRequest,
      ...responseData
    };
    
    if (error) {
      logData.error = {
        message: error.message,
        code: error.code,
        stack: this.logLevel <= LogLevel.DEBUG ? error.stack : undefined
      };
      
      this.error(`API Response Error: ${error.message}`, logData, requestContext.correlationId);
    } else if (isSlowRequest) {
      this.warn(`Slow API Response: ${duration}ms`, logData, requestContext.correlationId);
    } else {
      this.debug(`API Response: ${status}`, logData, requestContext.correlationId);
    }
    
    if (this.enableAudit) {
      this.audit(`API_RESPONSE`, {
        correlationId: requestContext.correlationId,
        status,
        duration,
        success: !error && status < 400,
        timestamp: new Date().toISOString()
      }, requestContext.correlationId);
    }
    
    return logData;
  }
  
  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, metadata = {}) {
    if (!this.enablePerformanceMetrics) return;
    
    const perfData = {
      operation,
      duration: `${duration}ms`,
      ...metadata
    };
    
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, perfData);
    } else {
      this.debug(`Performance: ${operation}`, perfData);
    }
    
    return perfData;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    const avgDuration = this.metrics.totalRequests > 0 
      ? Math.round(this.metrics.totalDuration / this.metrics.totalRequests)
      : 0;
    
    const successRate = this.metrics.totalRequests > 0
      ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      averageDuration: `${avgDuration}ms`,
      successRate: `${successRate}%`,
      slowRequestRate: this.metrics.totalRequests > 0
        ? `${((this.metrics.slowRequests / this.metrics.totalRequests) * 100).toFixed(2)}%`
        : '0%'
    };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      slowRequests: 0,
      requestsByEndpoint: {},
      errorsByType: {}
    };
  }
}

/**
 * Factory function to create logger instances
 */
function createLogger(nodeConfig, globalConfig = {}) {
  const options = {
    nodeId: nodeConfig.id || 'unknown',
    nodeType: nodeConfig.type || 'unknown',
    logLevel: nodeConfig.logLevel !== undefined 
      ? nodeConfig.logLevel 
      : globalConfig.logLevel || LogLevel.INFO,
    enableAudit: nodeConfig.enableAudit !== undefined 
      ? nodeConfig.enableAudit 
      : globalConfig.enableAudit !== false,
    enablePerformanceMetrics: nodeConfig.enablePerformanceMetrics !== undefined
      ? nodeConfig.enablePerformanceMetrics
      : globalConfig.enablePerformanceMetrics !== false
  };
  
  // Support Node-RED logging if available
  if (nodeConfig.node) {
    const node = nodeConfig.node;
    options.outputHandler = (msg) => {
      if (node.log) node.log(msg);
      else console.log(msg);
    };
    options.errorHandler = (msg) => {
      if (node.error) node.error(msg);
      else console.error(msg);
    };
  }
  
  return new Logger(options);
}

module.exports = {
  Logger,
  LogLevel,
  createLogger,
  generateCorrelationId,
  sanitizeData
};