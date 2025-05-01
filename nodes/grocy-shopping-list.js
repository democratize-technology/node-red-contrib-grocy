const GrocyAPI = require('node-grocy').default;

module.exports = function (RED) {
  function GrocyShoppingListNode(config) {
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

        // Execute the Grocy shopping list operation
        switch (operation) {
          case 'getShoppingLists':
            // Get all shopping lists using the objects endpoint
            result = await grocy.getObjects('shopping_lists');
            break;
          case 'getShoppingListItems':
            // Get shopping list items (optionally filtered by shopping list id)
            let options = {};
            if (payload.shoppingListId) {
              options.query = `shopping_list_id=${payload.shoppingListId}`;
            }
            result = await grocy.getObjects('shopping_list', options);
            break;
          case 'addMissingProductsToShoppingList':
            result = await grocy.addMissingProductsToShoppingList(payload);
            break;
          case 'addOverdueProductsToShoppingList':
            result = await grocy.addOverdueProductsToShoppingList(payload);
            break;
          case 'addExpiredProductsToShoppingList':
            result = await grocy.addExpiredProductsToShoppingList(payload);
            break;
          case 'clearShoppingList':
            result = await grocy.clearShoppingList(payload);
            break;
          case 'addProductToShoppingList':
            if (!payload.product_id) {
              throw new Error('product_id is required');
            }
            result = await grocy.addProductToShoppingList(payload);
            break;
          case 'removeProductFromShoppingList':
            if (!payload.product_id) {
              throw new Error('product_id is required');
            }
            result = await grocy.removeProductFromShoppingList(payload);
            break;
          case 'createShoppingList':
            // Create a new shopping list
            if (!payload.name) {
              throw new Error('name is required');
            }
            result = await grocy.addObject('shopping_lists', payload);
            break;
          case 'updateShoppingList':
            // Update a shopping list
            if (!payload.id) {
              throw new Error('id is required');
            }
            result = await grocy.editObject('shopping_lists', payload.id, payload);
            break;
          case 'deleteShoppingList':
            // Delete a shopping list
            if (!payload.id) {
              throw new Error('id is required');
            }
            result = await grocy.deleteObject('shopping_lists', payload.id);
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

  RED.nodes.registerType('grocy-shopping-list', GrocyShoppingListNode);
};
