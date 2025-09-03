/**
 * Grocy Node-RED Logging System
 * Comprehensive logging, monitoring, and audit trail for production deployments
 * 
 * @module logging
 */

const { Logger, LogLevel, createLogger, generateCorrelationId, sanitizeData } = require('./logger');
const { LoggingAPIWrapper, createRequestInterceptor, nodeRedLoggingMiddleware } = require('./request-interceptor');
const { LoggingConfigManager, getGlobalConfigManager, createNodeLoggingConfig, httpLoggingMiddleware } = require('./config-manager');

/**
 * Initialize logging system with Node-RED settings
 */
function initializeLogging(RED) {
  if (!RED || !RED.settings) {
    console.warn('Grocy Logging: Node-RED settings not available, using defaults');
    return getGlobalConfigManager({});
  }
  
  // Initialize with Node-RED settings
  const settings = RED.settings.functionGlobalContext || RED.settings;
  const manager = getGlobalConfigManager(settings);
  
  // Log initialization
  const initLogger = createLogger({
    id: 'grocy-logging-init',
    type: 'system'
  });
  
  initLogger.info('Grocy logging system initialized', {
    enabled: manager.isEnabled(),
    logLevel: manager.globalConfig.logLevel,
    auditEnabled: manager.globalConfig.enableAudit,
    performanceTracking: manager.globalConfig.enablePerformanceTracking
  });
  
  return manager;
}

/**
 * Create a logged Grocy client
 */
function createLoggedGrocyClient(grocyClient, node, config = {}) {
  const manager = getGlobalConfigManager();
  
  if (!manager.isEnabled()) {
    // Return unmodified client if logging is disabled
    return {
      client: grocyClient,
      logger: null,
      metrics: () => ({})
    };
  }
  
  // Create node-specific configuration
  const loggingConfig = createNodeLoggingConfig(node, config);
  
  // Add node to config for Node-RED integration
  loggingConfig.node = node;
  
  // Create interceptor
  const { client, logger, wrapper } = createRequestInterceptor(grocyClient, loggingConfig);
  
  // Add helper methods to node
  if (node) {
    node.logInfo = (msg, data) => logger.info(msg, data);
    node.logWarn = (msg, data) => logger.warn(msg, data);
    node.logError = (msg, data) => logger.error(msg, data);
    node.logDebug = (msg, data) => logger.debug(msg, data);
    node.logAudit = (msg, data) => logger.audit(msg, data);
    node.getLogMetrics = () => wrapper.getMetrics();
  }
  
  return {
    client,
    logger,
    metrics: () => wrapper.getMetrics()
  };
}

/**
 * Add logging to a Node-RED node
 */
function addNodeLogging(node, config = {}) {
  const manager = getGlobalConfigManager();
  
  if (!manager.isEnabled()) {
    return null;
  }
  
  // Apply logging middleware
  const logger = nodeRedLoggingMiddleware(node, config);
  
  // Add status reporting
  const originalStatus = node.status.bind(node);
  node.status = function(status) {
    if (status && logger) {
      logger.debug('Node status change', {
        fill: status.fill,
        shape: status.shape,
        text: status.text
      });
    }
    return originalStatus(status);
  };
  
  return logger;
}

/**
 * Create audit logger for security-sensitive operations
 */
function createAuditLogger(nodeId, nodeType) {
  const logger = createLogger({
    id: nodeId,
    type: nodeType,
    logLevel: LogLevel.AUDIT,
    enableAudit: true
  });
  
  return {
    logAccess: (resource, action, user = 'unknown') => {
      logger.audit('RESOURCE_ACCESS', {
        resource,
        action,
        user,
        timestamp: new Date().toISOString()
      });
    },
    
    logModification: (resource, action, before, after, user = 'unknown') => {
      logger.audit('RESOURCE_MODIFICATION', {
        resource,
        action,
        user,
        timestamp: new Date().toISOString(),
        changes: {
          before: sanitizeData(before),
          after: sanitizeData(after)
        }
      });
    },
    
    logAuthentication: (success, method, user = null, reason = null) => {
      logger.audit('AUTHENTICATION', {
        success,
        method,
        user,
        reason,
        timestamp: new Date().toISOString()
      });
    },
    
    logConfigChange: (setting, oldValue, newValue, user = 'unknown') => {
      logger.audit('CONFIG_CHANGE', {
        setting,
        user,
        timestamp: new Date().toISOString(),
        changes: {
          before: sanitizeData(oldValue),
          after: sanitizeData(newValue)
        }
      });
    }
  };
}

/**
 * Performance monitor for tracking operation metrics
 */
class PerformanceMonitor {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.operations = new Map();
  }
  
  startOperation(name, metadata = {}) {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    this.operations.set(id, {
      name,
      startTime: Date.now(),
      metadata
    });
    return id;
  }
  
  endOperation(id, success = true, result = null) {
    const operation = this.operations.get(id);
    if (!operation) return null;
    
    const duration = Date.now() - operation.startTime;
    this.operations.delete(id);
    
    const logger = createLogger({ id: this.nodeId, type: 'performance' });
    logger.logPerformance(operation.name, duration, {
      success,
      ...operation.metadata,
      result: result ? sanitizeData(result) : null
    });
    
    return { duration, success };
  }
  
  trackAsync(name, asyncFn, metadata = {}) {
    const id = this.startOperation(name, metadata);
    
    return asyncFn()
      .then(result => {
        this.endOperation(id, true, result);
        return result;
      })
      .catch(error => {
        this.endOperation(id, false, { error: error.message });
        throw error;
      });
  }
}

/**
 * Export all logging utilities
 */
module.exports = {
  // Core logging
  Logger,
  LogLevel,
  createLogger,
  generateCorrelationId,
  sanitizeData,
  
  // Request interception
  LoggingAPIWrapper,
  createRequestInterceptor,
  nodeRedLoggingMiddleware,
  
  // Configuration
  LoggingConfigManager,
  getGlobalConfigManager,
  createNodeLoggingConfig,
  httpLoggingMiddleware,
  
  // High-level functions
  initializeLogging,
  createLoggedGrocyClient,
  addNodeLogging,
  createAuditLogger,
  PerformanceMonitor,
  
  // Convenience exports
  correlationId: generateCorrelationId
};