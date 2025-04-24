module.exports = function(RED) {
    function GrocyConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.apiUrl = config.apiUrl;
        
        // Access the API key from credentials
        if (this.credentials) {
            this.apiKey = this.credentials.apiKey;
        }
    }
    
    // Register the node with credentials
    RED.nodes.registerType("grocy-config", GrocyConfigNode, {
        credentials: {
            apiKey: { type: "password", required: true }
        }
    });
};
