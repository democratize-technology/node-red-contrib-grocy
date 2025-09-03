const Validators = require('../validators');

/**
 * Settings operations - user settings and configuration management
 */
class SettingsOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Get all user settings
   * @returns {Promise<Object>} User settings data
   */
  async getUserSettings() {
    return await this.api.getUserSettings();
  }

  /**
   * Get a specific user setting
   * @param {Object} payload - Contains settingKey
   * @returns {Promise<*>} Setting value
   */
  async getUserSetting(payload) {
    Validators.validateRequired(payload, ['settingKey']);
    Validators.validateSettingKey(payload.settingKey);
    
    return await this.api.getUserSetting(payload.settingKey);
  }

  /**
   * Set a user setting
   * @param {Object} payload - Contains settingKey and data
   * @returns {Promise<Object>} Operation result
   */
  async setUserSetting(payload) {
    Validators.validateRequired(payload, ['settingKey', 'data']);
    Validators.validateSettingKey(payload.settingKey);
    Validators.validateData(payload.data);
    
    return await this.api.setUserSetting(payload.settingKey, payload.data);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getUserSettings',
      'getUserSetting',
      'setUserSetting'
    ];
  }
}

module.exports = SettingsOperations;