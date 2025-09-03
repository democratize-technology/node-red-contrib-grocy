const StockOperations = require('../../nodes/lib/operations/stock-operations');
const GrocyClient = require('../../nodes/lib/grocy-client');
const ErrorHandler = require('../../nodes/lib/error-handler');

describe('Error Handling Integration Tests', () => {
  let stockOperations;
  let mockClient;
  let mockApi;

  beforeEach(() => {
    // Create mock API with various error scenarios
    mockApi = {
      getStock: jest.fn(),
      getStockEntry: jest.fn(),
      addProductToStock: jest.fn(),
      addProductToStockByBarcode: jest.fn(),
      consumeProduct: jest.fn(),
      transferProduct: jest.fn(),
      inventoryProduct: jest.fn(),
      getSystemInfo: jest.fn()
    };

    // Create mock client with executeOperation method
    mockClient = {
      getAPI: jest.fn().mockResolvedValue(mockApi),
      executeOperation: jest.fn()
    };

    // Mock executeOperation to actually call the operation
    mockClient.executeOperation.mockImplementation(async (operationFn, context, options) => {
      return await operationFn(mockApi);
    });

    stockOperations = new StockOperations(mockClient);
  });

  describe('Network Error Scenarios', () => {
    test('should handle connection refused errors', async () => {
      const networkError = new Error('Connection refused');
      networkError.code = 'ECONNREFUSED';
      mockApi.getStock.mockRejectedValue(networkError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isNetworkError(error)).toBe(true);
        expect(ErrorHandler.formatError(error).isTemporary).toBe(true);
        expect(ErrorHandler.formatError(error).canRetry).toBe(true);
      }
    });

    test('should handle DNS resolution errors', async () => {
      const dnsError = new Error('Host not found');
      dnsError.code = 'ENOTFOUND';
      mockApi.getStock.mockRejectedValue(dnsError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isNetworkError(error)).toBe(true);
        // DNS errors are usually not temporary
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(false);
        expect(formatted.canRetry).toBe(false);
      }
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Operation timed out');
      timeoutError.code = 'ETIMEDOUT';
      mockApi.getStock.mockRejectedValue(timeoutError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isTimeoutError(error)).toBe(true);
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
      }
    });
  });

  describe('HTTP Error Scenarios', () => {
    test('should handle 404 not found errors', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };
      mockApi.getStockEntry.mockRejectedValue(notFoundError);

      try {
        await stockOperations.execute('getStockEntry', { entryId: 999 });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Stock entry 999 does not exist');
      }
    });

    test('should handle 401 unauthorized errors', async () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      mockApi.getStock.mockRejectedValue(authError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isAuthError(error)).toBe(true);
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(false);
        expect(formatted.canRetry).toBe(false);
      }
    });

    test('should handle 429 rate limit errors', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.response = { 
        status: 429,
        headers: { 'retry-after': '30' }
      };
      mockApi.getStock.mockRejectedValue(rateLimitError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isRateLimitError(error)).toBe(true);
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
        expect(formatted.retryAfter).toBe(30000); // 30 seconds in milliseconds
      }
    });

    test('should handle 500 server errors', async () => {
      const serverError = new Error('Internal server error');
      serverError.response = { status: 500 };
      mockApi.getStock.mockRejectedValue(serverError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.statusCode).toBe(500);
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
      }
    });
  });

  describe('Validation Error Scenarios', () => {
    test('should validate required fields for stock operations', async () => {
      try {
        await stockOperations.execute('addProductToStock', {});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('Missing required parameters');
      }
    });

    test('should validate ID formats', async () => {
      try {
        await stockOperations.execute('getStockEntry', { entryId: 'invalid-id' });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('must be a valid number');
      }
    });

    test('should validate barcode formats', async () => {
      try {
        await stockOperations.execute('addProductToStockByBarcode', {
          barcode: '',
          data: { amount: 1 }
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('cannot be empty');
      }
    });

    test('should validate stock addition data', async () => {
      try {
        await stockOperations.execute('addProductToStock', {
          productId: 1,
          data: {} // Missing required amount
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('amount');
      }
    });

    test('should validate numeric constraints', async () => {
      try {
        await stockOperations.execute('addProductToStock', {
          productId: 1,
          data: { amount: -5 } // Negative amount
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('must be at least 0');
      }
    });

    test('should collect multiple validation errors', async () => {
      try {
        await stockOperations.execute('addProductToStock', {
          productId: 'invalid',
          data: { amount: -1, price: -10 }
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.validationErrors).toBeDefined();
        expect(error.validationErrors.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Business Logic Error Scenarios', () => {
    test('should handle insufficient stock errors', async () => {
      const insufficientStockError = new Error('Insufficient stock');
      insufficientStockError.response = { status: 400 };
      mockApi.consumeProduct.mockRejectedValue(insufficientStockError);

      try {
        await stockOperations.execute('consumeProduct', {
          productId: 1,
          data: { amount: 100 }
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Invalid consumption data or insufficient stock');
      }
    });

    test('should handle product not found by barcode', async () => {
      const notFoundError = new Error('Product not found');
      notFoundError.response = { status: 404 };
      mockApi.addProductToStockByBarcode.mockRejectedValue(notFoundError);

      try {
        await stockOperations.execute('addProductToStockByBarcode', {
          barcode: 'nonexistent-barcode',
          data: { amount: 1 }
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain("Product with barcode 'nonexistent-barcode' not found");
      }
    });

    test('should handle invalid transfer data', async () => {
      const transferError = new Error('Invalid transfer');
      transferError.response = { status: 400 };
      mockApi.transferProduct.mockRejectedValue(transferError);

      try {
        await stockOperations.execute('transferProduct', {
          productId: 1,
          data: { amount: 1, location_id_to: 2 }
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Invalid transfer data or insufficient stock');
      }
    });
  });

  describe('Data Format Error Scenarios', () => {
    test('should handle malformed JSON responses', async () => {
      const parseError = new Error('Unexpected token in JSON');
      parseError.message = 'Unexpected token < in JSON at position 0';
      mockApi.getStock.mockRejectedValue(parseError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(ErrorHandler.isParsingError(error)).toBe(true);
      }
    });

    test('should validate response data format', async () => {
      // Mock API returning invalid data format
      mockApi.getStock.mockResolvedValue('invalid-format'); // Should be array

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('must be an array');
      }
    });

    test('should handle empty responses appropriately', async () => {
      // Some operations should handle empty responses gracefully
      mockApi.getStock.mockResolvedValue([]);
      
      const result = await stockOperations.execute('getStock', {});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Operation Error Scenarios', () => {
    test('should handle unknown operations', async () => {
      try {
        await stockOperations.execute('unknownOperation', {});
        fail('Should have thrown operation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('Unsupported operation');
      }
    });

    test('should provide helpful error messages for supported operations', () => {
      const supportedOps = stockOperations.getSupportedOperations();
      expect(supportedOps).toContain('getStock');
      expect(supportedOps).toContain('addProductToStock');
      expect(supportedOps).toContain('consumeProduct');
    });
  });

  describe('Error Context and Logging', () => {
    test('should include operation context in errors', async () => {
      const testError = new Error('Test error');
      mockApi.getStock.mockRejectedValue(testError);

      // Mock the executeOperation to capture context
      mockClient.executeOperation.mockImplementation(async (operationFn, context, options) => {
        expect(context.operation).toBe('getStock');
        expect(context.sanitizedPayload).toBeDefined();
        throw testError;
      });

      try {
        await stockOperations.execute('getStock', { test: 'data' });
        fail('Should have thrown error');
      } catch (error) {
        // Error should have been processed with context
      }
    });

    test('should sanitize sensitive data in context', async () => {
      const payload = { apiKey: 'secret', normalData: 'visible' };
      
      // Mock executeOperation to check sanitization
      mockClient.executeOperation.mockImplementation(async (operationFn, context, options) => {
        expect(context.sanitizedPayload.apiKey).toBe('[REDACTED]');
        expect(context.sanitizedPayload.normalData).toBe('visible');
        return 'success';
      });

      await stockOperations.execute('getStock', payload);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should provide retry information for temporary errors', async () => {
      const tempError = new Error('Temporary failure');
      tempError.code = 'ECONNRESET';
      mockApi.getStock.mockRejectedValue(tempError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(true);
        expect(formatted.canRetry).toBe(true);
        expect(formatted.retryAfter).toBeGreaterThan(0);
      }
    });

    test('should not suggest retry for permanent errors', async () => {
      const permError = new Error('Invalid API key');
      permError.statusCode = 401;
      mockApi.getStock.mockRejectedValue(permError);

      try {
        await stockOperations.execute('getStock', {});
        fail('Should have thrown error');
      } catch (error) {
        const formatted = ErrorHandler.formatError(error);
        expect(formatted.isTemporary).toBe(false);
        expect(formatted.canRetry).toBe(false);
      }
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('should validate date fields properly', async () => {
      try {
        await stockOperations.execute('addProductToStock', {
          productId: 1,
          data: { 
            amount: 1, 
            best_before_date: '2020-01-01' // Past date
          }
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('cannot be in the past');
      }
    });

    test('should validate transfer requirements', async () => {
      try {
        await stockOperations.execute('transferProduct', {
          productId: 1,
          data: { amount: 1 } // Missing location_id_to
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('location_id_to');
      }
    });

    test('should validate inventory data', async () => {
      try {
        await stockOperations.execute('inventoryProduct', {
          productId: 1,
          data: {} // Missing new_amount
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.type).toBe('validation');
        expect(error.message).toContain('new_amount');
      }
    });
  });
});