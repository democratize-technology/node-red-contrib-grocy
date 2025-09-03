module.exports = {
  // Test environment with proper Node.js setup
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: process.env.NODE_ENV !== 'ci',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'nodes/**/*.js',
    'index.js',
    '!**/node_modules/**',
    '!coverage/**',
    '!test/**'
  ],
  
  // Coverage thresholds (disabled for initial setup)
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },
  
  // Setup files for Node-RED environment
  setupFiles: ['<rootDir>/test/jest.setup.js'],
  
  // Module paths and aliases
  moduleDirectories: ['node_modules', '<rootDir>/nodes'],
  
  // Test timeout (reduced for CI)
  testTimeout: process.env.NODE_ENV === 'ci' ? 10000 : 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Transform configuration - use default for CommonJS
  transform: {},
  
  // Module name mapping for mocking ES modules
  moduleNameMapper: {
    '^node-grocy$': '<rootDir>/test/mocks/node-grocy-mock.js'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Force CommonJS for Node-RED compatibility
  extensionsToTreatAsEsm: [],
  
  // Handle dynamic imports and VM modules
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  
  // Force CommonJS module loading
  preset: null
};