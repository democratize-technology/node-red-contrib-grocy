const Validators = require('../validators');

/**
 * Shopping list operations
 */
class ShoppingListOperations {
  constructor(client) {
    this.api = client.getAPI();
  }

  /**
   * Execute a shopping list operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}) {
    switch (operation) {
      case 'addMissingProductsToShoppingList':
        return await this.addMissingProductsToShoppingList(payload);
      
      case 'addOverdueProductsToShoppingList':
        return await this.addOverdueProductsToShoppingList(payload);
      
      case 'addExpiredProductsToShoppingList':
        return await this.addExpiredProductsToShoppingList(payload);
      
      case 'clearShoppingList':
        return await this.clearShoppingList(payload);
      
      case 'addProductToShoppingList':
        return await this.addProductToShoppingList(payload);
      
      case 'removeProductFromShoppingList':
        return await this.removeProductFromShoppingList(payload);
      
      default:
        throw new Error(`Unknown shopping list operation: ${operation}`);
    }
  }

  /**
   * Add missing products to shopping list
   * @param {Object} payload - Optional parameters
   * @returns {Promise<Object>} Operation result
   */
  async addMissingProductsToShoppingList(payload = {}) {
    return await this.api.addMissingProductsToShoppingList(payload);
  }

  /**
   * Add overdue products to shopping list
   * @param {Object} payload - Optional parameters
   * @returns {Promise<Object>} Operation result
   */
  async addOverdueProductsToShoppingList(payload = {}) {
    return await this.api.addOverdueProductsToShoppingList(payload);
  }

  /**
   * Add expired products to shopping list
   * @param {Object} payload - Optional parameters
   * @returns {Promise<Object>} Operation result
   */
  async addExpiredProductsToShoppingList(payload = {}) {
    return await this.api.addExpiredProductsToShoppingList(payload);
  }

  /**
   * Clear shopping list
   * @param {Object} payload - Optional parameters
   * @returns {Promise<Object>} Operation result
   */
  async clearShoppingList(payload = {}) {
    return await this.api.clearShoppingList(payload);
  }

  /**
   * Add product to shopping list
   * @param {Object} payload - Shopping list item data
   * @returns {Promise<Object>} Operation result
   */
  async addProductToShoppingList(payload) {
    Validators.validateData(payload);
    return await this.api.addProductToShoppingList(payload);
  }

  /**
   * Remove product from shopping list
   * @param {Object} payload - Item removal data
   * @returns {Promise<Object>} Operation result
   */
  async removeProductFromShoppingList(payload) {
    Validators.validateData(payload);
    return await this.api.removeProductFromShoppingList(payload);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'addMissingProductsToShoppingList',
      'addOverdueProductsToShoppingList',
      'addExpiredProductsToShoppingList',
      'clearShoppingList',
      'addProductToShoppingList',
      'removeProductFromShoppingList'
    ];
  }
}

module.exports = ShoppingListOperations;