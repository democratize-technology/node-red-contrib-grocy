const Validators = require('../validators');

/**
 * Handler for stock-related operations
 */
class StockOperations {
  constructor(client) {
    this.client = client;
  }

  /**
   * Execute a stock operation
   * @param {string} operation - The operation to execute
   * @param {Object} payload - The payload data
   * @param {Object} options - Additional options
   * @returns {Promise<*>} The operation result
   */
  async execute(operation, payload, options = {}) {
    Validators.validateOperation(operation);
    const data = payload || {};

    switch (operation) {
      case 'getStock':
        return await this.client.api.getStock();

      case 'getVolatileStock':
        return await this.client.api.getVolatileStock(data.dueSoonDays);

      case 'getProductDetails':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.getProductDetails(data.productId);

      case 'getProductByBarcode':
        Validators.validateBarcode(data.barcode);
        return await this.client.api.getProductByBarcode(data.barcode);

      case 'addProductToStock':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.addProductToStock(data.productId, data.data || {});

      case 'addProductToStockByBarcode':
        Validators.validateBarcode(data.barcode);
        return await this.client.api.addProductToStockByBarcode(data.barcode, data.data || {});

      case 'consumeProduct':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.consumeProduct(data.productId, data.data || {});

      case 'consumeProductByBarcode':
        Validators.validateBarcode(data.barcode);
        return await this.client.api.consumeProductByBarcode(data.barcode, data.data || {});

      case 'inventoryProduct':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.inventoryProduct(data.productId, data.data || {});

      case 'transferProduct':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.transferProduct(data.productId, data.data || {});

      case 'openProduct':
        Validators.validateId(data.productId, 'productId');
        return await this.client.api.openProduct(data.productId, data.data || {});

      default:
        throw new Error(`Invalid stock operation: ${operation}`);
    }
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  static getSupportedOperations() {
    return [
      'getStock',
      'getVolatileStock',
      'getProductDetails',
      'getProductByBarcode',
      'addProductToStock',
      'addProductToStockByBarcode',
      'consumeProduct',
      'consumeProductByBarcode',
      'inventoryProduct',
      'transferProduct',
      'openProduct'
    ];
  }
}

module.exports = StockOperations;