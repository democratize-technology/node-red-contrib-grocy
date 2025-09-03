const Validators = require('../validators');

/**
 * Task and Chore operations
 */
class TaskChoreOperations {
  constructor(client) {
    this.api = client.getAPI();
  }

  /**
   * Execute a task or chore operation
   * @param {string} operation - The operation name
   * @param {Object} payload - Operation payload
   * @param {Object} options - Additional options
   * @returns {Promise<*>} Operation result
   */
  async execute(operation, payload, options = {}) {
    switch (operation) {
      // Chore operations
      case 'getChores':
        return await this.getChores(options);
      
      case 'getChoreDetails':
        return await this.getChoreDetails(payload);
      
      case 'executeChore':
        return await this.executeChore(payload);
      
      // Task operations
      case 'getTasks':
        return await this.getTasks(options);
      
      case 'completeTask':
        return await this.completeTask(payload);
      
      case 'undoTask':
        return await this.undoTask(payload);
      
      default:
        throw new Error(`Unknown task/chore operation: ${operation}`);
    }
  }

  /**
   * Get chores list
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Chores data
   */
  async getChores(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getChores(validatedOptions);
  }

  /**
   * Get chore details
   * @param {Object} payload - Contains choreId
   * @returns {Promise<Object>} Chore details
   */
  async getChoreDetails(payload) {
    Validators.validateRequired(payload, ['choreId']);
    Validators.validateId(payload.choreId, 'choreId');
    
    return await this.api.getChoreDetails(payload.choreId);
  }

  /**
   * Execute (complete) a chore
   * @param {Object} payload - Contains choreId and optional data
   * @returns {Promise<Object>} Operation result
   */
  async executeChore(payload) {
    Validators.validateRequired(payload, ['choreId']);
    Validators.validateId(payload.choreId, 'choreId');
    
    const data = payload.data || {};
    return await this.api.executeChore(payload.choreId, data);
  }

  /**
   * Get tasks list
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Tasks data
   */
  async getTasks(options = {}) {
    const validatedOptions = Validators.validateOptions(options);
    return await this.api.getTasks(validatedOptions);
  }

  /**
   * Complete a task
   * @param {Object} payload - Contains taskId and optional data
   * @returns {Promise<Object>} Operation result
   */
  async completeTask(payload) {
    Validators.validateRequired(payload, ['taskId']);
    Validators.validateId(payload.taskId, 'taskId');
    
    const data = payload.data || {};
    return await this.api.completeTask(payload.taskId, data);
  }

  /**
   * Undo a task completion
   * @param {Object} payload - Contains taskId
   * @returns {Promise<Object>} Operation result
   */
  async undoTask(payload) {
    Validators.validateRequired(payload, ['taskId']);
    Validators.validateId(payload.taskId, 'taskId');
    
    return await this.api.undoTask(payload.taskId);
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  getSupportedOperations() {
    return [
      'getChores',
      'getChoreDetails',
      'executeChore',
      'getTasks',
      'completeTask',
      'undoTask'
    ];
  }
}

module.exports = TaskChoreOperations;