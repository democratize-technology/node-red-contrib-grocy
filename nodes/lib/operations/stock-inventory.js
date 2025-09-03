const Validators = require('../validators');
const ErrorHandler = require('../error-handler');

/**
 * Stock inventory operations - managing current stock levels and stock entries
 */
class StockInventoryOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Get current stock overview with error handling
   * @param {Object} api - API instance
   * @returns {Promise<Array>} Stock data
   */
  async getStock(api) {
    try {
      const stock = await api.getStock();
      if (!Array.isArray(stock)) {
        throw ErrorHandler.validationError('Stock data must be an array');
      }
      return stock;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return []; // Empty stock is valid
      }
      throw error;
    }
  }

  /**
   * Get specific stock entry with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains entryId
   * @returns {Promise<Object>} Stock entry data
   */
  async getStockEntry(api, payload) {
    try {
      Validators.validateRequired(payload, ['entryId']);
      Validators.validateId(payload.entryId, 'entryId');
      
      const entry = await api.getStockEntry(payload.entryId);
      if (!entry) {
        throw ErrorHandler.validationError(`Stock entry ${payload.entryId} not found`);
      }
      return entry;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Stock entry ${payload.entryId} does not exist`);
      }
      throw error;
    }
  }

  /**
   * Edit stock entry with comprehensive validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains entryId and data
   * @returns {Promise<Object>} Updated stock entry
   */
  async editStockEntry(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['entryId', 'data']),
      () => Validators.validateId(payload.entryId, 'entryId'),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateStockEntryData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.editStockEntry(payload.entryId, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Stock entry ${payload.entryId} does not exist`);
      }
      throw error;
    }
  }

  /**
   * Get volatile stock (expiring soon) with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains optional dueSoonDays
   * @returns {Promise<Array>} Volatile stock data
   */
  async getVolatileStock(api, payload = {}) {
    // Validate dueSoonDays if provided
    if (payload.dueSoonDays !== undefined) {
      Validators.validateNumber(
        payload.dueSoonDays, 
        'dueSoonDays', 
        { min: 0, max: 365, allowDecimals: false }
      );
    }
    
    try {
      const volatileStock = await api.getVolatileStock(payload.dueSoonDays);
      if (!Array.isArray(volatileStock)) {
        throw ErrorHandler.validationError('Volatile stock data must be an array');
      }
      return volatileStock;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return []; // No volatile stock is valid
      }
      throw error;
    }
  }

  /**
   * Inventory product (set exact stock amount) with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains productId and data
   * @returns {Promise<Object>} Operation result
   */
  async inventoryProduct(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['productId', 'data']),
      () => Validators.validateId(payload.productId, 'productId'),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateInventoryData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.inventoryProduct(payload.productId, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product ${payload.productId} does not exist`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid inventory data');
      }
      throw error;
    }
  }

  /**
   * Validate stock entry data for editing
   * @param {Object} data - Stock entry data
   */
  validateStockEntryData(data) {
    const errors = [];

    // Validate amount if present
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
        Validators.validateDate(data.best_before_date, 'best_before_date');
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
   * Validate inventory data
   * @param {Object} data - Inventory data
   */
  validateInventoryData(data) {
    const requiredFields = ['new_amount'];
    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate new_amount
    if (data.new_amount !== undefined) {
      try {
        Validators.validateNumber(data.new_amount, 'new_amount', { min: 0 });
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate best_before_date if present
    if (data.best_before_date !== undefined && data.best_before_date !== '') {
      try {
        Validators.validateDate(data.best_before_date, 'best_before_date');
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

    // Validate price if present
    if (data.price !== undefined) {
      try {
        Validators.validateNumber(data.price, 'price', { min: 0 });
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
      'getStock',
      'getStockEntry',
      'editStockEntry',
      'getVolatileStock',
      'inventoryProduct'
    ];
  }
}

module.exports = StockInventoryOperations;