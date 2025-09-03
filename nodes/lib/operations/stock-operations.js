const Validators = require('../validators');
const ErrorHandler = require('../error-handler');
const StockInventoryOperations = require('./stock-inventory');
const StockConsumptionOperations = require('./stock-consumption');
const StockPurchaseOperations = require('./stock-purchases');
const StockTransferOperations = require('./stock-transfers');

/**
 * Stock management operations with comprehensive error handling
 * and input validation - now coordinates between specialized modules
 */
class StockOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
    
    // Initialize specialized operation modules
    this.inventory = new StockInventoryOperations(client);
    this.consumption = new StockConsumptionOperations(client);
    this.purchases = new StockPurchaseOperations(client);
    this.transfers = new StockTransferOperations(client);
    
    // Build operation mapping to modules
    this.operationModuleMap = this.buildOperationModuleMap();
  }

  /**
   * Build a mapping of operations to their specialized modules
   * @returns {Map} Operation to module mapping
   */
  buildOperationModuleMap() {
    const map = new Map();
    
    // Inventory operations
    this.inventory.getSupportedOperations().forEach(op => {
      map.set(op, this.inventory);
    });
    
    // Consumption operations
    this.consumption.getSupportedOperations().forEach(op => {
      map.set(op, this.consumption);
    });
    
    // Purchase operations
    this.purchases.getSupportedOperations().forEach(op => {
      map.set(op, this.purchases);
    });
    
    // Transfer operations
    this.transfers.getSupportedOperations().forEach(op => {
      map.set(op, this.transfers);
    });
    
    return map;
  }

  /**
   * Execute a stock operation with comprehensive error handling
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}) {
    // Validate operation
    Validators.validateOperation(operation, this.getSupportedOperations());
    
    // Get the appropriate module for this operation
    const operationModule = this.operationModuleMap.get(operation);
    if (!operationModule) {
      throw ErrorHandler.operationError(operation);
    }
    
    // Sanitize payload for logging
    const sanitizedPayload = ErrorHandler.sanitizePayload(payload);
    const context = {
      operation,
      sanitizedPayload,
      timestamp: new Date().toISOString()
    };

    // Execute operation with timeout and retry using the appropriate module
    return await this.client.executeOperation(
      async (api) => {
        return await operationModule[operation](api, payload);
      },
      context,
      options
    );
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    // Collect operations from all specialized modules
    const allOperations = [];
    
    allOperations.push(...this.inventory.getSupportedOperations());
    allOperations.push(...this.consumption.getSupportedOperations());
    allOperations.push(...this.purchases.getSupportedOperations());
    allOperations.push(...this.transfers.getSupportedOperations());
    
    return allOperations;
  }
}

module.exports = StockOperations;