/**
 * Jest setup file for Node-RED testing environment
 * Configures proper CommonJS loading for Node-RED components
 */

// Configure Node.js environment variables for testing
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Increase timeout for Node-RED tests
jest.setTimeout(15000);

// Initialize node-red-node-test-helper
try {
  const helper = require('node-red-node-test-helper');
  // Initialize with Node-RED - this is required for the helper to work
  helper.init(require.resolve('node-red'));
  console.log('Node-RED test helper initialized successfully');
} catch (error) {
  console.error('Failed to initialize Node-RED test helper:', error.message);
}