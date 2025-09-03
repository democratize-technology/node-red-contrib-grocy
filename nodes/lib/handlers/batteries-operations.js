const Validators = require('../validators');

/**
 * Handler for batteries operations
 */
class BatteriesOperations {
  constructor(client) {
    this.client = client;
  }

  /**
   * Execute a batteries operation
   * @param {string} operation - The operation to execute
   * @param {Object} payload - The payload data
   * @param {Object} options - Additional options
   * @returns {Promise<*>} The operation result
   */
  async execute(operation, payload, options = {}) {
    Validators.validateOperation(operation);
    const data = payload || {};
    const queryOptions = Validators.validateOptions(options);

    switch (operation) {
      case 'getBatteries':
        return await this.client.api.getBatteries(queryOptions);

      case 'getBatteryDetails':
        Validators.validateId(data.batteryId, 'batteryId');
        return await this.client.api.getBatteryDetails(data.batteryId);

      case 'chargeBattery':
        Validators.validateId(data.batteryId, 'batteryId');
        return await this.client.api.chargeBattery(data.batteryId, data.data || {});

      case 'addBattery':
        Validators.validateRequired(data, ['name']);
        return await this.client.api.addObject('batteries', data);

      case 'editBattery':
        Validators.validateId(data.id);
        return await this.client.api.editObject('batteries', data.id, data);

      case 'deleteBattery':
        Validators.validateId(data.id);
        return await this.client.api.deleteObject('batteries', data.id);

      default:
        throw new Error(`Invalid batteries operation: ${operation}`);
    }
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  static getSupportedOperations() {
    return [
      'getBatteries',
      'getBatteryDetails',
      'chargeBattery',
      'addBattery',
      'editBattery',
      'deleteBattery'
    ];
  }
}

module.exports = BatteriesOperations;