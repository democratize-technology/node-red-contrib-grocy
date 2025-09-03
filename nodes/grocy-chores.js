const SpecializedGrocyNode = require('./lib/specialized-node');
const { ChoresOperations } = require('./lib/handlers');

module.exports = function (RED) {
  function GrocyChoresNode(config) {
    RED.nodes.createNode(this, config);
    
    // Create specialized node instance
    const nodeInstance = new SpecializedGrocyNode(RED, this, config, ChoresOperations);
    
    // Initialize the node
    nodeInstance.initialize();
  }

  RED.nodes.registerType('grocy-chores', GrocyChoresNode);
};
