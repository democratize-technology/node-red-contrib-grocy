const SpecializedGrocyNode = require('./lib/specialized-node');
const { ShoppingListOperations } = require('./lib/handlers');

module.exports = function (RED) {
  function GrocyShoppingListNode(config) {
    RED.nodes.createNode(this, config);
    
    // Create specialized node instance
    const nodeInstance = new SpecializedGrocyNode(RED, this, config, ShoppingListOperations);
    
    // Initialize the node
    nodeInstance.initialize();
  }

  RED.nodes.registerType('grocy-shopping-list', GrocyShoppingListNode);
};
