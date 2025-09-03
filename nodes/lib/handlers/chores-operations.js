const Validators = require('../validators');

/**
 * Handler for chores and tasks operations
 */
class ChoresOperations {
  constructor(client) {
    this.client = client;
  }

  /**
   * Execute a chores/tasks operation
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
      // Chores operations
      case 'getChores':
        return await this.client.api.getChores(queryOptions);

      case 'getChoreDetails':
        Validators.validateId(data.choreId, 'choreId');
        return await this.client.api.getChoreDetails(data.choreId);

      case 'executeChore':
        Validators.validateId(data.choreId, 'choreId');
        return await this.client.api.executeChore(data.choreId, data.data || {});

      // Tasks operations
      case 'getTasks':
        return await this.client.api.getTasks(queryOptions);

      case 'completeTask':
        Validators.validateId(data.taskId, 'taskId');
        return await this.client.api.completeTask(data.taskId, data.data || {});

      case 'undoTask':
        Validators.validateId(data.taskId, 'taskId');
        return await this.client.api.undoTask(data.taskId);

      case 'addTask':
        Validators.validateRequired(data, ['name']);
        return await this.client.api.addObject('tasks', data);

      case 'editTask':
        Validators.validateId(data.id);
        return await this.client.api.editObject('tasks', data.id, data);

      case 'deleteTask':
        Validators.validateId(data.id);
        return await this.client.api.deleteObject('tasks', data.id);

      default:
        throw new Error(`Invalid chores/tasks operation: ${operation}`);
    }
  }

  /**
   * Get supported operations
   * @returns {Array<string>} List of supported operations
   */
  static getSupportedOperations() {
    return [
      'getChores',
      'getChoreDetails',
      'executeChore',
      'getTasks',
      'completeTask',
      'undoTask',
      'addTask',
      'editTask',
      'deleteTask'
    ];
  }
}

module.exports = ChoresOperations;