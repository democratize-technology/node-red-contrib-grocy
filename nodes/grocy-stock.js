const GrocyAPI = require('node-grocy');

module.exports = function (RED) {
  function GrocyStockNode(config) {
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

        // Execute the Grocy stock operation
        switch (operation) {
          case 'getStock':
            result = await grocy.getStock();
            break;
          case 'getVolatileStock':
            result = await grocy.getVolatileStock(payload.dueSoonDays);
            break;
          case 'getProductDetails':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.getProductDetails(payload.productId);
            break;
          case 'getProductByBarcode':
            if (!payload.barcode) {
              throw new Error('barcode is required');
            }
            result = await grocy.getProductByBarcode(payload.barcode);
            break;
          case 'addProductToStock':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.addProductToStock(payload.productId, payload.data || {});
            break;
          case 'addProductToStockByBarcode':
            if (!payload.barcode) {
              throw new Error('barcode is required');
            }
            result = await grocy.addProductToStockByBarcode(payload.barcode, payload.data || {});
            break;
          case 'consumeProduct':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.consumeProduct(payload.productId, payload.data || {});
            break;
          case 'consumeProductByBarcode':
            if (!payload.barcode) {
              throw new Error('barcode is required');
            }
            result = await grocy.consumeProductByBarcode(payload.barcode, payload.data || {});
            break;
          case 'inventoryProduct':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.inventoryProduct(payload.productId, payload.data || {});
            break;
          case 'transferProduct':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.transferProduct(payload.productId, payload.data || {});
            break;
          case 'openProduct':
            if (!payload.productId) {
              throw new Error('productId is required');
            }
            result = await grocy.openProduct(payload.productId, payload.data || {});
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

  RED.nodes.registerType('grocy-stock', GrocyStockNode);
};
