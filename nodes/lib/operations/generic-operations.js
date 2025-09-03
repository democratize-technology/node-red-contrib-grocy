const EntityOperations = require('./entity-operations');
const FileOperations = require('./file-operations');
const SystemOperations = require('./system-operations');
const SettingsOperations = require('./settings-operations');

/**
 * Generic entity and system operations - now coordinates between specialized modules
 */
class GenericOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
    
    // Initialize specialized operation modules
    this.entities = new EntityOperations(client);
    this.files = new FileOperations(client);
    this.system = new SystemOperations(client);
    this.settings = new SettingsOperations(client);
    
    // Build operation mapping to modules
    this.operationModuleMap = this.buildOperationModuleMap();
  }

  /**
   * Build a mapping of operations to their specialized modules
   * @returns {Map} Operation to module mapping
   */
  buildOperationModuleMap() {
    const map = new Map();
    
    // Entity operations
    this.entities.getSupportedOperations().forEach(op => {
      map.set(op, this.entities);
    });
    
    // File operations
    this.files.getSupportedOperations().forEach(op => {
      map.set(op, this.files);
    });
    
    // System operations
    this.system.getSupportedOperations().forEach(op => {
      map.set(op, this.system);
    });
    
    // Settings operations
    this.settings.getSupportedOperations().forEach(op => {
      map.set(op, this.settings);
    });
    
    return map;
  }

  /**
   * Execute a generic operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}, entityType = null) {
    // Get the appropriate module for this operation
    const operationModule = this.operationModuleMap.get(operation);
    if (!operationModule) {
      throw new Error(`Unknown generic operation: ${operation}`);
    }

    // Execute operation using the appropriate module
    // For entity operations, pass the entityType parameter
    if (this.entities.getSupportedOperations().includes(operation)) {
      return await operationModule[operation](payload, entityType);
    } else if (this.files.getSupportedOperations().includes(operation)) {
      return await operationModule[operation](payload);
    } else if (this.system.getSupportedOperations().includes(operation)) {
      return await operationModule[operation](payload);
    } else if (this.settings.getSupportedOperations().includes(operation)) {
      return await operationModule[operation](payload);
    }
    
    // Fallback - shouldn't reach here
    throw new Error(`Unknown generic operation: ${operation}`);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    // Collect operations from all specialized modules
    const allOperations = [];
    
    allOperations.push(...this.entities.getSupportedOperations());
    allOperations.push(...this.files.getSupportedOperations());
    allOperations.push(...this.system.getSupportedOperations());
    allOperations.push(...this.settings.getSupportedOperations());
    
    return allOperations;
  }
}

module.exports = GenericOperations;