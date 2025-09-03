/**
 * Configuration manager for logging system
 * Handles Node-RED settings integration and per-node configuration
 * 
 * @module config-manager
 */

const { LogLevel } = require('./logger');

/**
 * Default logging configuration
 */
const DEFAULT_CONFIG = {
  enabled: true,
  logLevel: 'INFO',
  enableRequestLogging: true,
  enableResponseLogging: true,
  enablePerformanceTracking: true,
  enableAudit: true,
  logRequestBody: false,  // Security: don't log bodies by default
  logResponseBody: false,  // Performance: don't log response bodies by default
  performanceThresholds: {
    GET: 1000,
    POST: 2000,
    PUT: 2000,
    DELETE: 1500,
    DEFAULT: 3000
  },
  slowRequestThreshold: 5000,
  maxResponseBodyLength: 1000,
  sanitizeData: true,
  correlationIdHeader: 'X-Correlation-ID'
};

/**
 * Configuration manager for logging
 */
class LoggingConfigManager {
  constructor(globalSettings = {}) {
    // Load from Node-RED settings if available
    this.globalConfig = this._loadGlobalConfig(globalSettings);
    this.nodeConfigs = new Map();
    this.enabled = this.globalConfig.enabled;
  }
  
  /**
   * Load global configuration from Node-RED settings
   */
  _loadGlobalConfig(settings) {
    // Check for grocy-specific settings
    const grocySettings = settings.grocyLogging || settings['node-red-contrib-grocy'] || {};
    
    // Merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...grocySettings,
      performanceThresholds: {
        ...DEFAULT_CONFIG.performanceThresholds,
        ...(grocySettings.performanceThresholds || {})
      }
    };
  }
  
  /**
   * Get configuration for a specific node
   */
  getNodeConfig(nodeId, nodeType, nodeSettings = {}) {
    // Check cache
    if (this.nodeConfigs.has(nodeId)) {
      return this.nodeConfigs.get(nodeId);
    }
    
    // Build node-specific configuration
    const nodeConfig = this._buildNodeConfig(nodeId, nodeType, nodeSettings);
    
    // Cache it
    this.nodeConfigs.set(nodeId, nodeConfig);
    
    return nodeConfig;
  }
  
  /**
   * Build configuration for a specific node
   */
  _buildNodeConfig(nodeId, nodeType, nodeSettings) {
    // Start with global config
    const config = { ...this.globalConfig };
    
    // Apply node type specific overrides
    const typeOverrides = this.globalConfig.nodeTypeOverrides?.[nodeType] || {};
    Object.assign(config, typeOverrides);
    
    // Apply node-specific settings
    if (nodeSettings.logging) {
      Object.assign(config, nodeSettings.logging);
    }
    
    // Convert log level string to numeric value
    if (typeof config.logLevel === 'string') {
      config.logLevel = LogLevel[config.logLevel.toUpperCase()] || LogLevel.INFO;
    }
    
    // Add node metadata
    config.nodeId = nodeId;
    config.nodeType = nodeType;
    
    return config;
  }
  
  /**
   * Update global configuration
   */
  updateGlobalConfig(updates) {
    Object.assign(this.globalConfig, updates);
    
    // Clear node cache to force rebuild
    this.nodeConfigs.clear();
    
    // Update enabled flag
    this.enabled = this.globalConfig.enabled;
  }
  
  /**
   * Update node-specific configuration
   */
  updateNodeConfig(nodeId, updates) {
    const config = this.nodeConfigs.get(nodeId) || {};
    Object.assign(config, updates);
    this.nodeConfigs.set(nodeId, config);
  }
  
  /**
   * Enable/disable logging globally
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.globalConfig.enabled = enabled;
  }
  
  /**
   * Check if logging is enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Get performance threshold for an operation
   */
  getPerformanceThreshold(operation) {
    return this.globalConfig.performanceThresholds[operation] || 
           this.globalConfig.performanceThresholds.DEFAULT;
  }
  
  /**
   * Export current configuration
   */
  exportConfig() {
    return {
      global: { ...this.globalConfig },
      nodes: Array.from(this.nodeConfigs.entries()).map(([id, config]) => ({
        id,
        config
      }))
    };
  }
  
  /**
   * Import configuration
   */
  importConfig(configData) {
    if (configData.global) {
      this.globalConfig = { ...DEFAULT_CONFIG, ...configData.global };
    }
    
    if (configData.nodes && Array.isArray(configData.nodes)) {
      this.nodeConfigs.clear();
      configData.nodes.forEach(({ id, config }) => {
        this.nodeConfigs.set(id, config);
      });
    }
  }
  
  /**
   * Reset to defaults
   */
  reset() {
    this.globalConfig = { ...DEFAULT_CONFIG };
    this.nodeConfigs.clear();
    this.enabled = true;
  }
}

/**
 * Singleton instance for global configuration
 */
let globalConfigManager = null;

/**
 * Get or create global configuration manager
 */
function getGlobalConfigManager(settings = {}) {
  if (!globalConfigManager) {
    globalConfigManager = new LoggingConfigManager(settings);
  }
  return globalConfigManager;
}

/**
 * Helper to create node-specific configuration
 */
function createNodeLoggingConfig(node, config, globalSettings = {}) {
  const manager = getGlobalConfigManager(globalSettings);
  
  // Get node configuration
  const nodeConfig = manager.getNodeConfig(
    node.id,
    node.type,
    config
  );
  
  // Add convenience flag for checking if logging is enabled
  nodeConfig.isLoggingEnabled = () => manager.isEnabled() && nodeConfig.enabled;
  
  return nodeConfig;
}

/**
 * Express/Connect middleware for logging HTTP requests
 */
function httpLoggingMiddleware(logger) {
  return (req, res, next) => {
    // Skip if logging is disabled
    const manager = getGlobalConfigManager();
    if (!manager.isEnabled()) {
      return next();
    }
    
    // Generate correlation ID
    const correlationId = req.headers[manager.globalConfig.correlationIdHeader] || 
                         require('./logger').generateCorrelationId();
    
    // Attach to request
    req.correlationId = correlationId;
    
    // Log request
    const requestContext = logger.logRequest(
      req.method,
      req.path,
      {
        query: req.query,
        headers: req.headers,
        ip: req.ip
      },
      correlationId
    );
    
    // Capture response
    const originalSend = res.send;
    const originalJson = res.json;
    const startTime = Date.now();
    
    // Wrap response methods
    res.send = function(data) {
      res.send = originalSend;
      res.send(data);
      
      // Log response
      logger.logResponse(
        requestContext,
        res.statusCode,
        {
          duration: Date.now() - startTime,
          contentType: res.get('Content-Type'),
          contentLength: res.get('Content-Length')
        }
      );
    };
    
    res.json = function(data) {
      res.json = originalJson;
      res.json(data);
      
      // Log response
      logger.logResponse(
        requestContext,
        res.statusCode,
        {
          duration: Date.now() - startTime,
          contentType: 'application/json',
          hasData: data !== null && data !== undefined
        }
      );
    };
    
    next();
  };
}

module.exports = {
  LoggingConfigManager,
  getGlobalConfigManager,
  createNodeLoggingConfig,
  httpLoggingMiddleware,
  DEFAULT_CONFIG
};