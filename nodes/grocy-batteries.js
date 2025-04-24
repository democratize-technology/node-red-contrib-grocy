const GrocyAPI = require('node-grocy');

module.exports = function (RED) {
  function GrocyBatteriesNode(config) {
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

        // Execute the Grocy batteries operation
        switch (operation) {
          case 'getBatteries':
            result = await grocy.getBatteries(options);
            break;
          case 'getBatteryDetails':
            if (!payload.batteryId) {
              throw new Error('batteryId is required');
            }
            result = await grocy.getBatteryDetails(payload.batteryId);
            break;
          case 'chargeBattery':
            if (!payload.batteryId) {
              throw new Error('batteryId is required');
            }
            result = await grocy.chargeBattery(payload.batteryId, payload.data || {});
            break;
          case 'addBattery':
            if (!payload.name) {
              throw new Error('battery name is required');
            }
            result = await grocy.addObject('batteries', payload);
            break;
          case 'editBattery':
            if (!payload.id) {
              throw new Error('battery id is required');
            }
            result = await grocy.editObject('batteries', payload.id, payload);
            break;
          case 'deleteBattery':
            if (!payload.id) {
              throw new Error('battery id is required');
            }
            result = await grocy.deleteObject('batteries', payload.id);
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

  RED.nodes.registerType('grocy-batteries', GrocyBatteriesNode);
};
