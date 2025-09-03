const ErrorHandler = require('../../nodes/lib/error-handler');
const Validators = require('../../nodes/lib/validators');
const TimeoutHandler = require('../../nodes/lib/timeout-handler');
const GrocyClient = require('../../nodes/lib/grocy-client');

describe('Error Handling System', () => {
  let mockNode;
  let mockMsg;

  beforeEach(() => {
    mockNode = {
      status: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };
    
    mockMsg = {
      payload: { test: 'data' },
      topic: 'test'
    };
  });

  describe('ErrorHandler', () => {
    describe('Error Classification', () => {
      test('should identify network errors correctly', () => {
        const networkErrors = [
          { code: 'ECONNREFUSED' },
          { code: 'ENOTFOUND' },
          { code: 'ETIMEDOUT' },
          { code: 'ECONNRESET' },
          { message: 'network error' }
        ];

        networkErrors.forEach(error => {
          expect(ErrorHandler.isNetworkError(error)).toBe(true);
        });
      });

      test('should identify authentication errors correctly', () => {
        const authErrors = [
          { statusCode: 401 },
          { statusCode: 403 },
          { message: '401 unauthorized' },
          { message: 'API key invalid' }
        ];

        authErrors.forEach(error => {
          expect(ErrorHandler.isAuthError(error)).toBe(true);
        });
      });

      test('should identify validation errors correctly', () => {
        const validationErrors = [
          { type: 'validation' },
          { message: 'required field missing' },
          { message: 'invalid input' },
          { message: 'Missing required parameters' }
        ];

        validationErrors.forEach(error => {
          expect(ErrorHandler.isValidationError(error)).toBe(true);
        });
      });

      test('should identify timeout errors correctly', () => {
        const timeoutErrors = [
          { code: 'ETIMEDOUT' },
          { code: 'TIMEOUT' },
          { message: 'Operation timed out' }
        ];

        timeoutErrors.forEach(error => {
          expect(ErrorHandler.isTimeoutError(error)).toBe(true);
        });
      });

      test('should identify rate limit errors correctly', () => {
        const rateLimitErrors = [
          { statusCode: 429 },
          { message: '429 Too Many Requests' },
          { message: 'rate limit exceeded' }
        ];

        rateLimitErrors.forEach(error => {
          expect(ErrorHandler.isRateLimitError(error)).toBe(true);
        });
      });
    });

    describe('Error Formatting', () => {
      test('should format network errors with recovery info', () => {
        const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
        const formatted = ErrorHandler.formatError(error);

        expect(formatted.type).toBe('network');
        expect(formatted.category).toBe('connectivity');
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
        expect(formatted.retryAfter).toBeGreaterThan(0);
        expect(formatted.severity).toBe('warning');
      });

      test('should format HTTP errors with status-specific messages', () => {
        const error = {
          response: {
            status: 404,
            data: { error_message: 'Resource not found' }
          }
        };
        const formatted = ErrorHandler.formatError(error);

        expect(formatted.type).toBe('http');
        expect(formatted.statusCode).toBe(404);
        expect(formatted.message).toBe('Resource not found');
        expect(formatted.isTemporary).toBe(false);
        expect(formatted.canRetry).toBe(false);
      });

      test('should format server errors as temporary', () => {
        const error = {
          response: {
            status: 500,
            data: 'Internal server error'
          }
        };
        const formatted = ErrorHandler.formatError(error);

        expect(formatted.type).toBe('http');
        expect(formatted.statusCode).toBe(500);
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
        expect(formatted.retryAfter).toBeGreaterThan(0);
      });

      test('should handle rate limit errors with retry-after', () => {
        const error = {
          response: {
            status: 429,
            headers: { 'retry-after': '60' }
          }
        };
        const formatted = ErrorHandler.formatError(error);

        expect(formatted.type).toBe('ratelimit');
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
        expect(formatted.retryAfter).toBe(60000); // milliseconds
      });
    });

    describe('Error Handling', () => {
      test('should handle errors with context', () => {
        const error = new Error('Test error');
        const context = { operation: 'testOp', sanitizedPayload: { test: true } };
        const done = jest.fn();

        const result = ErrorHandler.handle(error, mockNode, mockMsg, done, context);

        expect(mockNode.status).toHaveBeenCalledWith({
          fill: 'red',
          shape: 'dot',
          text: expect.any(String)
        });

        expect(result.error).toMatchObject({
          message: 'Test error',
          type: 'unknown',
          operation: 'testOp',
          payload: { test: true }
        });

        expect(done).toHaveBeenCalledWith(error);
      });

      test('should sanitize sensitive payload data', () => {
        const payload = {
          username: 'test',
          password: 'secret123',
          apiKey: 'key123',
          token: 'token123',
          normalData: 'visible'
        };

        const sanitized = ErrorHandler.sanitizePayload(payload);

        expect(sanitized).toEqual({
          username: 'test',
          password: '[REDACTED]',
          apiKey: '[REDACTED]',
          token: '[REDACTED]',
          normalData: 'visible'
        });
      });
    });

    describe('Error Factory Methods', () => {
      test('should create validation errors', () => {
        const error = ErrorHandler.validationError('Invalid input');
        expect(error.message).toBe('Invalid input');
        expect(error.type).toBe('validation');
      });

      test('should create operation errors', () => {
        const error = ErrorHandler.operationError('unknownOp');
        expect(error.message).toBe('Invalid operation: unknownOp');
        expect(error.type).toBe('operation');
      });

      test('should create timeout errors', () => {
        const error = ErrorHandler.timeoutError('testOp', 5000);
        expect(error.message).toBe("Operation 'testOp' timed out after 5000ms");
        expect(error.type).toBe('timeout');
        expect(error.code).toBe('ETIMEDOUT');
      });

      test('should create aggregated validation errors', () => {
        const errors = ['Error 1', 'Error 2', 'Error 3'];
        const aggregated = ErrorHandler.aggregateValidationErrors(errors);
        
        expect(aggregated.message).toBe('Multiple validation errors: Error 1; Error 2; Error 3');
        expect(aggregated.type).toBe('validation');
        expect(aggregated.validationErrors).toEqual(errors);
      });
    });
  });

  describe('Validators', () => {
    describe('Required Field Validation', () => {
      test('should validate required fields successfully', () => {
        const payload = { field1: 'value1', field2: 'value2' };
        expect(() => {
          Validators.validateRequired(payload, ['field1', 'field2']);
        }).not.toThrow();
      });

      test('should throw for missing required fields', () => {
        const payload = { field1: 'value1' };
        expect(() => {
          Validators.validateRequired(payload, ['field1', 'field2']);
        }).toThrow('Missing required parameters: field2');
      });

      test('should throw for null/undefined values', () => {
        const payload = { field1: 'value1', field2: null, field3: undefined };
        expect(() => {
          Validators.validateRequired(payload, ['field1', 'field2', 'field3']);
        }).toThrow('Missing required parameters: field2, field3');
      });

      test('should collect all errors when collectAllErrors is true', () => {
        const payload = { field1: '' };
        expect(() => {
          Validators.validateRequired(payload, ['field1', 'field2'], { 
            collectAllErrors: true,
            allowEmptyStrings: false
          });
        }).toThrow('Multiple validation errors');
      });
    });

    describe('ID Validation', () => {
      test('should validate positive integers', () => {
        expect(() => Validators.validateId(1)).not.toThrow();
        expect(() => Validators.validateId('123')).not.toThrow();
      });

      test('should reject negative numbers', () => {
        expect(() => Validators.validateId(-1)).toThrow('id must be a positive number');
      });

      test('should reject zero by default', () => {
        expect(() => Validators.validateId(0)).toThrow('id must be greater than 0');
      });

      test('should allow zero when configured', () => {
        expect(() => Validators.validateId(0, 'id', { allowZero: true })).not.toThrow();
      });

      test('should reject non-numeric values', () => {
        expect(() => Validators.validateId('abc')).toThrow('id must be a valid number');
        expect(() => Validators.validateId(null)).toThrow('id is required');
      });

      test('should enforce maximum values', () => {
        expect(() => {
          Validators.validateId(1000, 'id', { maxValue: 100 });
        }).toThrow('id must be less than or equal to 100');
      });
    });

    describe('String Validation', () => {
      test('should validate strings with length constraints', () => {
        expect(() => {
          Validators.validateString('hello', 'test', { minLength: 3, maxLength: 10 });
        }).not.toThrow();
      });

      test('should reject strings that are too short/long', () => {
        expect(() => {
          Validators.validateString('hi', 'test', { minLength: 3 });
        }).toThrow('test must be at least 3 characters');

        expect(() => {
          Validators.validateString('toolongstring', 'test', { maxLength: 5 });
        }).toThrow('test cannot exceed 5 characters');
      });

      test('should validate with regex patterns', () => {
        expect(() => {
          Validators.validateString('test123', 'test', { pattern: /^[a-z0-9]+$/ });
        }).not.toThrow();

        expect(() => {
          Validators.validateString('Test123!', 'test', { pattern: /^[a-z0-9]+$/ });
        }).toThrow('test does not match required format');
      });

      test('should handle unicode validation', () => {
        expect(() => {
          Validators.validateString('café', 'test', { allowUnicode: false });
        }).toThrow('test contains non-ASCII characters');

        expect(() => {
          Validators.validateString('café', 'test', { allowUnicode: true });
        }).not.toThrow();
      });
    });

    describe('URL Validation', () => {
      test('should validate proper URLs', () => {
        expect(() => {
          Validators.validateUrl('https://example.com');
        }).not.toThrow();

        expect(() => {
          Validators.validateUrl('http://localhost:3000');
        }).not.toThrow();
      });

      test('should reject invalid URLs', () => {
        expect(() => {
          Validators.validateUrl('not-a-url');
        }).toThrow('Invalid URL format');

        expect(() => {
          Validators.validateUrl('ftp://example.com');
        }).toThrow('URL must use HTTP or HTTPS protocol');
      });

      test('should enforce HTTPS requirement', () => {
        expect(() => {
          Validators.validateUrl('http://example.com', { requireHttps: true });
        }).toThrow('URL must use HTTPS protocol');
      });

      test('should handle localhost restrictions', () => {
        expect(() => {
          Validators.validateUrl('http://localhost:3000', { allowLocalhost: false });
        }).toThrow('Localhost URLs are not allowed');
      });
    });

    describe('Date Validation', () => {
      test('should validate proper dates', () => {
        expect(() => {
          Validators.validateDate(new Date(), 'test');
        }).not.toThrow();

        expect(() => {
          Validators.validateDate('2024-12-25', 'test');
        }).not.toThrow();
      });

      test('should reject invalid dates', () => {
        expect(() => {
          Validators.validateDate('invalid-date', 'test');
        }).toThrow('test is not a valid date');
      });

      test('should enforce past/future constraints', () => {
        const pastDate = new Date('2020-01-01');
        const futureDate = new Date('2030-01-01');

        expect(() => {
          Validators.validateDate(pastDate, 'test', { allowPast: false });
        }).toThrow('test cannot be in the past');

        expect(() => {
          Validators.validateDate(futureDate, 'test', { allowFuture: false });
        }).toThrow('test cannot be in the future');
      });
    });

    describe('Array Validation', () => {
      test('should validate arrays with constraints', () => {
        expect(() => {
          Validators.validateArray([1, 2, 3], 'test', { minLength: 2, maxLength: 5 });
        }).not.toThrow();
      });

      test('should reject arrays that are too short/long', () => {
        expect(() => {
          Validators.validateArray([1], 'test', { minLength: 2 });
        }).toThrow('test must have at least 2 elements');

        expect(() => {
          Validators.validateArray([1, 2, 3], 'test', { maxLength: 2 });
        }).toThrow('test cannot have more than 2 elements');
      });

      test('should validate array elements', () => {
        const elementValidator = (element, index) => {
          if (typeof element !== 'number') {
            throw new Error('Must be a number');
          }
        };

        expect(() => {
          Validators.validateArray([1, 2, 3], 'test', { elementValidator });
        }).not.toThrow();

        expect(() => {
          Validators.validateArray([1, 'two', 3], 'test', { elementValidator });
        }).toThrow('Multiple validation errors');
      });
    });

    describe('Configuration Validation', () => {
      test('should validate proper configuration', () => {
        const config = {
          apiUrl: 'https://grocy.example.com',
          credentials: {
            apiKey: 'test-key-123'
          }
        };

        expect(() => {
          Validators.validateConfig(config);
        }).not.toThrow();
      });

      test('should reject missing required fields', () => {
        expect(() => {
          Validators.validateConfig({});
        }).toThrow('Missing required configuration: apiUrl');

        expect(() => {
          Validators.validateConfig({
            apiUrl: 'https://grocy.example.com',
            credentials: {}
          });
        }).toThrow('API key is required in credentials');
      });

      test('should validate API URL format', () => {
        expect(() => {
          Validators.validateConfig({
            apiUrl: 'invalid-url'
          });
        }).toThrow('Invalid URL format');
      });
    });
  });

  describe('TimeoutHandler', () => {
    let timeoutHandler;

    beforeEach(() => {
      timeoutHandler = new TimeoutHandler({
        defaultTimeout: 1000,
        maxRetries: 2,
        baseDelay: 100
      });
    });

    describe('Timeout Execution', () => {
      test('should execute operation successfully within timeout', async () => {
        const operation = async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'success';
        };

        const result = await timeoutHandler.execute(operation);
        expect(result).toBe('success');
      });

      test('should timeout long-running operations', async () => {
        const operation = async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return 'should not reach here';
        };

        await expect(timeoutHandler.execute(operation, {}, { timeout: 500 }))
          .rejects
          .toThrow('timed out');
      });
    });

    describe('Retry Logic', () => {
      test('should retry on temporary errors', async () => {
        let attempts = 0;
        const operation = async () => {
          attempts++;
          if (attempts < 3) {
            const error = new Error('Temporary error');
            error.code = 'ECONNREFUSED';
            throw error;
          }
          return 'success after retries';
        };

        const result = await timeoutHandler.execute(operation);
        expect(result).toBe('success after retries');
        expect(attempts).toBe(3);
      });

      test('should not retry on permanent errors', async () => {
        let attempts = 0;
        const operation = async () => {
          attempts++;
          const error = new Error('Validation error');
          error.type = 'validation';
          throw error;
        };

        await expect(timeoutHandler.execute(operation))
          .rejects
          .toThrow('Validation error');
        expect(attempts).toBe(1);
      });

      test('should respect retry limits', async () => {
        let attempts = 0;
        const operation = async () => {
          attempts++;
          const error = new Error('Always fails');
          error.code = 'ETIMEDOUT';
          throw error;
        };

        await expect(timeoutHandler.execute(operation))
          .rejects
          .toThrow('Always fails');
        expect(attempts).toBe(3); // initial + 2 retries
      });
    });

    describe('Circuit Breaker', () => {
      test('should open circuit after failure threshold', async () => {
        const failingOperation = async () => {
          const error = new Error('Service unavailable');
          error.statusCode = 500;
          throw error;
        };

        // Execute enough failures to open circuit
        for (let i = 0; i < 5; i++) {
          try {
            await timeoutHandler.execute(failingOperation, {}, { retries: 0 });
          } catch (error) {
            // Expected
          }
        }

        // Circuit should now be open
        await expect(timeoutHandler.execute(failingOperation, {}, { retries: 0 }))
          .rejects
          .toThrow('Circuit breaker is OPEN');

        const status = timeoutHandler.getCircuitBreakerStatus();
        expect(status.state).toBe('OPEN');
        expect(status.isHealthy).toBe(false);
      });

      test('should allow recovery after timeout', async () => {
        // Force circuit open
        timeoutHandler.circuitBreaker.state = 'OPEN';
        timeoutHandler.circuitBreaker.lastFailureTime = Date.now() - 70000; // 70 seconds ago

        const successOperation = async () => 'success';

        const result = await timeoutHandler.execute(successOperation);
        expect(result).toBe('success');

        const status = timeoutHandler.getCircuitBreakerStatus();
        expect(status.state).toBe('CLOSED');
      });
    });

    describe('Batch Execution', () => {
      test('should execute operations in batches', async () => {
        const operations = Array(10).fill().map((_, i) => 
          async () => `result ${i}`
        );

        const result = await timeoutHandler.batchExecute(operations, { 
          concurrency: 3 
        });

        expect(result.successCount).toBe(10);
        expect(result.errorCount).toBe(0);
        expect(result.results).toHaveLength(10);
      });

      test('should handle mixed success and failure', async () => {
        const operations = [
          async () => 'success 1',
          async () => { throw new Error('failed'); },
          async () => 'success 2'
        ];

        const result = await timeoutHandler.batchExecute(operations, { 
          failFast: false 
        });

        expect(result.successCount).toBe(2);
        expect(result.errorCount).toBe(1);
      });
    });
  });

  describe('GrocyClient Error Handling', () => {
    test('should handle configuration errors', () => {
      expect(() => {
        new GrocyClient(null);
      }).toThrow('Server configuration is required');

      expect(() => {
        new GrocyClient({});
      }).toThrow('Missing required configuration');
    });

    test('should track connection health', async () => {
      // Mock successful config
      const mockConfig = {
        apiUrl: 'https://grocy.example.com',
        credentials: { apiKey: 'test-key' }
      };

      // Mock the node-grocy module to avoid actual import
      const mockApi = {
        getSystemInfo: jest.fn().mockResolvedValue({ version: '3.0.0' })
      };
      
      jest.doMock('node-grocy', () => {
        return jest.fn(() => mockApi);
      });

      const client = new GrocyClient(mockConfig);
      client.api = mockApi; // Inject mock directly

      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.systemInfo).toEqual({ version: '3.0.0' });

      const healthStatus = client.getHealthStatus();
      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.consecutiveFailures).toBe(0);
    });
  });
});