const GrocyClient = require('./grocy-client');
const ErrorHandler = require('./error-handler');

/**
 * Base class for Grocy Node-RED nodes providing common functionality
 */
class BaseGrocyNode {
  constructor(RED, node, config) {
    this.RED = RED;
    this.node = node;
    this.config = config;
    this.client = null;
    
    // Don't initialize immediately - let the extending node handle it
  }

  /**
   * Initialize the node with common setup
   */
  initialize() {
    // Get server configuration
    const serverConfig = this.RED.nodes.getNode(this.config.server);
    
    if (!serverConfig) {
      this.setStatus('red', 'ring', 'Missing server config');
      return;
    }

    try {
      // Initialize Grocy client
      this.client = new GrocyClient(serverConfig);
      this.setStatus('green', 'ring', 'ready');
    } catch (error) {
      this.setStatus('red', 'ring', 'Invalid config');
      return;
    }

    // Set up input handler
    this.node.on('input', (msg, send, done) => {
      this.handleInput(msg, send, done);
    });

    // Set up close handler
    this.node.on('close', () => {
      this.handleClose();
    });
  }

  /**
   * Handle incoming messages
   * @param {Object} msg - The message object
   * @param {Function} send - The send function
   * @param {Function} done - The done callback
   */
  async handleInput(msg, send, done) {
    if (!this.client) {
      const error = new Error('Node not properly initialized');
      ErrorHandler.handle(error, this.node, msg, done);
      return;
    }

    // Set processing status
    this.setStatus('blue', 'dot', 'processing...');

    try {
      const result = await this.processMessage(msg);
      
      // Set success status and send result
      this.setStatus('green', 'dot', 'success');
      msg.payload = result;
      send(msg);

      if (done) {
        done();
      }
    } catch (error) {
      ErrorHandler.handle(error, this.node, msg, done);
    }
  }

  /**
   * Process the message - to be implemented by subclasses
   * @param {Object} msg - The message object
   * @returns {Promise<*>} The result
   */
  async processMessage(msg) {
    throw new Error('processMessage must be implemented by subclass');
  }

  /**
   * Handle node closure
   */
  handleClose() {
    this.setStatus({});
    this.client = null;
  }

  /**
   * Set node status
   * @param {string} fill - Status color
   * @param {string} shape - Status shape
   * @param {string} text - Status text
   */
  setStatus(fill, shape, text) {
    if (typeof fill === 'object') {
      this.node.status(fill);
    } else {
      this.node.status({ fill, shape, text });
    }
  }

  /**
   * Get the operation from message or config
   * @param {Object} msg - The message object
   * @returns {string} The operation name
   */
  getOperation(msg) {
    return msg.operation || this.config.operation;
  }

  /**
   * Get the entity type from message or config
   * @param {Object} msg - The message object
   * @returns {string} The entity type
   */
  getEntityType(msg) {
    return msg.entity || this.config.entityType;
  }

  /**
   * Get the payload from message
   * @param {Object} msg - The message object
   * @returns {Object} The payload
   */
  getPayload(msg) {
    return msg.payload || {};
  }

  /**
   * Get the options from message
   * @param {Object} msg - The message object
   * @returns {Object} The options
   */
  getOptions(msg) {
    return msg.options || {};
  }

  /**
   * Create a standardized error
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @returns {Error} The error
   */
  createError(message, type = 'unknown') {
    const error = new Error(message);
    error.type = type;
    return error;
  }

  /**
   * Log debug information (only in development)
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      this.node.debug(`${message}${data ? ': ' + JSON.stringify(data) : ''}`);
    }
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   */
  warn(message) {
    this.node.warn(message);
  }

  /**
   * Get client connection info for debugging
   * @returns {Object} Connection information
   */
  getConnectionInfo() {
    return this.client ? this.client.getConnectionInfo() : null;
  }
}

module.exports = BaseGrocyNode;