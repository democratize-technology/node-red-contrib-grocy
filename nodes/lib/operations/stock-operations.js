const Validators = require('../validators');
const ErrorHandler = require('../error-handler');

/**
 * Stock management operations with comprehensive error handling
 * and input validation
 */
class StockOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
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
    
    // Sanitize payload for logging
    const sanitizedPayload = ErrorHandler.sanitizePayload(payload);
    const context = {
      operation,
      sanitizedPayload,
      timestamp: new Date().toISOString()
    };

    // Execute operation with timeout and retry
    return await this.client.executeOperation(
      async (api) => {
        switch (operation) {
          case 'getStock':
            return await this.getStock(api);
          
          case 'getStockEntry':
            return await this.getStockEntry(api, payload);
          
          case 'editStockEntry':
            return await this.editStockEntry(api, payload);
          
          case 'getVolatileStock':
            return await this.getVolatileStock(api, payload);
          
          case 'addProductToStock':
            return await this.addProductToStock(api, payload);
          
          case 'addProductToStockByBarcode':
            return await this.addProductToStockByBarcode(api, payload);
          
          case 'consumeProduct':
            return await this.consumeProduct(api, payload);
          
          case 'consumeProductByBarcode':
            return await this.consumeProductByBarcode(api, payload);
          
          case 'transferProduct':
            return await this.transferProduct(api, payload);
          
          case 'inventoryProduct':
            return await this.inventoryProduct(api, payload);
          
          case 'openProduct':
            return await this.openProduct(api, payload);
          
          default:
            throw ErrorHandler.operationError(operation);
        }
      },
      context,
      options
    );
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
        throw ErrorHandler.validationError('Invalid consumption data or insufficient stock');
      }
      throw error;
    }
  }

  /**
   * Transfer product between locations with validation
   * @param {Object} api - API instance
   * @param {Object} payload - Contains productId and data
   * @returns {Promise<Object>} Operation result
   */
  async transferProduct(api, payload) {
    const errors = Validators.collectErrors([
      () => Validators.validateRequired(payload, ['productId', 'data']),
      () => Validators.validateId(payload.productId, 'productId'),
      () => Validators.validateData(payload.data, { requireFields: true }),
      () => this.validateTransferData(payload.data)
    ]);

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
    
    try {
      return await api.transferProduct(payload.productId, payload.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw ErrorHandler.validationError(`Product ${payload.productId} does not exist`);
      } else if (error.response && error.response.status === 400) {
        throw ErrorHandler.validationError('Invalid transfer data or insufficient stock');
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
   * Validate transfer data
   * @param {Object} data - Transfer data
   */
  validateTransferData(data) {
    const requiredFields = ['amount', 'location_id_to'];
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

    // Validate destination location
    if (data.location_id_to !== undefined) {
      try {
        Validators.validateId(data.location_id_to, 'location_id_to');
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate source location if present
    if (data.location_id_from !== undefined) {
      try {
        Validators.validateId(data.location_id_from, 'location_id_from');
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
      'getStock',
      'getStockEntry',
      'editStockEntry', 
      'getVolatileStock',
      'addProductToStock',
      'addProductToStockByBarcode',
      'consumeProduct',
      'consumeProductByBarcode',
      'transferProduct',
      'inventoryProduct',
      'openProduct'
    ];
  }
}

module.exports = StockOperations;