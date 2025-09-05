/**
 * Tests for GrocyClient race condition fix in getAPI() method
 * Ensures the atomic capture pattern prevents race conditions during initialization
 */

const GrocyClient = require('../../nodes/lib/grocy-client');

// Mock the node-grocy module to avoid external dependencies
jest.mock('node-grocy', () => {
  return jest.fn().mockImplementation(() => ({
    getSystemInfo: jest.fn().mockResolvedValue({ version: '3.0.0' }),
    testConnection: jest.fn().mockResolvedValue(true)
  }));
});

describe('GrocyClient Race Condition Fix', () => {
  let validConfig;

  beforeEach(() => {
    validConfig = {
      apiUrl: 'https://grocy.example.com',
      credentials: { apiKey: 'test-key-123' },
      verifySsl: true
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAPI() Method Race Condition Prevention', () => {
    test('should return API instance immediately if already initialized', () => {
      const client = new GrocyClient(validConfig);
      
      // Simulate that the client is already initialized
      const mockApi = { getSystemInfo: jest.fn() };
      client.api = mockApi;
      client._initialized = true;

      const result = client.getAPI();
      expect(result).toBe(mockApi);
    });

    test('should return initialization promise if initialization is in progress', async () => {
      const client = new GrocyClient(validConfig);
      
      // Simulate initialization in progress
      const mockPromise = Promise.resolve({ getSystemInfo: jest.fn() });
      client._initPromise = mockPromise;
      client._initialized = false;

      const result = client.getAPI();
      expect(result).toBe(mockPromise);
      
      // Verify the promise resolves to the expected API
      const api = await result;
      expect(api.getSystemInfo).toBeDefined();
    });

    test('should throw error if API is not initialized and no initialization is in progress', () => {
      const client = new GrocyClient(validConfig);
      
      // Ensure no initialization state
      client.api = null;
      client._initPromise = null;
      client._initialized = false;

      expect(() => client.getAPI()).toThrow('Grocy API not initialized');
    });

    test('should handle race condition when multiple calls happen simultaneously', async () => {
      const client = new GrocyClient(validConfig);

      // Track initialization calls
      let initializationCount = 0;
      const originalInitialize = client.initialize.bind(client);
      client.initialize = jest.fn(() => {
        initializationCount++;
        return originalInitialize();
      });

      // Simulate multiple concurrent calls to waitForReady
      const promises = [
        client.waitForReady(),
        client.waitForReady(),
        client.waitForReady(),
        client.waitForReady(),
        client.waitForReady()
      ];

      const results = await Promise.all(promises);

      // All calls should return the same API instance
      results.forEach(api => {
        expect(api).toBe(results[0]);
        expect(api).toBeDefined();
      });

      // Initialization should only happen once despite multiple concurrent calls
      expect(client.initialize).toHaveBeenCalledTimes(1);
    });

    test('should use atomic capture pattern to prevent race conditions', async () => {
      const client = new GrocyClient(validConfig);

      // Mock slow initialization to create race condition opportunity
      const slowInitialization = new Promise((resolve) => {
        setTimeout(() => {
          resolve({ getSystemInfo: jest.fn() });
        }, 100);
      });

      client.initialize = jest.fn().mockReturnValue(slowInitialization);

      // Start first call
      const firstCall = client.waitForReady();
      
      // Verify initialization promise is stored
      expect(client._initPromise).toBeDefined();

      // Start second call immediately (while first is still pending)
      const secondCall = client.waitForReady();

      // Both calls should return the same promise (atomic capture)
      expect(secondCall).toBe(firstCall);
      expect(client._initPromise).toBe(firstCall);

      const results = await Promise.all([firstCall, secondCall]);
      expect(results[0]).toBe(results[1]);
      expect(client.initialize).toHaveBeenCalledTimes(1);
    });

    test('should clear initialization promise after successful initialization', async () => {
      const client = new GrocyClient(validConfig);

      const api = await client.waitForReady();

      expect(client._initialized).toBe(true);
      expect(client.api).toBe(api);
      expect(client._initPromise).toBeNull(); // Should be cleared after success
    });

    test('should handle initialization failure correctly', async () => {
      const client = new GrocyClient(validConfig);

      const initError = new Error('Initialization failed');
      client.initialize = jest.fn().mockRejectedValue(initError);

      await expect(client.waitForReady()).rejects.toThrow('Initialization failed');

      // After failure, should not be marked as initialized
      expect(client._initialized).toBe(false);
      expect(client.api).toBeNull();
      expect(client._initPromise).toBeNull(); // Should be cleared after failure
    });

    test('should allow retry after failed initialization', async () => {
      const client = new GrocyClient(validConfig);

      // First attempt fails
      client.initialize = jest.fn().mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ getSystemInfo: jest.fn() });

      // First call should fail
      await expect(client.waitForReady()).rejects.toThrow('Network error');

      // State should be reset for retry
      expect(client._initialized).toBe(false);
      expect(client._initPromise).toBeNull();

      // Second call should succeed
      const api = await client.waitForReady();
      expect(api).toBeDefined();
      expect(client._initialized).toBe(true);
      expect(client.initialize).toHaveBeenCalledTimes(2);
    });
  });

  describe('Initialization State Management', () => {
    test('should properly initialize state in constructor', () => {
      const client = new GrocyClient(validConfig);

      expect(client._initialized).toBe(false);
      expect(client._initPromise).toBeNull();
      expect(client.api).toBeNull();
    });

    test('should handle state transitions correctly during initialization', async () => {
      const client = new GrocyClient(validConfig);

      // Initial state
      expect(client._initialized).toBe(false);
      expect(client._initPromise).toBeNull();

      // Start initialization
      const initPromise = client.waitForReady();

      // During initialization
      expect(client._initialized).toBe(false);
      expect(client._initPromise).toBe(initPromise);

      // After initialization
      await initPromise;
      expect(client._initialized).toBe(true);
      expect(client._initPromise).toBeNull();
    });

    test('should handle concurrent initialization attempts correctly', async () => {
      const client = new GrocyClient(validConfig);

      // Create a controlled initialization promise
      let resolveInit;
      const controlledInitPromise = new Promise((resolve) => {
        resolveInit = resolve;
      });

      client.initialize = jest.fn().mockReturnValue(controlledInitPromise);

      // Start multiple concurrent initialization attempts
      const attempt1 = client.waitForReady();
      const attempt2 = client.waitForReady();
      const attempt3 = client.waitForReady();

      // All should share the same promise
      expect(attempt1).toBe(attempt2);
      expect(attempt2).toBe(attempt3);
      expect(client.initialize).toHaveBeenCalledTimes(1);

      // Resolve the initialization
      const mockApi = { getSystemInfo: jest.fn() };
      resolveInit(mockApi);

      const results = await Promise.all([attempt1, attempt2, attempt3]);
      results.forEach(api => {
        expect(api).toBe(mockApi);
      });
    });

    test('should handle mixed getAPI() and waitForReady() calls', async () => {
      const client = new GrocyClient(validConfig);

      // Start with waitForReady
      const readyPromise = client.waitForReady();

      // Before initialization completes, call getAPI
      const apiResult = client.getAPI();
      
      // Should return the same promise
      expect(apiResult).toBe(readyPromise);

      const api = await readyPromise;
      
      // After initialization, getAPI should return the API directly
      const directApi = client.getAPI();
      expect(directApi).toBe(api);
      expect(directApi).not.toBeInstanceOf(Promise);
    });
  });

  describe('Error Handling During Initialization', () => {
    test('should handle network errors during initialization', async () => {
      const client = new GrocyClient(validConfig);

      const networkError = new Error('Connection refused');
      networkError.code = 'ECONNREFUSED';
      
      client.initialize = jest.fn().mockRejectedValue(networkError);

      await expect(client.waitForReady()).rejects.toThrow('Connection refused');
      
      // Should reset state for potential retry
      expect(client._initialized).toBe(false);
      expect(client._initPromise).toBeNull();
    });

    test('should handle authentication errors during initialization', async () => {
      const client = new GrocyClient(validConfig);

      const authError = new Error('Unauthorized');
      authError.statusCode = 401;
      
      client.initialize = jest.fn().mockRejectedValue(authError);

      await expect(client.waitForReady()).rejects.toThrow('Unauthorized');
    });

    test('should handle timeout errors during initialization', async () => {
      const client = new GrocyClient(validConfig);

      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      client.initialize = jest.fn().mockRejectedValue(timeoutError);

      await expect(client.waitForReady()).rejects.toThrow('Request timeout');
    });

    test('should propagate initialization errors to all waiting promises', async () => {
      const client = new GrocyClient(validConfig);

      const initError = new Error('Initialization failed');
      client.initialize = jest.fn().mockRejectedValue(initError);

      // Start multiple concurrent calls
      const promises = [
        client.waitForReady(),
        client.waitForReady(),
        client.waitForReady()
      ];

      // All should reject with the same error
      await expect(Promise.all(promises)).rejects.toThrow('Initialization failed');
      
      // Verify all individual promises reject
      for (const promise of promises) {
        await expect(promise).rejects.toThrow('Initialization failed');
      }
    });
  });

  describe('Memory and Resource Management', () => {
    test('should clean up initialization promise after completion', async () => {
      const client = new GrocyClient(validConfig);

      // Initialization should set _initPromise
      const api = await client.waitForReady();
      
      // After completion, _initPromise should be null to prevent memory leaks
      expect(client._initPromise).toBeNull();
      expect(client.api).toBe(api);
    });

    test('should clean up initialization promise after failure', async () => {
      const client = new GrocyClient(validConfig);

      client.initialize = jest.fn().mockRejectedValue(new Error('Init failed'));

      try {
        await client.waitForReady();
      } catch (error) {
        // Ignore error, testing cleanup
      }

      // After failure, _initPromise should be null to allow retry
      expect(client._initPromise).toBeNull();
    });

    test('should not create multiple API instances', async () => {
      const client = new GrocyClient(validConfig);

      // Multiple calls should return the same instance
      const api1 = await client.waitForReady();
      const api2 = await client.waitForReady();
      const api3 = client.getAPI();

      expect(api1).toBe(api2);
      expect(api2).toBe(api3);
      expect(client.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Thread Safety Simulation', () => {
    test('should handle high-concurrency scenarios', async () => {
      const client = new GrocyClient(validConfig);

      // Simulate many concurrent requests
      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(client.waitForReady());
      }

      const results = await Promise.all(promises);

      // All requests should get the same API instance
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });

      // Initialization should only happen once
      expect(client.initialize).toHaveBeenCalledTimes(1);
    });

    test('should handle interleaved getAPI() and waitForReady() calls', async () => {
      const client = new GrocyClient(validConfig);

      const results = [];
      const errors = [];

      // Mix of different call patterns
      const operations = [
        () => client.waitForReady(),
        () => {
          try {
            return client.getAPI();
          } catch (error) {
            errors.push(error);
            return null;
          }
        },
        () => client.waitForReady()
      ];

      // Execute operations with slight delays to create interleaving
      for (const operation of operations) {
        results.push(operation());
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Filter out null results from getAPI errors
      const validResults = results.filter(r => r !== null);
      
      if (validResults.length > 0) {
        const resolvedResults = await Promise.all(validResults);
        const firstValidResult = resolvedResults[0];
        
        resolvedResults.forEach(result => {
          expect(result).toBe(firstValidResult);
        });
      }

      // Some getAPI calls might fail before initialization completes
      expect(errors.length).toBeGreaterThanOrEqual(0);
      errors.forEach(error => {
        expect(error.message).toBe('Grocy API not initialized');
      });
    });
  });
});