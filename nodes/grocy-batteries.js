const SpecializedGrocyNode = require('./lib/specialized-node');
const { BatteriesOperations } = require('./lib/handlers');

module.exports = function (RED) {
  function GrocyBatteriesNode(config) {
    RED.nodes.createNode(this, config);
    
    // Create specialized node instance
    const nodeInstance = new SpecializedGrocyNode(RED, this, config, BatteriesOperations);
    
    // Initialize the node
    nodeInstance.initialize();
  }

  RED.nodes.registerType('grocy-batteries', GrocyBatteriesNode);
};
