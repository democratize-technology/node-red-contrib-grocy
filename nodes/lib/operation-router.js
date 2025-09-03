const StockOperations = require('./operations/stock-operations');
const ProductOperations = require('./operations/product-operations');
const ShoppingListOperations = require('./operations/shopping-list-operations');
const TaskChoreOperations = require('./operations/task-chore-operations');
const BatteryOperations = require('./operations/battery-operations');
const GenericOperations = require('./operations/generic-operations');

/**
 * Routes operations to appropriate operation handlers
 */
class OperationRouter {
  constructor(client) {
    this.stock = new StockOperations(client);
    this.product = new ProductOperations(client);
    this.shoppingList = new ShoppingListOperations(client);
    this.taskChore = new TaskChoreOperations(client);
    this.battery = new BatteryOperations(client);
    this.generic = new GenericOperations(client);
    
    // Build operation mapping
    this.operationMap = this.buildOperationMap();
  }

  /**
   * Build a mapping of operations to their handlers
   * @returns {Map} Operation to handler mapping
   */
  buildOperationMap() {
    const map = new Map();
    
    // Stock operations
    this.stock.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.stock, category: 'stock' });
    });
    
    // Product operations
    this.product.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.product, category: 'product' });
    });
    
    // Shopping list operations
    this.shoppingList.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.shoppingList, category: 'shopping-list' });
    });
    
    // Task/Chore operations
    this.taskChore.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.taskChore, category: 'task-chore' });
    });
    
    // Battery operations
    this.battery.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.battery, category: 'battery' });
    });
    
    // Generic operations
    this.generic.getSupportedOperations().forEach(op => {
      map.set(op, { handler: this.generic, category: 'generic' });
    });
    
    return map;
  }

  /**
   * Execute an operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload = {}, options = {}, entityType = null) {
    const operationInfo = this.operationMap.get(operation);
    
    if (!operationInfo) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    
    const { handler, category } = operationInfo;
    
    // For generic operations, pass the entity type
    if (category === 'generic') {
      return await handler.execute(operation, payload, options, entityType);
    } else {
      return await handler.execute(operation, payload, options);
    }
  }

  /**
   * Check if an operation is supported
   * @param {string} operation - The operation name
   * @returns {boolean} True if operation is supported
   */
  isSupported(operation) {
    return this.operationMap.has(operation);
  }

  /**
   * Get operation category
   * @param {string} operation - The operation name
   * @returns {string|null} Operation category or null if not found
   */
  getOperationCategory(operation) {
    const operationInfo = this.operationMap.get(operation);
    return operationInfo ? operationInfo.category : null;
  }

  /**
   * Get all supported operations
   * @returns {Array<string>} List of all supported operations
   */
  getAllSupportedOperations() {
    return Array.from(this.operationMap.keys());
  }

  /**
   * Get operations by category
   * @param {string} category - The category name
   * @returns {Array<string>} List of operations in the category
   */
  getOperationsByCategory(category) {
    const operations = [];
    for (const [operation, info] of this.operationMap.entries()) {
      if (info.category === category) {
        operations.push(operation);
      }
    }
    return operations;
  }

  /**
   * Get operation statistics
   * @returns {Object} Statistics about operations
   */
  getStatistics() {
    const stats = {
      total: this.operationMap.size,
      byCategory: {}
    };
    
    for (const info of this.operationMap.values()) {
      const category = info.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
    
    return stats;
  }
}

module.exports = OperationRouter;