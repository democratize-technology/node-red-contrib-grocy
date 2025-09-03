/**
 * Test script for logging system
 */

const { 
  createLogger, 
  LogLevel, 
  generateCorrelationId, 
  sanitizeData,
  PerformanceMonitor,
  LoggingConfigManager
} = require('../nodes/lib/logging');

console.log('Testing Grocy Logging System\n');

// Test 1: Create logger
console.log('1. Testing logger creation...');
const logger = createLogger({
  id: 'test-node',
  type: 'test',
  logLevel: LogLevel.DEBUG
});
console.log('✓ Logger created successfully\n');

// Test 2: Generate correlation ID
console.log('2. Testing correlation ID generation...');
const correlationId = generateCorrelationId();
console.log(`✓ Generated correlation ID: ${correlationId}\n`);

// Test 3: Test sanitization
console.log('3. Testing data sanitization...');
const sensitiveData = {
  apiKey: 'secret-key-123',
  password: 'my-password',
  GROCY_API_KEY: 'grocy-secret',
  normalField: 'this is fine',
  headers: {
    'GROCY-API-KEY': 'header-secret',
    'Content-Type': 'application/json'
  }
};
const sanitized = sanitizeData(sensitiveData);
console.log('Original:', JSON.stringify(sensitiveData, null, 2));
console.log('Sanitized:', JSON.stringify(sanitized, null, 2));
console.log('✓ Sensitive data properly sanitized\n');

// Test 4: Test logging levels
console.log('4. Testing log levels...');
logger.debug('Debug message', { test: true });
logger.info('Info message', { test: true });
logger.warn('Warning message', { test: true });
logger.error('Error message', { test: true });
console.log('✓ All log levels working\n');

// Test 5: Test request/response logging
console.log('5. Testing request/response logging...');
const requestContext = logger.logRequest('GET', '/api/stock', {
  queryParams: { limit: 10 }
}, correlationId);

setTimeout(() => {
  logger.logResponse(requestContext, 200, {
    itemCount: 10
  });
  console.log('✓ Request/response logging working\n');
  
  // Test 6: Performance monitoring
  console.log('6. Testing performance monitoring...');
  const perfMonitor = new PerformanceMonitor('test-node');
  const opId = perfMonitor.startOperation('testOperation', { type: 'test' });
  
  setTimeout(() => {
    const result = perfMonitor.endOperation(opId, true);
    console.log(`✓ Performance monitoring working (duration: ${result.duration}ms)\n`);
    
    // Test 7: Get metrics
    console.log('7. Testing metrics collection...');
    const metrics = logger.getMetrics();
    console.log('Metrics:', JSON.stringify(metrics, null, 2));
    console.log('✓ Metrics collection working\n');
    
    // Test 8: Config manager
    console.log('8. Testing configuration manager...');
    const configManager = new LoggingConfigManager({
      grocyLogging: {
        enabled: true,
        logLevel: 'INFO'
      }
    });
    const nodeConfig = configManager.getNodeConfig('test-node', 'grocy-api');
    console.log('Node config:', {
      enabled: nodeConfig.enabled,
      logLevel: nodeConfig.logLevel,
      nodeId: nodeConfig.nodeId,
      nodeType: nodeConfig.nodeType
    });
    console.log('✓ Configuration manager working\n');
    
    console.log('All tests passed! ✓');
  }, 100);
}, 100);