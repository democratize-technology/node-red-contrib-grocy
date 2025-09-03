module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
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
  
  // Setup files (commented out initially to avoid issues)
  // setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Module paths and aliases
  moduleDirectories: ['node_modules', '<rootDir>/nodes'],
  
  // Test timeout (increased for Node-RED tests)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Transform configuration (for ES modules)
  transform: {},
  
  // Module name mapping for mocking ES modules
  moduleNameMapper: {
    '^node-grocy$': '<rootDir>/test/mocks/node-grocy-mock.js'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Handle dynamic imports and VM modules
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};