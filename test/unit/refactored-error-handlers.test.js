/**
 * Comprehensive tests for refactored error handler modules
 * Ensures each module works individually and the unified system maintains API compatibility
 */

// Import all refactored error handler modules
const ErrorClassifier = require('../../nodes/lib/error-handlers/classifier');
const ErrorFormatter = require('../../nodes/lib/error-handlers/formatter');
const ErrorFactory = require('../../nodes/lib/error-handlers/factory');
const NetworkErrorHandler = require('../../nodes/lib/error-handlers/network-handler');
const HttpErrorHandler = require('../../nodes/lib/error-handlers/http-handler');
const AuthErrorHandler = require('../../nodes/lib/error-handlers/auth-handler');
const ValidationErrorHandler = require('../../nodes/lib/error-handlers/validation-handler');
const ConfigErrorHandler = require('../../nodes/lib/error-handlers/config-handler');
const TimeoutErrorHandler = require('../../nodes/lib/error-handlers/timeout-handler');
const RateLimitErrorHandler = require('../../nodes/lib/error-handlers/ratelimit-handler');
const ParsingErrorHandler = require('../../nodes/lib/error-handlers/parsing-handler');
const OperationErrorHandler = require('../../nodes/lib/error-handlers/operation-handler');

// Import the unified interface
const ErrorHandler = require('../../nodes/lib/error-handler');
const { ErrorClassifier: UnifiedClassifier } = require('../../nodes/lib/error-handlers');

