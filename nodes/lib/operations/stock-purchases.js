const Validators = require('../validators');
const ErrorHandler = require('../error-handler');

/**
 * Stock purchase operations - adding stock and purchase-related functionality
 */
class StockPurchaseOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Add product to stock with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains productId and data
   * @returns {Promise<Object>} Operation result
   */
  async addProductToStock(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['productId', 'data']),
      () => Validators.validateId(payload.productId, 'productId'),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateStockAdditionData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.addProductToStock(payload.productId, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product ${payload.productId} does not exist`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid stock addition data');
      }
      throw error;
    }
  }

  /**
   * Add product to stock by barcode with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains barcode and data
   * @returns {Promise<Object>} Operation result
   */
  async addProductToStockByBarcode(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['barcode', 'data']),
      () => Validators.validateBarcode(payload.barcode, { maxLength: 100 }),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateStockAdditionData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.addProductToStockByBarcode(payload.barcode, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product with barcode '${payload.barcode}' not found`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid barcode or stock addition data');
      }
      throw error;
    }
  }

  /**
   * Validate stock addition data
   * @param {Object} data - Stock addition data
   */
  validateStockAdditionData(data) {
    const requiredFields = ['amount'];
    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate amount
    if (data.amount !== undefined) {
      try {
        Validators.validateNumber(data.amount, 'amount', { min: 0 });
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate best_before_date if present
    if (data.best_before_date !== undefined && data.best_before_date !== '') {
      try {
        Validators.validateDate(data.best_before_date, 'best_before_date', { allowPast: false });
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate price if present
    if (data.price !== undefined) {
      try {
        Validators.validateNumber(data.price, 'price', { min: 0 });
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate location_id if present
    if (data.location_id !== undefined) {
      try {
        Validators.validateId(data.location_id, 'location_id');
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'addProductToStock',
      'addProductToStockByBarcode'
    ];
  }
}

module.exports = StockPurchaseOperations;