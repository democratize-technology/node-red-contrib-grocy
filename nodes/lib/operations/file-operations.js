const Validators = require('../validators');

/**
 * File operations - managing files, uploads, and downloads
 */
class FileOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Get a file from Grocy
   * @param {Object} payload - Contains group, fileName, and optional options
   * @returns {Promise<*>} File data
   */
  async getFile(payload) {
    Validators.validateFileParams(payload);
    const options = payload.options || {};
    
    return await this.api.getFile(payload.group, payload.fileName, options);
  }

  /**
   * Upload a file to Grocy
   * @param {Object} payload - Contains group, fileName, and fileData
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(payload) {
    Validators.validateFileParams(payload);
    Validators.validateRequired(payload, ['fileData']);
    
    return await this.api.uploadFile(payload.group, payload.fileName, payload.fileData);
  }

  /**
   * Delete a file from Grocy
   * @param {Object} payload - Contains group and fileName
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(payload) {
    Validators.validateFileParams(payload);
    
    return await this.api.deleteFile(payload.group, payload.fileName);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getFile',
      'uploadFile',
      'deleteFile'
    ];
  }
}

module.exports = FileOperations;