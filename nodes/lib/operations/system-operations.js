const Validators = require('../validators');

/**
 * System operations - system information, configuration, and system-level tasks
 */
class SystemOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Get system information
   * @returns {Promise<Object>} System info data
   */
  async getSystemInfo() {
    return await this.api.getSystemInfo();
  }

  /**
   * Get database last changed time
   * @returns {Promise<Object>} Database change timestamp
   */
  async getDbChangedTime() {
    return await this.api.getDbChangedTime();
  }

  /**
   * Get system configuration
   * @returns {Promise<Object>} System configuration
   */
  async getConfig() {
    return await this.api.getConfig();
  }

  /**
   * Get system time with optional offset
   * @param {Object} payload - Contains optional offset
   * @returns {Promise<Object>} System time data
   */
  async getTime(payload = {}) {
    return await this.api.getTime(payload.offset);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getSystemInfo',
      'getDbChangedTime',
      'getConfig',
      'getTime'
    ];
  }
}

module.exports = SystemOperations;