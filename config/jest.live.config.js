const path = require('path');
const root = path.resolve(__dirname, '..');

module.exports = {
  testEnvironment: 'node',
  rootDir: root,
  testMatch: ['<rootDir>/test/live/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  transform: {},
  // No moduleNameMapper — we want the real GrocyAPIWrapper, not the node-grocy mock
  setupFiles: ['<rootDir>/test/live/setup.js'],
  moduleFileExtensions: ['js', 'json'],
};
