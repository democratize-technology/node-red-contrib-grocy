const Validators = require('../validators');

/**
 * Generic entity and system operations
 */
class GenericOperations {
  constructor(client) {
    this.api = client.getAPI();
  }

  /**
   * Execute a generic operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @param {string} entityType - Entity type for generic operations
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}, entityType = null) {
    switch (operation) {
      // System operations
      case 'getSystemInfo':
        return await this.getSystemInfo();
      
      case 'getDbChangedTime':
        return await this.getDbChangedTime();
      
      case 'getConfig':
        return await this.getConfig();
      
      case 'getTime':
        return await this.getTime(payload);
      
      // Generic entity operations
      case 'getObjects':
        return await this.getObjects(payload, options, entityType);
      
      case 'addObject':
        return await this.addObject(payload, entityType);
      
      case 'getObject':
        return await this.getObject(payload, entityType);
      
      case 'editObject':
        return await this.editObject(payload, entityType);
      
      case 'deleteObject':
        return await this.deleteObject(payload, entityType);
      
      // User fields operations
      case 'getUserfields':
        return await this.getUserfields(payload);
      
      case 'setUserfields':
        return await this.setUserfields(payload);
      
      // File operations
      case 'getFile':
        return await this.getFile(payload);
      
      case 'uploadFile':
        return await this.uploadFile(payload);
      
      case 'deleteFile':
        return await this.deleteFile(payload);
      
      // User operations
      case 'getUsers':
        return await this.getUsers(options);
      
      case 'createUser':
        return await this.createUser(payload);
      
      case 'editUser':
        return await this.editUser(payload);
      
      case 'deleteUser':
        return await this.deleteUser(payload);
      
      case 'getCurrentUser':
        return await this.getCurrentUser();
      
      case 'getUserSettings':
        return await this.getUserSettings();
      
      case 'getUserSetting':
        return await this.getUserSetting(payload);
      
      case 'setUserSetting':
        return await this.setUserSetting(payload);
      
      // Recipe operations
      case 'addRecipeProductsToShoppingList':
        return await this.addRecipeProductsToShoppingList(payload);
      
      case 'getRecipeFulfillment':
        return await this.getRecipeFulfillment(payload);
      
      case 'consumeRecipe':
        return await this.consumeRecipe(payload);
      
      case 'getAllRecipesFulfillment':
        return await this.getAllRecipesFulfillment(options);
      
      // Calendar operations
      case 'getCalendar':
        return await this.getCalendar();
      
      case 'getCalendarSharingLink':
        return await this.getCalendarSharingLink();
      
      default:
        throw new Error(`Unknown generic operation: ${operation}`);
    }
  }

  // System operations
  async getSystemInfo() {
    return await this.api.getSystemInfo();
  }

  async getDbChangedTime() {
    return await this.api.getDbChangedTime();
  }

  async getConfig() {
    return await this.api.getConfig();
  }

  async getTime(payload = {}) {
    return await this.api.getTime(payload.offset);
  }

  // Generic entity operations
  async getObjects(payload, options = {}, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    const validatedOptions = Validators.validateOptions(options);
    
    return await this.api.getObjects(entity, validatedOptions);
  }

  async addObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['data']);
    Validators.validateData(payload.data);
    
    return await this.api.addObject(entity, payload.data);
  }

  async getObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId']);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.getObject(entity, payload.objectId);
  }

  async editObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId', 'data']);
    Validators.validateId(payload.objectId, 'objectId');
    Validators.validateData(payload.data);
    
    return await this.api.editObject(entity, payload.objectId, payload.data);
  }

  async deleteObject(payload, entityType) {
    const entity = payload.entity || entityType;
    Validators.validateEntity(entity);
    Validators.validateRequired(payload, ['objectId']);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.deleteObject(entity, payload.objectId);
  }

  // User fields operations
  async getUserfields(payload) {
    Validators.validateRequired(payload, ['entity', 'objectId']);
    Validators.validateEntity(payload.entity);
    Validators.validateId(payload.objectId, 'objectId');
    
    return await this.api.getUserfields(payload.entity, payload.objectId);
  }

  async setUserfields(payload) {
    Validators.validateRequired(payload, ['entity', 'objectId', 'data']);
    Validators.validateEntity(payload.entity);
    Validators.validateId(payload.objectId, 'objectId');
    Validators.validateData(payload.data);
    
    return await this.api.setUserfields(payload.entity, payload.objectId, payload.data);
  }

  // File operations
  async getFile(payload) {
    Validators.validateFileParams(payload);
    const options = payload.options || {};
    
    return await this.api.getFile(payload.group, payload.fileName, options);
  }

  async uploadFile(payload) {
    Validators.validateFileParams(payload);
    Validators.validateRequired(payload, ['fileData']);
    
    return await this.api.uploadFile(payload.group, payload.fileName, payload.fileData);
  }

  async deleteFile(payload) {
    Validators.validateFileParams(payload);
    
    return await this.api.deleteFile(payload.group, payload.fileName);
  }

  // User operations
  async getUsers(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getUsers(validatedOptions);
  }

  async createUser(payload) {
    Validators.validateData(payload);
    return await this.api.createUser(payload);
  }

  async editUser(payload) {
    Validators.validateRequired(payload, ['userId', 'data']);
    Validators.validateId(payload.userId, 'userId');
    Validators.validateData(payload.data);
    
    return await this.api.editUser(payload.userId, payload.data);
  }

  async deleteUser(payload) {
    Validators.validateRequired(payload, ['userId']);
    Validators.validateId(payload.userId, 'userId');
    
    return await this.api.deleteUser(payload.userId);
  }

  async getCurrentUser() {
    return await this.api.getCurrentUser();
  }

  async getUserSettings() {
    return await this.api.getUserSettings();
  }

  async getUserSetting(payload) {
    Validators.validateRequired(payload, ['settingKey']);
    Validators.validateSettingKey(payload.settingKey);
    
    return await this.api.getUserSetting(payload.settingKey);
  }

  async setUserSetting(payload) {
    Validators.validateRequired(payload, ['settingKey', 'data']);
    Validators.validateSettingKey(payload.settingKey);
    Validators.validateData(payload.data);
    
    return await this.api.setUserSetting(payload.settingKey, payload.data);
  }

  // Recipe operations
  async addRecipeProductsToShoppingList(payload) {
    Validators.validateRequired(payload, ['recipeId', 'data']);
    Validators.validateId(payload.recipeId, 'recipeId');
    Validators.validateData(payload.data);
    
    return await this.api.addRecipeProductsToShoppingList(payload.recipeId, payload.data);
  }

  async getRecipeFulfillment(payload) {
    Validators.validateRequired(payload, ['recipeId']);
    Validators.validateId(payload.recipeId, 'recipeId');
    
    return await this.api.getRecipeFulfillment(payload.recipeId);
  }

  async consumeRecipe(payload) {
    Validators.validateRequired(payload, ['recipeId']);
    Validators.validateId(payload.recipeId, 'recipeId');
    
    return await this.api.consumeRecipe(payload.recipeId);
  }

  async getAllRecipesFulfillment(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getAllRecipesFulfillment(validatedOptions);
  }

  // Calendar operations
  async getCalendar() {
    return await this.api.getCalendar();
  }

  async getCalendarSharingLink() {
    return await this.api.getCalendarSharingLink();
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
      'getTime',
      'getObjects',
      'addObject',
      'getObject',
      'editObject',
      'deleteObject',
      'getUserfields',
      'setUserfields',
      'getFile',
      'uploadFile',
      'deleteFile',
      'getUsers',
      'createUser',
      'editUser',
      'deleteUser',
      'getCurrentUser',
      'getUserSettings',
      'getUserSetting',
      'setUserSetting',
      'addRecipeProductsToShoppingList',
      'getRecipeFulfillment',
      'consumeRecipe',
      'getAllRecipesFulfillment',
      'getCalendar',
      'getCalendarSharingLink'
    ];
  }
}

module.exports = GenericOperations;