describe('Refactored Error Handler Modules', () => {
  
  describe('Module Structure and Exports', () => {
    test('should export all required error handler modules', () => {
      const errorHandlers = require('../../nodes/lib/error-handlers');
      
      expect(errorHandlers.ErrorClassifier).toBeDefined();
      expect(errorHandlers.ErrorFormatter).toBeDefined();
      expect(errorHandlers.ErrorFactory).toBeDefined();
      expect(errorHandlers.NetworkErrorHandler).toBeDefined();
      expect(errorHandlers.HttpErrorHandler).toBeDefined();
      expect(errorHandlers.AuthErrorHandler).toBeDefined();
      expect(errorHandlers.ValidationErrorHandler).toBeDefined();
      expect(errorHandlers.ConfigErrorHandler).toBeDefined();
      expect(errorHandlers.TimeoutErrorHandler).toBeDefined();
      expect(errorHandlers.RateLimitErrorHandler).toBeDefined();
      expect(errorHandlers.ParsingErrorHandler).toBeDefined();
      expect(errorHandlers.OperationErrorHandler).toBeDefined();
    });

    test('should maintain unified ErrorHandler API compatibility', () => {
      // Check that main ErrorHandler still has all public methods
      expect(typeof ErrorHandler.handle).toBe('function');
      expect(typeof ErrorHandler.formatError).toBe('function');
      expect(typeof ErrorHandler.isNetworkError).toBe('function');
      expect(typeof ErrorHandler.isAuthError).toBe('function');
      expect(typeof ErrorHandler.isValidationError).toBe('function');
      expect(typeof ErrorHandler.sanitizeForDisplay).toBe('function');
      expect(typeof ErrorHandler.validationError).toBe('function');
      expect(typeof ErrorHandler.operationError).toBe('function');
    });
  });

  describe('ErrorClassifier Module', () => {
    test('should classify network errors correctly', () => {
      const networkErrors = [
        { code: 'ECONNREFUSED' },
        { code: 'ENOTFOUND' },
        { code: 'ETIMEDOUT' },
        { code: 'ECONNRESET' },
        { code: 'EHOSTUNREACH' },
        { code: 'ENETUNREACH' },
        { message: 'getaddrinfo ENOTFOUND example.com' },
        { message: 'connect ECONNREFUSED 127.0.0.1:80' }
      ];

      networkErrors.forEach(error => {
        expect(ErrorClassifier.isNetworkError(error)).toBe(true);
      });

      // Should not classify non-network errors
      expect(ErrorClassifier.isNetworkError({ statusCode: 404 })).toBe(false);
      expect(ErrorClassifier.isNetworkError({ message: 'validation failed' })).toBe(false);
    });

    test('should classify HTTP errors correctly', () => {
      const httpErrors = [
        { response: { status: 404 } },
        { response: { statusCode: 500 } }
      ];

      httpErrors.forEach(error => {
        expect(ErrorClassifier.isHttpError(error)).toBe(true);
      });

      // Should not classify non-HTTP errors (no response property)
      expect(ErrorClassifier.isHttpError({ statusCode: 401 })).toBe(false);
      expect(ErrorClassifier.isHttpError({ status: 403 })).toBe(false);
      expect(ErrorClassifier.isHttpError({ code: 'ECONNREFUSED' })).toBe(false);
    });

    test('should classify authentication errors correctly', () => {
      const authErrors = [
        { statusCode: 401 },
        { status: 401 },
        { response: { status: 401 } },
        { statusCode: 403 },
        { status: 403 },
        { response: { status: 403 } },
        { message: 'API key invalid' },
        { message: '401 unauthorized' },
        { message: 'authentication failed' },
        { message: 'unauthorized access' },
        { message: 'invalid credentials' }
      ];

      authErrors.forEach(error => {
        expect(ErrorClassifier.isAuthError(error)).toBe(true);
      });
    });

    test('should classify validation errors correctly', () => {
      const validationErrors = [
        { type: 'validation' },
        { message: 'Missing required parameters' },
        { message: 'required field missing' },
        { message: 'invalid input format' },
        { message: 'validation failed' },
        { message: 'invalid data provided' }
      ];

      validationErrors.forEach(error => {
        expect(ErrorClassifier.isValidationError(error)).toBe(true);
      });
    });

    test('should classify timeout errors correctly', () => {
      const timeoutErrors = [
        { code: 'ETIMEDOUT' },
        { code: 'TIMEOUT' },
        { message: 'Operation timed out' },
        { message: 'request timeout' },
        { message: 'connection timeout' }
      ];

      timeoutErrors.forEach(error => {
        expect(ErrorClassifier.isTimeoutError(error)).toBe(true);
      });
    });

    test('should classify rate limit errors correctly', () => {
      const rateLimitErrors = [
        { statusCode: 429 },
        { status: 429 },
        { response: { status: 429 } },
        { message: '429 Too Many Requests' },
        { message: 'rate limit exceeded' },
        { message: 'too many requests' }
      ];

      rateLimitErrors.forEach(error => {
        expect(ErrorClassifier.isRateLimitError(error)).toBe(true);
      });
    });
  });

  describe('ErrorFormatter Module', () => {
    test('should sanitize error messages for XSS prevention', () => {
      const maliciousMessages = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        "javascript:alert('xss')",
        '<svg onload="alert(1)">',
        '&lt;script&gt;alert("nested")&lt;/script&gt;'
      ];

      maliciousMessages.forEach(malicious => {
        const sanitized = ErrorFormatter.sanitizeForDisplay(malicious);
        
        // Should escape HTML characters
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('<svg');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
      });
    });

    test('should sanitize payload data removing sensitive fields', () => {
      const payload = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'key123',
        token: 'token123',
        secret: 'secret456',
        key: 'keyvalue',
        normalField: 'visible',
        data: { nested: 'value' }
      };

      const sanitized = ErrorFormatter.sanitizePayload(payload);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.key).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('visible');
      expect(sanitized.data).toEqual({ nested: 'value' });
    });

    test('should truncate messages appropriately', () => {
      const longMessage = 'This is a very long error message that should be truncated for display purposes';
      const truncated = ErrorFormatter.truncateMessage(longMessage, 20);
      
      expect(truncated).toHaveLength(23); // 20 + "..."
      expect(truncated).toEndWith('...');
      expect(truncated).toStartWith('This is a very long');
    });

    test('should calculate appropriate retry delays', () => {
      const networkError = { code: 'ECONNREFUSED' };
      const serverError = { statusCode: 500 };
      const rateLimitError = { statusCode: 429 };

      const networkDelay = ErrorFormatter.getRetryDelay(networkError, 1000);
      const serverDelay = ErrorFormatter.getRetryDelay(serverError, 1000);
      const rateLimitDelay = ErrorFormatter.getRetryDelay(rateLimitError, 1000);

      expect(networkDelay).toBeGreaterThan(1000);
      expect(serverDelay).toBeGreaterThan(1000);
      expect(rateLimitDelay).toBeGreaterThanOrEqual(30000); // Rate limits get longer delays
    });
  });

  describe('ErrorFactory Module', () => {
    test('should create validation errors with correct structure', () => {
      const error = ErrorFactory.validationError('Invalid input data');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid input data');
      expect(error.type).toBe('validation');
    });

    test('should create operation errors with correct structure', () => {
      const error = ErrorFactory.operationError('unknownOperation');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid operation: unknownOperation');
      expect(error.type).toBe('operation');
    });

    test('should create timeout errors with correct structure', () => {
      const error = ErrorFactory.timeoutError('testOperation', 5000);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Operation 'testOperation' timed out after 5000ms");
      expect(error.type).toBe('timeout');
      expect(error.code).toBe('ETIMEDOUT');
    });

    test('should create config errors with correct structure', () => {
      const error = ErrorFactory.configError('Invalid configuration provided');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid configuration provided');
      expect(error.type).toBe('config');
    });

    test('should create rate limit errors with retry information', () => {
      const error = ErrorFactory.rateLimitError(60);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.type).toBe('ratelimit');
      expect(error.retryAfter).toBe(60000); // Converted to milliseconds
    });

    test('should aggregate validation errors correctly', () => {
      const errors = ['Field A is required', 'Field B is invalid', 'Field C is too long'];
      const aggregated = ErrorFactory.aggregateValidationErrors(errors);
      
      expect(aggregated).toBeInstanceOf(Error);
      expect(aggregated.message).toContain('Multiple validation errors');
      expect(aggregated.message).toContain('Field A is required');
      expect(aggregated.message).toContain('Field B is invalid');
      expect(aggregated.message).toContain('Field C is too long');
      expect(aggregated.type).toBe('validation');
      expect(aggregated.validationErrors).toEqual(errors);
    });
  });

  describe('Specialized Error Handlers', () => {
    let mockErrorInfo;

    beforeEach(() => {
      mockErrorInfo = {
        message: 'Test error',
        type: 'unknown',
        statusCode: null,
        isTemporary: false,
        canRetry: false,
        retryAfter: null,
        statusText: 'error',
        category: 'system',
        severity: 'error'
      };
    });

    test('NetworkErrorHandler should handle network errors correctly', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const result = NetworkErrorHandler.handle(error, mockErrorInfo);

      expect(result.type).toBe('network');
      expect(result.category).toBe('connectivity');
      expect(result.isTemporary).toBe(true);
      expect(result.canRetry).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.severity).toBe('warning');
    });

    test('HttpErrorHandler should handle HTTP errors with status-specific logic', () => {
      // Test 404 - permanent error
      const notFoundError = { 
        response: { 
          status: 404, 
          data: { error_message: 'Resource not found' } 
        } 
      };
      const notFoundResult = HttpErrorHandler.handle(notFoundError, { ...mockErrorInfo });

      expect(notFoundResult.type).toBe('http');
      expect(notFoundResult.statusCode).toBe(404);
      expect(notFoundResult.isTemporary).toBe(false);
      expect(notFoundResult.canRetry).toBe(false);

      // Test 500 - temporary error
      const serverError = { 
        response: { 
          status: 500, 
          data: 'Internal server error' 
        } 
      };
      const serverResult = HttpErrorHandler.handle(serverError, { ...mockErrorInfo });

      expect(serverResult.type).toBe('http');
      expect(serverResult.statusCode).toBe(500);
      expect(serverResult.isTemporary).toBe(true);
      expect(serverResult.canRetry).toBe(true);
      expect(serverResult.retryAfter).toBeGreaterThan(0);
    });

    test('AuthErrorHandler should handle authentication errors', () => {
      const authError = { statusCode: 401, message: 'Invalid API key' };
      const result = AuthErrorHandler.handle(authError, mockErrorInfo);

      expect(result.type).toBe('auth');
      expect(result.category).toBe('security');
      expect(result.statusCode).toBe(401);
      expect(result.isTemporary).toBe(false);
      expect(result.canRetry).toBe(false);
      expect(result.severity).toBe('error');
    });

    test('ValidationErrorHandler should handle validation errors', () => {
      const validationError = { type: 'validation', message: 'Missing required field' };
      const result = ValidationErrorHandler.handle(validationError, mockErrorInfo);

      expect(result.type).toBe('validation');
      expect(result.category).toBe('input');
      expect(result.isTemporary).toBe(false);
      expect(result.canRetry).toBe(false);
      expect(result.severity).toBe('warning');
    });

    test('TimeoutErrorHandler should handle timeout errors', () => {
      const timeoutError = { code: 'ETIMEDOUT', message: 'Operation timed out' };
      const result = TimeoutErrorHandler.handle(timeoutError, mockErrorInfo);

      expect(result.type).toBe('timeout');
      expect(result.category).toBe('performance');
      expect(result.isTemporary).toBe(true);
      expect(result.canRetry).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.severity).toBe('warning');
    });

    test('RateLimitErrorHandler should handle rate limit errors with retry-after', () => {
      const rateLimitError = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' }
        }
      };
      const result = RateLimitErrorHandler.handle(rateLimitError, mockErrorInfo);

      expect(result.type).toBe('ratelimit');
      expect(result.category).toBe('throttling');
      expect(result.statusCode).toBe(429);
      expect(result.isTemporary).toBe(true);
      expect(result.canRetry).toBe(true);
      expect(result.retryAfter).toBe(60000); // Convert to milliseconds
      expect(result.severity).toBe('warning');
    });

    test('ParsingErrorHandler should handle parsing errors', () => {
      const parsingError = { message: 'Unexpected token at position 15' };
      const result = ParsingErrorHandler.handle(parsingError, mockErrorInfo);

      expect(result.type).toBe('parsing');
      expect(result.category).toBe('data');
      expect(result.isTemporary).toBe(false);
      expect(result.canRetry).toBe(false);
      expect(result.severity).toBe('error');
    });

    test('OperationErrorHandler should handle operation errors', () => {
      const operationError = { type: 'operation', message: 'Invalid operation: unknown' };
      const result = OperationErrorHandler.handle(operationError, mockErrorInfo);

      expect(result.type).toBe('operation');
      expect(result.category).toBe('business');
      expect(result.isTemporary).toBe(false);
      expect(result.canRetry).toBe(false);
      expect(result.severity).toBe('warning');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with existing error handling calls', () => {
      const mockNode = {
        status: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      };
      const mockMsg = { payload: { test: 'data' } };
      const done = jest.fn();

      // Test that the unified interface still works as before
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error, mockNode, mockMsg, done);

      expect(mockNode.status).toHaveBeenCalled();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Test error');
      expect(done).toHaveBeenCalledWith(error);
    });

    test('should maintain compatibility with error classification methods', () => {
      const networkError = { code: 'ECONNREFUSED' };
      const authError = { statusCode: 401 };
      const validationError = { type: 'validation' };

      // Test that the unified methods still work
      expect(ErrorHandler.isNetworkError(networkError)).toBe(true);
      expect(ErrorHandler.isAuthError(authError)).toBe(true);
      expect(ErrorHandler.isValidationError(validationError)).toBe(true);

      // Test that individual modules work the same way
      expect(ErrorClassifier.isNetworkError(networkError)).toBe(true);
      expect(ErrorClassifier.isAuthError(authError)).toBe(true);
      expect(ErrorClassifier.isValidationError(validationError)).toBe(true);
    });

    test('should maintain compatibility with error factory methods', () => {
      // Test unified interface
      const validationError1 = ErrorHandler.validationError('Test validation');
      const operationError1 = ErrorHandler.operationError('unknownOp');

      // Test individual factory
      const validationError2 = ErrorFactory.validationError('Test validation');
      const operationError2 = ErrorFactory.operationError('unknownOp');

      expect(validationError1.type).toBe(validationError2.type);
      expect(operationError1.type).toBe(operationError2.type);
      expect(validationError1.message).toBe(validationError2.message);
      expect(operationError1.message).toBe(operationError2.message);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle null/undefined error objects gracefully', () => {
      expect(() => ErrorClassifier.isNetworkError(null)).not.toThrow();
      expect(() => ErrorClassifier.isNetworkError(undefined)).not.toThrow();
      expect(ErrorClassifier.isNetworkError(null)).toBe(false);
      expect(ErrorClassifier.isNetworkError(undefined)).toBe(false);
    });

    test('should handle empty error objects', () => {
      const emptyError = {};
      expect(ErrorClassifier.isNetworkError(emptyError)).toBe(false);
      expect(ErrorClassifier.isHttpError(emptyError)).toBe(false);
      expect(ErrorClassifier.isAuthError(emptyError)).toBe(false);
    });

    test('should handle malformed error objects', () => {
      const malformedErrors = [
        { response: null },
        { response: { status: 'not-a-number' } },
        { statusCode: 'invalid' },
        { code: 123 }, // should be string
        { message: null }
      ];

      malformedErrors.forEach(error => {
        expect(() => ErrorClassifier.isHttpError(error)).not.toThrow();
        expect(() => ErrorClassifier.isNetworkError(error)).not.toThrow();
      });
    });

    test('should handle sanitization of complex objects', () => {
      const complexPayload = {
        user: {
          password: 'secret',
          preferences: { theme: 'dark' }
        },
        apiKey: 'key123',
        data: [1, 2, { secret: 'hidden', value: 'visible' }]
      };

      const sanitized = ErrorFormatter.sanitizePayload(complexPayload);
      
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.preferences.theme).toBe('dark');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      // Note: sanitizePayload only does shallow sanitization
      expect(sanitized.data[2].secret).toBe('hidden'); // Not nested sanitization
      expect(sanitized.data[2].value).toBe('visible');
    });
  });
});