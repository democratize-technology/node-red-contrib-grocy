const Validators = require('../validators');
const ErrorHandler = require('../error-handler');

/**
 * Stock transfer operations - transferring products between locations
 */
class StockTransferOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
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
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'transferProduct'
    ];
  }
}

module.exports = StockTransferOperations;