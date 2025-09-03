module.exports = function(RED) {
    function GrocyConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.apiUrl = config.apiUrl;
        this.verifySsl = config.verifySsl !== false; // Default to true if not set
        this.allowSelfSigned = config.allowSelfSigned === true; // Default to false
        this.timeout = config.timeout || 30000; // Default 30 seconds
        
        // Log security configuration
        const securityConfig = [];
        
        if (this.apiUrl) {
            const url = new URL(this.apiUrl);
            const isLocal = url.hostname === 'localhost' || 
                           url.hostname === '127.0.0.1' ||
                           url.hostname.startsWith('192.168.') ||
                           url.hostname.startsWith('10.') ||
                           url.hostname.startsWith('172.');
            
            if (url.protocol === 'http:') {
                if (!isLocal) {
                    this.warn(
                        '⚠️ SECURITY: Using HTTP connection to ' + url.hostname + '. ' +
                        'API key and data are transmitted unencrypted. ' +
                        'Consider using HTTPS for better security.'
                    );
                    securityConfig.push('HTTP (unencrypted)');
                } else {
                    this.log('Using HTTP for local/private network at ' + url.hostname);
                    securityConfig.push('HTTP (local network)');
                }
            } else if (url.protocol === 'https:') {
                if (!this.verifySsl) {
                    this.warn(
                        '🔓 SSL verification disabled for ' + url.hostname + '. ' +
                        'Certificate validation bypassed - use only for trusted networks.'
                    );
                    securityConfig.push('HTTPS (no verification)');
                } else if (this.allowSelfSigned) {
                    this.log('HTTPS with self-signed certificates allowed for ' + url.hostname);
                    securityConfig.push('HTTPS (self-signed allowed)');
                } else {
                    this.log('HTTPS with full certificate verification for ' + url.hostname);
                    securityConfig.push('HTTPS (verified)');
                }
            }
        }
        
        // Log complete security posture
        if (securityConfig.length > 0) {
            this.log('Security configuration: ' + securityConfig.join(', '));
        }
        
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
