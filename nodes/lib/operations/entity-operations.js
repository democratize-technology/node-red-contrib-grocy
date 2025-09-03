const Validators = require('../validators');

/**
 * Entity operations - generic CRUD operations for all entities
 */
class EntityOperations {
  constructor(client) {
    this.client = client;
    this.api = client.getAPI();
  }

  /**
   * Get objects for an entity with validation
   * @param {Object} payload - Contains entity and optional options
   * @param {Object} options - Query options
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<Array>} List of objects
   */
  async getObjects(payload, options = {}, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    const validatedOptions = Validators.validateOptions(options);
    
    return await this.api.getObjects(entity, validatedOptions);
  }

  /**
   * Add a new object to an entity with validation
   * @param {Object} payload - Contains entity and data
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<Object>} Created object
   */
  async addObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['data']);
    Validators.validateData(payload.data);
    
    return await this.api.addObject(entity, payload.data);
  }

  /**
   * Get a specific object from an entity with validation
   * @param {Object} payload - Contains entity and objectId
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<Object>} Object data
   */
  async getObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId']);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.getObject(entity, payload.objectId);
  }

  /**
   * Edit an object in an entity with validation
   * @param {Object} payload - Contains entity, objectId, and data
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<Object>} Updated object
   */
  async editObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId', 'data']);
    Validators.validateId(payload.objectId, 'objectId');
    Validators.validateData(payload.data);
    
    return await this.api.editObject(entity, payload.objectId, payload.data);
  }

  /**
   * Delete an object from an entity with validation
   * @param {Object} payload - Contains entity and objectId
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<Object>} Deletion result
   */
  async deleteObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId']);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.deleteObject(entity, payload.objectId);
  }

  /**
   * Get user fields for an entity object
   * @param {Object} payload - Contains entity, objectId
   * @returns {Promise<Object>} User fields data
   */
  async getUserfields(payload) {
    Validators.validateRequired(payload, ['entity', 'objectId']);
    Validators.validateEntity(payload.entity);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.getUserfields(payload.entity, payload.objectId);
  }

  /**
   * Set user fields for an entity object
   * @param {Object} payload - Contains entity, objectId, and data
   * @returns {Promise<Object>} Operation result
   */
  async setUserfields(payload) {
    Validators.validateRequired(payload, ['entity', 'objectId', 'data']);
    Validators.validateEntity(payload.entity);
    Validators.validateId(payload.objectId, 'objectId');
    Validators.validateData(payload.data);
    
    return await this.api.setUserfields(payload.entity, payload.objectId, payload.data);
  }

  /**
   * Get users with options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of users
   */
  async getUsers(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getUsers(validatedOptions);
  }

  /**
   * Create a new user
   * @param {Object} payload - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(payload) {
    Validators.validateData(payload);
    return await this.api.createUser(payload);
  }

  /**
   * Edit a user
   * @param {Object} payload - Contains userId and data
   * @returns {Promise<Object>} Updated user
   */
  async editUser(payload) {
    Validators.validateRequired(payload, ['userId', 'data']);
    Validators.validateId(payload.userId, 'userId');
    Validators.validateData(payload.data);
    
    return await this.api.editUser(payload.userId, payload.data);
  }

  /**
   * Delete a user
   * @param {Object} payload - Contains userId
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUser(payload) {
    Validators.validateRequired(payload, ['userId']);
    Validators.validateId(payload.userId, 'userId');
    
    return await this.api.deleteUser(payload.userId);
  }

  /**
   * Get current user
   * @returns {Promise<Object>} Current user data
   */
  async getCurrentUser() {
    return await this.api.getCurrentUser();
  }

  /**
   * Add recipe products to shopping list
   * @param {Object} payload - Contains recipeId and data
   * @returns {Promise<Object>} Operation result
   */
  async addRecipeProductsToShoppingList(payload) {
    Validators.validateRequired(payload, ['recipeId', 'data']);
    Validators.validateId(payload.recipeId, 'recipeId');
    Validators.validateData(payload.data);
    
    return await this.api.addRecipeProductsToShoppingList(payload.recipeId, payload.data);
  }

  /**
   * Get recipe fulfillment
   * @param {Object} payload - Contains recipeId
   * @returns {Promise<Object>} Recipe fulfillment data
   */
  async getRecipeFulfillment(payload) {
    Validators.validateRequired(payload, ['recipeId']);
    Validators.validateId(payload.recipeId, 'recipeId');
    
    return await this.api.getRecipeFulfillment(payload.recipeId);
  }

  /**
   * Consume recipe
   * @param {Object} payload - Contains recipeId
   * @returns {Promise<Object>} Operation result
   */
  async consumeRecipe(payload) {
    Validators.validateRequired(payload, ['recipeId']);
    Validators.validateId(payload.recipeId, 'recipeId');
    
    return await this.api.consumeRecipe(payload.recipeId);
  }

  /**
   * Get all recipes fulfillment
   * @param {Object} options - Query options
   * @returns {Promise<Array>} All recipes fulfillment data
   */
  async getAllRecipesFulfillment(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getAllRecipesFulfillment(validatedOptions);
  }

  /**
   * Get calendar
   * @returns {Promise<Array>} Calendar data
   */
  async getCalendar() {
    return await this.api.getCalendar();
  }

  /**
   * Get calendar sharing link
   * @returns {Promise<Object>} Calendar sharing link
   */
  async getCalendarSharingLink() {
    return await this.api.getCalendarSharingLink();
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getObjects',
      'addObject',
      'getObject',
      'editObject',
      'deleteObject',
      'getUserfields',
      'setUserfields',
      'getUsers',
      'createUser',
      'editUser',
      'deleteUser',
      'getCurrentUser',
      'addRecipeProductsToShoppingList',
      'getRecipeFulfillment',
      'consumeRecipe',
      'getAllRecipesFulfillment',
      'getCalendar',
      'getCalendarSharingLink'
    ];
  }
}

module.exports = EntityOperations;