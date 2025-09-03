const Validators = require('../validators');

/**
 * Product management operations
 */
class ProductOperations {
  constructor(client) {
    this.api = client.getAPI();
  }

  /**
   * Execute a product operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}) {
    switch (operation) {
      case 'getProductDetails':
        return await this.getProductDetails(payload);
      
      case 'getProductByBarcode':
        return await this.getProductByBarcode(payload);
      
      default:
        throw new Error(`Unknown product operation: ${operation}`);
    }
  }

  /**
   * Get product details
   * @param {Object} payload - Contains productId
   * @returns {Promise<Object>} Product details
   */
  async getProductDetails(payload) {
    Validators.validateRequired(payload, ['productId']);
    Validators.validateId(payload.productId, 'productId');
    
    return await this.api.getProductDetails(payload.productId);
  }

  /**
   * Get product by barcode
   * @param {Object} payload - Contains barcode
   * @returns {Promise<Object>} Product information
   */
  async getProductByBarcode(payload) {
    Validators.validateRequired(payload, ['barcode']);
    Validators.validateBarcode(payload.barcode);
    
    return await this.api.getProductByBarcode(payload.barcode);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getProductDetails',
      'getProductByBarcode'
    ];
  }
}

module.exports = ProductOperations;