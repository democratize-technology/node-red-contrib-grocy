# Grocy Node-RED Logging System

## Overview

The Grocy Node-RED integration includes a comprehensive logging system that provides:

- **Request/Response Logging**: All API calls are logged with timing information
- **Correlation ID Tracking**: Each message flow gets a unique ID for end-to-end tracing
- **Performance Monitoring**: Automatic tracking of slow requests and bottlenecks
- **Audit Trail**: Security-sensitive operations are logged for compliance
- **Configurable Verbosity**: Control log levels per-node or globally
- **Sensitive Data Protection**: API keys and credentials are automatically sanitized

## Configuration

### Global Settings

Add to your Node-RED `settings.js`:

```javascript
// settings.js
module.exports = {
  // ... other settings
  
  grocyLogging: {
    enabled: true,                    // Enable/disable all logging
    logLevel: 'INFO',                 // DEBUG, INFO, WARN, ERROR, FATAL
    enableRequestLogging: true,       // Log API requests
    enableResponseLogging: true,      // Log API responses  
    enablePerformanceTracking: true,  // Track performance metrics
    enableAudit: true,                // Enable audit trail
    logRequestBody: false,            // Log request payloads (security risk)
    logResponseBody: false,           // Log response data (performance impact)
    performanceThresholds: {
      GET: 1000,                      // Warn if GET requests exceed 1s
      POST: 2000,                     // Warn if POST requests exceed 2s
      PUT: 2000,                      // Warn if PUT requests exceed 2s
      DELETE: 1500,                   // Warn if DELETE requests exceed 1.5s
      DEFAULT: 3000                   // Default threshold for other operations
    },
    slowRequestThreshold: 5000,      // Mark requests as slow after 5s
    correlationIdHeader: 'X-Correlation-ID'  // Header name for correlation IDs
  }
};
```

### Per-Node Configuration

Each node can override global settings:

```javascript
{
  "id": "node-123",
  "type": "grocy-api",
  "enableLogging": true,
  "logging": {
    "logLevel": "DEBUG",
    "enablePerformanceTracking": true,
    "enableAudit": false
  }
}
```

## Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures
- **FATAL**: Critical errors that may cause system failure
- **AUDIT**: Special level for security/compliance logging

## Log Format

Logs are structured as JSON for easy parsing:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "nodeId": "abc123",
  "nodeType": "grocy-api",
  "message": "API Request: GET /stock",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "GET",
  "endpoint": "/stock",
  "duration": "245ms"
}
```

## Correlation IDs

Every message flow gets a unique correlation ID that follows it through the system:

1. Generated when a message enters a Grocy node
2. Passed to all API calls
3. Included in all related log entries
4. Accessible via `msg._correlationId`

## Performance Monitoring

The system automatically tracks:

- **Request Duration**: Time taken for each API call
- **Slow Requests**: Requests exceeding configured thresholds
- **Success Rate**: Percentage of successful API calls
- **Error Distribution**: Types of errors encountered
- **Endpoint Metrics**: Performance per API endpoint

Access metrics programmatically:

```javascript
// In a function node
const metrics = node.getLogMetrics();
msg.payload = metrics;
return msg;
```

## Audit Trail

Security-sensitive operations are automatically logged:

- Configuration changes
- Authentication attempts
- Resource modifications
- Access to sensitive data

Audit logs include:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "AUDIT",
  "message": "RESOURCE_MODIFICATION",
  "resource": "/products/123",
  "action": "UPDATE",
  "user": "admin",
  "changes": {
    "before": "[REDACTED]",
    "after": "[REDACTED]"
  }
}
```

## Security

### Automatic Sanitization

The following data is automatically sanitized:

- API keys
- Passwords
- Authentication tokens
- Headers containing credentials
- Any field matching sensitive patterns

### Example Sanitized Log

```json
{
  "headers": {
    "GROCY-API-KEY": "[REDACTED]",
    "Content-Type": "application/json"
  },
  "apiKey": "[REDACTED]"
}
```

## Debugging

### Enable Debug Logging

For a specific node:

