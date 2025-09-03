const helper = require('node-red-node-test-helper');

// Global setup for all tests
beforeAll(() => {
  // Initialize Node-RED test helper
  helper.init(require.resolve('node-red'));
});

afterAll(() => {
  // Cleanup
  helper.stop();
});

beforeEach(() => {
  // Start fresh for each test
  helper.startServer();
});

afterEach(() => {
  // Clean up after each test
  helper.unload();
  helper.stop();
});

// Global test timeout
jest.setTimeout(10000);

// Console warnings cleanup
const originalConsoleWarn = console.warn;
console.warn = (message) => {
  // Filter out known Node-RED warnings during tests
  if (message.includes('deprecated') || message.includes('experimental')) {
    return;
  }
  originalConsoleWarn(message);
};