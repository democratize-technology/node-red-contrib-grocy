const GrocyAPI = require('node-grocy').default;

module.exports = function (RED) {
  function GrocyApiNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Get configuration node
    this.server = RED.nodes.getNode(config.server);
    this.operation = config.operation;
    this.entityType = config.entityType;

    if (!this.server) {
      node.status({ fill: 'red', shape: 'ring', text: 'Missing server config' });
      return;
    }

    node.on('input', async function (msg, send, done) {
      // Set initial node status
      node.status({ fill: 'blue', shape: 'dot', text: 'requesting...' });

      // Operation and parameters for the API call
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

        // Execute the Grocy API operation
        switch (operation) {
          // System operations
          case 'getSystemInfo':
            result = await grocy.getSystemInfo();
            break;
          case 'getDbChangedTime':
            result = await grocy.getDbChangedTime();
            break;
          case 'getConfig':
            result = await grocy.getConfig();
            break;
          case 'getTime':
            result = await grocy.getTime(payload.offset);
            break;

          // Stock operations
          case 'getStock':
            result = await grocy.getStock();
            break;
          case 'getStockEntry':
            result = await grocy.getStockEntry(payload.entryId);
            break;
          case 'editStockEntry':
            result = await grocy.editStockEntry(payload.entryId, payload.data);
            break;
          case 'getVolatileStock':
            result = await grocy.getVolatileStock(payload.dueSoonDays);
            break;
          case 'getProductDetails':
            result = await grocy.getProductDetails(payload.productId);
            break;
          case 'getProductByBarcode':
            result = await grocy.getProductByBarcode(payload.barcode);
            break;
          case 'addProductToStock':
            result = await grocy.addProductToStock(payload.productId, payload.data);
            break;
          case 'addProductToStockByBarcode':
            result = await grocy.addProductToStockByBarcode(payload.barcode, payload.data);
            break;
          case 'consumeProduct':
            result = await grocy.consumeProduct(payload.productId, payload.data);
            break;
          case 'consumeProductByBarcode':
            result = await grocy.consumeProductByBarcode(payload.barcode, payload.data);
            break;
          case 'transferProduct':
            result = await grocy.transferProduct(payload.productId, payload.data);
            break;
          case 'inventoryProduct':
            result = await grocy.inventoryProduct(payload.productId, payload.data);
            break;
          case 'openProduct':
            result = await grocy.openProduct(payload.productId, payload.data);
            break;

          // Shopping list operations
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
            result = await grocy.addProductToShoppingList(payload);
            break;
          case 'removeProductFromShoppingList':
            result = await grocy.removeProductFromShoppingList(payload);
            break;

          // Generic entity operations
          case 'getObjects':
            result = await grocy.getObjects(payload.entity || node.entityType, options);
            break;
          case 'addObject':
            result = await grocy.addObject(payload.entity || node.entityType, payload.data);
            break;
          case 'getObject':
            result = await grocy.getObject(payload.entity || node.entityType, payload.objectId);
            break;
          case 'editObject':
            result = await grocy.editObject(payload.entity || node.entityType, payload.objectId, payload.data);
            break;
          case 'deleteObject':
            result = await grocy.deleteObject(payload.entity || node.entityType, payload.objectId);
            break;

          // Userfields operations
          case 'getUserfields':
            result = await grocy.getUserfields(payload.entity, payload.objectId);
            break;
          case 'setUserfields':
            result = await grocy.setUserfields(payload.entity, payload.objectId, payload.data);
            break;

          // File operations
          case 'getFile':
            result = await grocy.getFile(payload.group, payload.fileName, payload.options);
            break;
          case 'uploadFile':
            result = await grocy.uploadFile(payload.group, payload.fileName, payload.fileData);
            break;
          case 'deleteFile':
            result = await grocy.deleteFile(payload.group, payload.fileName);
            break;

          // User operations
          case 'getUsers':
            result = await grocy.getUsers(options);
            break;
          case 'createUser':
            result = await grocy.createUser(payload);
            break;
          case 'editUser':
            result = await grocy.editUser(payload.userId, payload.data);
            break;
          case 'deleteUser':
            result = await grocy.deleteUser(payload.userId);
            break;
          case 'getCurrentUser':
            result = await grocy.getCurrentUser();
            break;
          case 'getUserSettings':
            result = await grocy.getUserSettings();
            break;
          case 'getUserSetting':
            result = await grocy.getUserSetting(payload.settingKey);
            break;
          case 'setUserSetting':
            result = await grocy.setUserSetting(payload.settingKey, payload.data);
            break;

          // Recipe operations
          case 'addRecipeProductsToShoppingList':
            result = await grocy.addRecipeProductsToShoppingList(payload.recipeId, payload.data);
            break;
          case 'getRecipeFulfillment':
            result = await grocy.getRecipeFulfillment(payload.recipeId);
            break;
          case 'consumeRecipe':
            result = await grocy.consumeRecipe(payload.recipeId);
            break;
          case 'getAllRecipesFulfillment':
            result = await grocy.getAllRecipesFulfillment(options);
            break;

          // Chore operations
          case 'getChores':
            result = await grocy.getChores(options);
            break;
          case 'getChoreDetails':
            result = await grocy.getChoreDetails(payload.choreId);
            break;
          case 'executeChore':
            result = await grocy.executeChore(payload.choreId, payload.data);
            break;

          // Battery operations
          case 'getBatteries':
            result = await grocy.getBatteries(options);
            break;
          case 'getBatteryDetails':
            result = await grocy.getBatteryDetails(payload.batteryId);
            break;
          case 'chargeBattery':
            result = await grocy.chargeBattery(payload.batteryId, payload.data);
            break;

          // Task operations
          case 'getTasks':
            result = await grocy.getTasks(options);
            break;
          case 'completeTask':
            result = await grocy.completeTask(payload.taskId, payload.data);
            break;
          case 'undoTask':
            result = await grocy.undoTask(payload.taskId);
            break;

          // Calendar operations
          case 'getCalendar':
            result = await grocy.getCalendar();
            break;
          case 'getCalendarSharingLink':
            result = await grocy.getCalendarSharingLink();
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

  RED.nodes.registerType('grocy-api', GrocyApiNode, {
    credentials: {
      apiKey: { type: 'password' },
    },
  });
};