```javascript
// In node configuration
{
  "logging": {
    "logLevel": "DEBUG",
    "logRequestBody": true,
    "logResponseBody": true
  }
}
```

### View Logs in Node-RED

Logs appear in:
- Node-RED debug panel (for node.log/node.error calls)
- Node-RED console output
- System logs (if configured)

### Filter by Correlation ID

Find all logs for a specific flow:

```bash
grep "f47ac10b-58cc-4372-a567-0e02b2c3d479" /path/to/logs
```

## Performance Impact

Logging has minimal performance impact:

- ~1-2ms overhead per API call
- Request/response bodies not logged by default
- Asynchronous logging doesn't block operations
- Automatic log rotation prevents disk issues

## Troubleshooting

### No Logs Appearing

1. Check if logging is enabled globally
2. Verify node-specific configuration
3. Check log level settings
4. Ensure Node-RED has write permissions

### Missing Correlation IDs

- IDs are generated automatically
- Check if `msg._correlationId` exists
- Verify middleware is properly initialized

### Performance Issues

1. Disable response body logging
2. Increase log level to WARN or ERROR
3. Reduce performance tracking frequency
4. Check disk I/O for log writes

## Examples

### Basic Configuration

```javascript
// Enable logging with defaults
module.exports = {
  grocyLogging: {
    enabled: true,
    logLevel: 'INFO'
  }
};
```

### Production Configuration

```javascript
// Optimized for production
module.exports = {
  grocyLogging: {
    enabled: true,
    logLevel: 'WARN',
    enableAudit: true,
    enablePerformanceTracking: true,
    logRequestBody: false,
    logResponseBody: false,
    performanceThresholds: {
      GET: 2000,
      POST: 3000,
      DEFAULT: 5000
    }
  }
};
```

### Development Configuration

```javascript
// Maximum verbosity for debugging
module.exports = {
  grocyLogging: {
    enabled: true,
    logLevel: 'DEBUG',
    enableAudit: true,
    enablePerformanceTracking: true,
    logRequestBody: true,
    logResponseBody: true,
    performanceThresholds: {
      GET: 500,
      POST: 1000,
      DEFAULT: 1500
    }
  }
};
```

## API Reference

### Logger Methods

```javascript
// Available on each node
node.logInfo(message, data);
node.logWarn(message, data);
node.logError(message, data);
node.logDebug(message, data);
node.logAudit(message, data);
node.getLogMetrics();
```

### Correlation ID

```javascript
// Access correlation ID in function nodes
const correlationId = msg._correlationId;
```

### Performance Metrics

```javascript
// Get current metrics
const metrics = node.getLogMetrics();
// Returns:
{
  totalRequests: 1234,
  successfulRequests: 1200,
  failedRequests: 34,
  averageDuration: "245ms",
  successRate: "97.24%",
  slowRequestRate: "2.5%",
  errorsByType: {
    "HTTP_404": 10,
    "TIMEOUT": 5
  }
}
```

## Best Practices

1. **Production**: Use WARN or ERROR level to reduce noise
2. **Development**: Use DEBUG level for troubleshooting
3. **Security**: Never enable request/response body logging in production
4. **Performance**: Monitor slow request rates and adjust thresholds
5. **Audit**: Enable audit logging for compliance requirements
6. **Correlation**: Use correlation IDs to trace issues across flows
7. **Metrics**: Regularly review performance metrics for optimization
8. **Rotation**: Configure log rotation to prevent disk issues

## Integration with External Systems

### ELK Stack

Logs are JSON formatted for easy ingestion into Elasticsearch:

```yaml
# Logstash configuration
input {
  file {
    path => "/var/log/node-red/*.log"
    codec => json
  }
}

filter {
  if [nodeType] == "grocy-api" {
    # Process Grocy logs
  }
}
```

### Splunk

Use the correlation ID for transaction tracking:

```
index=node-red nodeType="grocy-*" correlationId="f47ac10b-*"
| transaction correlationId
| timechart avg(duration)
```

### CloudWatch

Configure Node-RED to send logs to CloudWatch:

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatchLogs();

// In settings.js
grocyLogging: {
  outputHandler: (log) => {
    // Send to CloudWatch
  }
}
```