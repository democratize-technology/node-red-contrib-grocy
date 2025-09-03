/**
 * Mock utilities for Node-RED runtime testing
 */

class MockNode {
  constructor(config) {
    this.id = config.id || 'test-node-id';
    this.type = config.type || 'test-node';
    this.name = config.name || '';
    this.config = config;
    this.status = { fill: '', shape: '', text: '' };
    this.messages = [];
    this.errors = [];
    this.logs = [];
    this.eventHandlers = {};
  }

  // Node-RED API methods
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }

  send(msg) {
    this.messages.push(msg);
  }

  error(error, msg) {
    this.errors.push({ error, msg });
  }

  warn(message) {
    this.logs.push({ level: 'warn', message });
  }

  log(message) {
    this.logs.push({ level: 'log', message });
  }

  debug(message) {
    this.logs.push({ level: 'debug', message });
  }

  status(statusObj) {
    this.status = { ...this.status, ...statusObj };
  }

  // Test helper methods
  clearMessages() {
    this.messages = [];
  }

  clearErrors() {
    this.errors = [];
  }

  clearLogs() {
    this.logs = [];
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }

  getLastError() {
    return this.errors[this.errors.length - 1];
  }

  getLastStatus() {
    return this.status;
  }
}

class MockRED {
  constructor() {
    this.nodes = new Map();
    this.nodeTypes = new Map();
  }

  // Node registration
  registerType(type, constructor, options = {}) {
    this.nodeTypes.set(type, { constructor, options });
  }

  // Node creation and management
  createNode(node, config) {
    Object.assign(node, new MockNode(config));
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  // Node factory for tests
  createTestNode(type, config = {}) {
    const nodeType = this.nodeTypes.get(type);
    if (!nodeType) {
      throw new Error(`Node type '${type}' not registered`);
    }

    const node = new nodeType.constructor(config);
    this.createNode(node, config);
    this.addNode(node);
    return node;
  }

  // Helper methods for tests
  clearNodes() {
    this.nodes.clear();
  }

  clearNodeTypes() {
    this.nodeTypes.clear();
  }

  reset() {
    this.clearNodes();
    this.clearNodeTypes();
  }
}

// Factory function to create a mock RED instance
function createMockRED() {
  return new MockRED();
}

// Mock credential system
function createMockCredentials(nodeId, credentials = {}) {
  return {
    get: (key) => credentials[key],
    add: (key, value) => { credentials[key] = value; },
    delete: (key) => delete credentials[key],
    clean: () => Object.keys(credentials).forEach(key => delete credentials[key])
  };
}

module.exports = {
  MockNode,
  MockRED,
  createMockRED,
  createMockCredentials
};