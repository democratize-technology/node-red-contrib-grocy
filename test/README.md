# Test Infrastructure for Node-RED Grocy Contribution

This directory contains comprehensive test infrastructure for the `node-red-contrib-grocy` package.

## Test Structure

```
test/
├── README.md                    # This file
├── setup.js                     # Global test setup
├── unit/                        # Unit tests
│   └── nodes/                   # Node-specific unit tests
│       ├── grocy-api.test.js
│       ├── grocy-config.test.js
│       ├── grocy-stock.test.js
│       ├── grocy-shopping-list.test.js
│       ├── grocy-chores.test.js
│       └── grocy-batteries.test.js
├── integration/                 # Integration tests
│   ├── api-integration.test.js  # API integration tests
│   └── flow-integration.test.js # Complete flow tests
├── mocks/                       # Mock utilities
│   ├── node-red-runtime.js      # Node-RED runtime mocks
│   └── grocy-api.js             # Grocy API mocks
└── fixtures/                    # Test data
    └── test-data.js             # Sample test data and configurations
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (for development)
npm run test:watch

# Run tests for CI (coverage + no watch)
npm run test:ci
```

### Coverage Reports

```bash
# Generate coverage report with nyc
npm run coverage

# Generate HTML coverage report
npm run coverage:report
```

Coverage reports will be generated in the `coverage/` directory.

## Test Framework

- **Jest**: Primary testing framework
- **node-red-node-test-helper**: Node-RED specific testing utilities
- **nock**: HTTP mocking for API integration tests
- **supertest**: HTTP assertion library
- **nyc**: Code coverage reporting

## Writing Tests

### Unit Tests

Unit tests focus on testing individual nodes in isolation:

```javascript
const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const apiNode = require('../../../nodes/grocy-api.js');

describe('grocy-api node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  it('should process valid messages', (done) => {
    const flow = [/* node configurations */];
    helper.load([configNode, apiNode], flow, () => {
      const n1 = helper.getNode('node-id');
      // Test logic here
      done();
    });
  });
});
```

### Integration Tests

Integration tests verify complete workflows and API interactions:

```javascript
const nock = require('nock');
const { MockGrocyAPI } = require('../mocks/grocy-api');

describe('API Integration', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should handle complete workflow', (done) => {
    const mockApi = new MockGrocyAPI();
    mockApi.mockSystemInfo(sampleData.systemInfo);
    
    // Test complete flow
    done();
  });
});
```

## Mock Utilities

### Node-RED Runtime Mocks

The `mocks/node-red-runtime.js` provides mock utilities for testing Node-RED nodes:

- `MockNode`: Simulates Node-RED node behavior
- `MockRED`: Mock Node-RED runtime
- `createMockRED()`: Factory for creating mock runtime instances
- `createMockCredentials()`: Mock credential management

### Grocy API Mocks

The `mocks/grocy-api.js` provides comprehensive mocking for Grocy API:

- `MockGrocyAPI`: Complete API mocking class
- Mock methods for all supported operations
- Sample test data for different scenarios
- Error response mocking

### Example Usage

```javascript
const { MockGrocyAPI, sampleData } = require('../mocks/grocy-api');

const mockApi = new MockGrocyAPI('http://localhost:9283', 'test-key');
mockApi.mockSystemInfo(sampleData.systemInfo);
mockApi.mockStock(sampleData.stock);
mockApi.mockError('/api/invalid', 404, 'Not Found');
```

## Test Data Fixtures

The `fixtures/test-data.js` contains:

- Sample configurations for all node types
- Test message payloads
- Expected API responses
- Error scenarios
- Complete flow definitions

## Coverage Requirements

The test infrastructure enforces minimum coverage thresholds:

- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 75%

## Node-RED Testing Patterns

### Testing Node Initialization

```javascript
it('should be loaded with valid configuration', (done) => {
  helper.load([configNode, apiNode], flow, () => {
    const n1 = helper.getNode('node-id');
    expect(n1).toBeDefined();
    expect(n1.name).toBe('Expected Name');
    done();
  });
});
```

### Testing Message Processing

```javascript
it('should process messages correctly', (done) => {
  helper.load([configNode, apiNode], flow, () => {
    const n1 = helper.getNode('node-id');
    
    n1.on('input', (msg) => {
      // Verify message processing
      done();
    });

    n1.receive(testMessage);
  });
});
```

### Testing Error Handling

```javascript
it('should handle errors gracefully', (done) => {
  helper.load([configNode, apiNode], flow, () => {
    const n1 = helper.getNode('node-id');
    
    let errorCaught = false;
    n1.on('call:error', (call) => {
      expect(call.args[0]).toBeInstanceOf(Error);
      errorCaught = true;
    });

    n1.receive(invalidMessage);
    
    setTimeout(() => {
      expect(errorCaught).toBe(true);
      done();
    }, 100);
  });
});
```

### Testing Status Updates

```javascript
it('should update node status correctly', (done) => {
  helper.load([configNode, apiNode], flow, () => {
    const n1 = helper.getNode('node-id');
    
    n1.receive(testMessage);
    
    setTimeout(() => {
      expect(n1.status.calls).toContainEqual([{
        fill: 'green',
        shape: 'dot',
        text: 'success'
      }]);
      done();
    }, 100);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not affect others
2. **Async Handling**: Use proper async/await or done callbacks
3. **Cleanup**: Always clean up resources in afterEach hooks
4. **Mocking**: Mock external dependencies consistently
5. **Coverage**: Write tests for both happy paths and error scenarios
6. **Naming**: Use descriptive test names that explain what is being tested
7. **Arrange-Act-Assert**: Structure tests clearly
8. **Error Testing**: Test error conditions explicitly
9. **Edge Cases**: Include boundary conditions and edge cases
10. **Integration**: Test complete workflows, not just individual functions

## Debugging Tests

### Common Issues

1. **Async Timing**: Use appropriate timeouts for async operations
2. **Mock Cleanup**: Ensure mocks are properly cleaned up between tests
3. **Node-RED Lifecycle**: Properly start/stop Node-RED test server
4. **HTTP Mocking**: Clear nock mocks between tests

### Debug Tips

```bash
# Run single test file
npm test -- test/unit/nodes/grocy-api.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests with debugging
npm test -- --runInBand --verbose
```

## Contributing

When adding new nodes or features:

1. Add corresponding unit tests in `test/unit/nodes/`
2. Update integration tests if needed
3. Add mock methods for new API operations
4. Include test data fixtures for new scenarios
5. Ensure coverage thresholds are met
6. Update this documentation as needed

## Continuous Integration

The test infrastructure is designed to work with CI/CD pipelines:

- Use `npm run test:ci` for CI environments
- Coverage reports are generated in multiple formats
- Tests run without watch mode in CI
- Exit codes properly indicate test success/failure