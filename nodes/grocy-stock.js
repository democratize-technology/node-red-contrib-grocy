const SpecializedGrocyNode = require('./lib/specialized-node');
const { StockOperations } = require('./lib/handlers');

module.exports = function (RED) {
  function GrocyStockNode(config) {
    RED.nodes.createNode(this, config);
    
    // Create specialized node instance
    const nodeInstance = new SpecializedGrocyNode(RED, this, config, StockOperations);
    
    // Initialize the node
    nodeInstance.initialize();
  }

  RED.nodes.registerType('grocy-stock', GrocyStockNode);
};
