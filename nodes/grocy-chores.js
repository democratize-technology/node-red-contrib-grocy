const GrocyAPI = require('node-grocy').default;

module.exports = function (RED) {
  function GrocyChoresNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Get configuration node
    this.server = RED.nodes.getNode(config.server);
    this.operation = config.operation;

    if (!this.server) {
      node.status({ fill: 'red', shape: 'ring', text: 'Missing server config' });
      return;
    }

    node.on('input', async function (msg, send, done) {
      // Set initial node status
      node.status({ fill: 'blue', shape: 'dot', text: 'requesting...' });

      const operation = msg.operation || node.operation;
      const payload = msg.payload || {};
      const options = msg.options || {};

      if (!operation) {
        node.status({ fill: 'red', shape: 'ring', text: 'no operation specified' });
        const error = new Error('No operation specified');
        if (done) {
          done(error);
        } else {
          node.error(error, msg);
        }
        return;
      }

      try {
        // Initialize Grocy client
        const grocy = new GrocyAPI(node.server.apiUrl, node.server.credentials.apiKey);

        let result;

        // Execute the Grocy chores/tasks operation
        switch (operation) {
          // Chores operations
          case 'getChores':
            result = await grocy.getChores(options);
            break;
          case 'getChoreDetails':
            if (!payload.choreId) {
              throw new Error('choreId is required');
            }
            result = await grocy.getChoreDetails(payload.choreId);
            break;
          case 'executeChore':
            if (!payload.choreId) {
              throw new Error('choreId is required');
            }
            result = await grocy.executeChore(payload.choreId, payload.data || {});
            break;

          // Tasks operations
          case 'getTasks':
            result = await grocy.getTasks(options);
            break;
          case 'completeTask':
            if (!payload.taskId) {
              throw new Error('taskId is required');
            }
            result = await grocy.completeTask(payload.taskId, payload.data || {});
            break;
          case 'undoTask':
            if (!payload.taskId) {
              throw new Error('taskId is required');
            }
            result = await grocy.undoTask(payload.taskId);
            break;
          case 'addTask':
            if (!payload.name) {
              throw new Error('task name is required');
            }
            result = await grocy.addObject('tasks', payload);
            break;
          case 'editTask':
            if (!payload.id) {
              throw new Error('task id is required');
            }
            result = await grocy.editObject('tasks', payload.id, payload);
            break;
          case 'deleteTask':
            if (!payload.id) {
              throw new Error('task id is required');
            }
            result = await grocy.deleteObject('tasks', payload.id);
            break;

          default:
            node.status({ fill: 'red', shape: 'ring', text: 'invalid operation' });
            const error = new Error(`Invalid operation: ${operation}`);
            if (done) {
              done(error);
            } else {
              node.error(error, msg);
            }
            return;
        }

        // Update status and send response
        node.status({ fill: 'green', shape: 'dot', text: 'success' });
        msg.payload = result;
        send(msg);

        if (done) {
          done();
        }
      } catch (error) {
        node.status({ fill: 'red', shape: 'dot', text: error.message });
        if (done) {
          done(error);
        } else {
          node.error(error, msg);
        }
      }
    });

    node.on('close', function () {
      node.status({});
    });
  }

  RED.nodes.registerType('grocy-chores', GrocyChoresNode);
};
