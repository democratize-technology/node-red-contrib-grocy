const Validators = require('../validators');
const ErrorHandler = require('../error-handler');

/**
 * Stock consumption operations - consuming and opening products
 */
class StockConsumptionOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Consume product from stock with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains productId and data
   * @returns {Promise<Object>} Operation result
   */
  async consumeProduct(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['productId', 'data']),
      () => Validators.validateId(payload.productId, 'productId'),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateStockConsumptionData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.consumeProduct(payload.productId, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product ${payload.productId} does not exist`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid consumption data or insufficient stock');
      }
      throw error;
    }
  }

  /**
   * Consume product by barcode with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains barcode and data
   * @returns {Promise<Object>} Operation result
   */
  async consumeProductByBarcode(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['barcode', 'data']),
      () => Validators.validateBarcode(payload.barcode, { maxLength: 100 }),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateStockConsumptionData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.consumeProductByBarcode(payload.barcode, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product with barcode '${payload.barcode}' not found`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid barcode or consumption data');
      }
      throw error;
    }
  }

  /**
   * Open product (mark as opened/started) with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains productId and optional data
   * @returns {Promise<Object>} Operation result
   */
  async openProduct(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['productId']),
      () => Validators.validateId(payload.productId, 'productId')
    ]);

    // Validate data if provided
    if (payload.data) {
      errors.push(...Validators.collectErrors([
        () => Validators.validateData(payload.data),
        () => this.validateOpenProductData(payload.data)
      ]));
    }

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    const data = payload.data || {};
    
    try {
      return await api.openProduct(payload.productId, data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product ${payload.productId} does not exist`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Product cannot be opened or is already open');
      }
      throw error;
    }
  }

  /**
   * Validate stock consumption data
   * @param {Object} data - Stock consumption data
   */
  validateStockConsumptionData(data) {
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

    // Validate exact flag if present
    if (data.exact !== undefined && typeof data.exact !== 'boolean') {
      errors.push('Field "exact" must be a boolean');
    }

    // Validate allow_subproduct_substitution if present
    if (data.allow_subproduct_substitution !== undefined && typeof data.allow_subproduct_substitution !== 'boolean') {
      errors.push('Field "allow_subproduct_substitution" must be a boolean');
    }

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
  }

  /**
   * Validate open product data
   * @param {Object} data - Open product data
   */
  validateOpenProductData(data) {
    const errors = [];

    // Validate amount if present
    if (data.amount !== undefined) {
      try {
        Validators.validateNumber(data.amount, 'amount', { min: 0 });
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate stock_entry_id if present
    if (data.stock_entry_id !== undefined) {
      try {
        Validators.validateId(data.stock_entry_id, 'stock_entry_id');
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
      'consumeProduct',
      'consumeProductByBarcode',
      'openProduct'
    ];
  }
}

module.exports = StockConsumptionOperations;