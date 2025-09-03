const Validators = require('../validators');

/**
 * Battery management operations
 */
class BatteryOperations {
  constructor(client) {
    this.api = client.getAPI();
  }

  /**
   * Execute a battery operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}) {
    switch (operation) {
      case 'getBatteries':
        return await this.getBatteries(options);
      
      case 'getBatteryDetails':
        return await this.getBatteryDetails(payload);
      
      case 'chargeBattery':
        return await this.chargeBattery(payload);
      
      default:
        throw new Error(`Unknown battery operation: ${operation}`);
    }
  }

  /**
   * Get batteries list
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Batteries data
   */
  async getBatteries(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getBatteries(validatedOptions);
  }

  /**
   * Get battery details
   * @param {Object} payload - Contains batteryId
   * @returns {Promise<Object>} Battery details
   */
  async getBatteryDetails(payload) {
    Validators.validateRequired(payload, ['batteryId']);
    Validators.validateId(payload.batteryId, 'batteryId');
    
    return await this.api.getBatteryDetails(payload.batteryId);
  }

  /**
   * Charge a battery (record charging event)
   * @param {Object} payload - Contains batteryId and optional data
   * @returns {Promise<Object>} Operation result
   */
  async chargeBattery(payload) {
    Validators.validateRequired(payload, ['batteryId']);
    Validators.validateId(payload.batteryId, 'batteryId');
    
    const data = payload.data || {};
    return await this.api.chargeBattery(payload.batteryId, data);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getBatteries',
      'getBatteryDetails',
      'chargeBattery'
    ];
  }
}

module.exports = BatteryOperations;