const helper = require('node-red-node-test-helper');
const nock = require('nock');
const configNode = require('../../nodes/grocy-config.js');
const apiNode = require('../../nodes/grocy-api.js');
const { MockGrocyAPI, sampleData } = require('../mocks/grocy-api');

describe('Grocy API Integration Tests', () => {
  const testApiUrl = 'http://localhost:9283';
  const testApiKey = 'test-api-key-123';
  
  beforeEach((done) => {
    helper.startServer(done);
    nock.cleanAll();
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
    nock.cleanAll();
  });

  const createTestFlow = (operation = 'getSystemInfo', entityType = 'system') => [
    {
      id: 'config-node',
      type: 'grocy-config',
      name: 'Test Grocy Server',
      apiUrl: testApiUrl,
      credentials: { apiKey: testApiKey }
    },
    {
      id: 'api-node',
      type: 'grocy-api',
      name: 'Test API Node',
      server: 'config-node',
      operation,
      entityType,
      wires: [['helper-node']]
    },
    {
      id: 'helper-node',
      type: 'helper'
    }
  ];

  describe('System API Integration', () => {
    it('should successfully call getSystemInfo endpoint', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockSystemInfo(sampleData.systemInfo);

      const flow = createTestFlow('getSystemInfo', 'system');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(msg.payload).toEqual(sampleData.systemInfo);
            expect(msg.operation).toBe('getSystemInfo');
            expect(msg.statusCode).toBe(200);
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });
      });
    });

    it('should handle API authentication errors', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, 'wrong-api-key');
      mockApi.mockAuthError('/api/system/info');

      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const apiNodeInstance = helper.getNode('api-node');
        
        let errorCaught = false;
        apiNodeInstance.on('call:error', (call) => {
          expect(call.args[0].message).toContain('401');
          errorCaught = true;
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });

        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 200);
      });
    });
  });

  describe('Stock API Integration', () => {
    it('should successfully retrieve stock data', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockStock(sampleData.stock);

      const flow = createTestFlow('getStock', 'stock');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(Array.isArray(msg.payload)).toBe(true);
            expect(msg.payload).toEqual(sampleData.stock);
            expect(msg.operation).toBe('getStock');
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getStock'
        });
      });
    });

    it('should retrieve specific stock entry', (done) => {
      const productId = 1;
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockStockEntry(productId, sampleData.stock[0]);

      const flow = createTestFlow('getStockEntry', 'stock');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(msg.payload).toEqual(sampleData.stock[0]);
            expect(msg.payload.product_id).toBe(productId);
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: { productId },
          operation: 'getStockEntry'
        });
      });
    });
  });

  describe('Shopping List API Integration', () => {
    it('should retrieve shopping list', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockShoppingList(sampleData.shoppingList);

      const flow = createTestFlow('getShoppingList', 'shopping_list');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(Array.isArray(msg.payload)).toBe(true);
            expect(msg.payload).toEqual(sampleData.shoppingList);
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getShoppingList'
        });
      });
    });

    it('should add item to shopping list', (done) => {
      const productId = 1;
      const amount = 2;
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockAddToShoppingList(productId, amount, { id: 123 });

      const flow = createTestFlow('addToShoppingList', 'shopping_list');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(msg.payload).toEqual({ id: 123 });
            expect(msg.operation).toBe('addToShoppingList');
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: { productId, amount },
          operation: 'addToShoppingList'
        });
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle server errors gracefully', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockError('/api/system/info', 500, 'Internal Server Error');

      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const apiNodeInstance = helper.getNode('api-node');
        
        let errorCaught = false;
        apiNodeInstance.on('call:error', (call) => {
          expect(call.args[0].message).toContain('500');
          errorCaught = true;
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });

        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 200);
      });
    });

    it('should handle network connection errors', (done) => {
      // Don't mock the endpoint to simulate connection error
      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const apiNodeInstance = helper.getNode('api-node');
        
        let errorCaught = false;
        apiNodeInstance.on('call:error', (call) => {
          expect(call.args[0].message).toContain('ECONNREFUSED');
          errorCaught = true;
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });

        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 500);
      });
    });

    it('should handle malformed response data', (done) => {
      nock(testApiUrl)
        .get('/api/system/info')
        .matchHeader('GROCY-API-KEY', testApiKey)
        .reply(200, 'invalid json response');

      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const apiNodeInstance = helper.getNode('api-node');
        
        let errorCaught = false;
        apiNodeInstance.on('call:error', (call) => {
          expect(call.args[0].message).toContain('JSON');
          errorCaught = true;
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });

        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 200);
      });
    });
  });

  describe('Message Flow Integration', () => {
    it('should preserve message properties through the flow', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockSystemInfo(sampleData.systemInfo);

      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        helperNode.on('input', (msg) => {
          try {
            expect(msg.topic).toBe('test-topic');
            expect(msg.customProperty).toBe('test-value');
            expect(msg._msgid).toBeDefined();
            expect(msg.payload).toEqual(sampleData.systemInfo);
            done();
          } catch (error) {
            done(error);
          }
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo',
          topic: 'test-topic',
          customProperty: 'test-value'
        });
      });
    });

    it('should handle multiple concurrent requests', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockSystemInfo(sampleData.systemInfo);
      mockApi.mockStock(sampleData.stock);

      const flow = createTestFlow('getSystemInfo');
      
      helper.load([configNode, apiNode], flow, () => {
        const helperNode = helper.getNode('helper-node');
        const apiNodeInstance = helper.getNode('api-node');
        
        let receivedMessages = 0;
        const expectedMessages = 2;

        helperNode.on('input', (msg) => {
          receivedMessages++;
          
          if (receivedMessages === expectedMessages) {
            done();
          }
        });

        // Send multiple concurrent requests
        apiNodeInstance.receive({
          payload: {},
          operation: 'getSystemInfo'
        });

        apiNodeInstance.receive({
          payload: {},
          operation: 'getStock'
        });
      });
    });
  });
});