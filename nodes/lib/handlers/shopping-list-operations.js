const Validators = require('../validators');

/**
 * Handler for shopping list operations
 */
class ShoppingListOperations {
  constructor(client) {
    this.client = client;
  }

  /**
   * Execute a shopping list operation
   * @param {string} operation - The operation to execute
   * @param {Object} payload - The payload data
   * @param {Object} options - Additional options
   * @returns {Promise<*>} The operation result
   */
  async execute(operation, payload, options = {}) {
    Validators.validateOperation(operation);
    const data = payload || {};

    switch (operation) {
      case 'getShoppingLists':
        // Get all shopping lists using the objects endpoint
        return await this.client.api.getObjects('shopping_lists');

      case 'getShoppingListItems':
        // Get shopping list items (optionally filtered by shopping list id)
        let queryOptions = {};
        if (data.shoppingListId) {
          queryOptions.query = `shopping_list_id=${data.shoppingListId}`;
        }
        return await this.client.api.getObjects('shopping_list', queryOptions);

      case 'addMissingProductsToShoppingList':
        return await this.client.api.addMissingProductsToShoppingList(data);

      case 'addOverdueProductsToShoppingList':
        return await this.client.api.addOverdueProductsToShoppingList(data);

      case 'addExpiredProductsToShoppingList':
        return await this.client.api.addExpiredProductsToShoppingList(data);

      case 'clearShoppingList':
        return await this.client.api.clearShoppingList(data);

      case 'addProductToShoppingList':
        Validators.validateRequired(data, ['product_id']);
        return await this.client.api.addProductToShoppingList(data);

      case 'removeProductFromShoppingList':
        Validators.validateRequired(data, ['product_id']);
        return await this.client.api.removeProductFromShoppingList(data);

      case 'createShoppingList':
        // Create a new shopping list
        Validators.validateRequired(data, ['name']);
        return await this.client.api.addObject('shopping_lists', data);

      case 'updateShoppingList':
        // Update a shopping list
        Validators.validateId(data.id);
        return await this.client.api.editObject('shopping_lists', data.id, data);

      case 'deleteShoppingList':
        // Delete a shopping list
        Validators.validateId(data.id);
        return await this.client.api.deleteObject('shopping_lists', data.id);

      default:
        throw new Error(`Invalid shopping list operation: ${operation}`);
    }
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  static getSupportedOperations() {
    return [
      'getShoppingLists',
      'getShoppingListItems',
      'addMissingProductsToShoppingList',
      'addOverdueProductsToShoppingList',
      'addExpiredProductsToShoppingList',
      'clearShoppingList',
      'addProductToShoppingList',
      'removeProductFromShoppingList',
      'createShoppingList',
      'updateShoppingList',
      'deleteShoppingList'
    ];
  }
}

module.exports = ShoppingListOperations;