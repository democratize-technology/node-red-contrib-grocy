const BaseGrocyNode = require('./base-node');
const Validators = require('./validators');

/**
 * Specialized node class that handles operation execution
 * Extends BaseGrocyNode with operation-specific functionality
 */
class SpecializedGrocyNode extends BaseGrocyNode {
  constructor(RED, node, config, OperationHandler) {
    super(RED, node, config);
    this.OperationHandler = OperationHandler;
    this.operationHandler = null;
  }

  /**
   * Initialize the specialized node
   */
  initialize() {
    // Call parent initialization
    super.initialize();
    
    if (this.client) {
      // Initialize operation handler
      this.operationHandler = new this.OperationHandler(this.client);
    }
  }

  /**
   * Process incoming message by delegating to operation handler
   * @param {Object} msg - The message object
   * @returns {Promise<*>} The result
   */
  async processMessage(msg) {
    if (!this.operationHandler) {
      throw this.createError('Operation handler not initialized', 'initialization');
    }

    // Get operation, payload, and options
    const operation = this.getOperation(msg);
    const payload = this.getPayload(msg);
    const options = this.getOptions(msg);

    // Validate operation is specified
    if (!operation) {
      throw this.createError('No operation specified', 'validation');
    }

    this.debug('Processing operation', { operation, payload, options });

    // Execute operation through handler
    return await this.operationHandler.execute(operation, payload, options);
  }

  /**
   * Get supported operations for this node
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return this.OperationHandler.getSupportedOperations();
  }
}

module.exports = SpecializedGrocyNode;