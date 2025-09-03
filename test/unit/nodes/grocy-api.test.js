const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const apiNode = require('../../../nodes/grocy-api.js');
const { MockGrocyAPI, sampleData } = require('../../mocks/grocy-api');
const { flows, messages, expectedResponses } = require('../../fixtures/test-data');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getSystemInfo: jest.fn().mockResolvedValue(sampleData.systemInfo),
      getStock: jest.fn().mockResolvedValue(sampleData.stock),
      getStockEntry: jest.fn().mockResolvedValue(sampleData.stock[0]),
      getShoppingList: jest.fn().mockResolvedValue(sampleData.shoppingList),
      addToShoppingList: jest.fn().mockResolvedValue({ id: 123 }),
      getChores: jest.fn().mockResolvedValue(sampleData.chores),
      executeChore: jest.fn().mockResolvedValue({ success: true }),
      getBatteries: jest.fn().mockResolvedValue(sampleData.batteries),
      getProducts: jest.fn().mockResolvedValue(sampleData.products),
      getLocations: jest.fn().mockResolvedValue(sampleData.locations)
    }))
  };
});

describe('grocy-api node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  describe('node initialization', () => {
    it('should be loaded with valid configuration', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        expect(n1).toBeDefined();
        expect(n1.name).toBe('Test API Node');
        expect(n1.operation).toBe('getSystemInfo');
        expect(n1.entityType).toBe('system');
        done();
      });
    });

    it('should show error status when server config is missing', (done) => {
      helper.load([configNode, apiNode], flows.errorFlow, () => {
        const n1 = helper.getNode('grocy-api-2');
        expect(n1).toBeDefined();
        expect(n1.status.calls[0][0]).toEqual({
          fill: 'red',
          shape: 'ring',
          text: 'Missing server config'
        });
        done();
      });
    });
  });

  describe('message processing', () => {
    it('should process getSystemInfo operation', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.on('input', () => {
          // Status should be set to requesting
          expect(n1.status.calls).toContainEqual([{
            fill: 'blue',
            shape: 'dot',
            text: 'requesting...'
          }]);
        });

        n1.receive(messages.systemInfo);
        
        // Allow async operations to complete
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle message with operation override', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive({
          payload: {},
          operation: 'getStock'
        });
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should error when no operation is specified', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        // Override the operation to empty
        n1.operation = '';
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toBe('No operation specified');
          errorCaught = true;
        });

        n1.receive({ payload: {} });
        
        setTimeout(() => {
          expect(errorCaught).toBe(true);
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'no operation specified'
          }]);
          done();
        }, 100);
      });
    });
  });

  describe('API operations', () => {
    it('should handle getStock operation', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.getStock);
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle getStockEntry operation with productId', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.getStockEntry);
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle addToShoppingList operation', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.addToShoppingList);
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle executeChore operation', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.executeChore);
        
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', (done) => {
      // Mock API to throw an error
      const GrocyAPI = require('node-grocy').default;
      GrocyAPI.mockImplementation(() => ({
        getSystemInfo: jest.fn().mockRejectedValue(new Error('API Error'))
      }));

      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          errorCaught = true;
        });

        n1.receive(messages.systemInfo);
        
        setTimeout(() => {
          expect(errorCaught).toBe(true);
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'API Error'
          }]);
          done();
        }, 100);
      });
    });

    it('should handle network errors', (done) => {
      // Mock API to throw a network error
      const GrocyAPI = require('node-grocy').default;
      GrocyAPI.mockImplementation(() => ({
        getSystemInfo: jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))
      }));

      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.systemInfo);
        
        setTimeout(() => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'ECONNREFUSED'
          }]);
          done();
        }, 100);
      });
    });

    it('should handle invalid operations', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toContain('Unknown operation');
          errorCaught = true;
        });

        n1.receive(messages.invalidMessage);
        
        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 100);
      });
    });
  });

  describe('status management', () => {
    it('should set requesting status during API call', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.systemInfo);
        
        // Check that requesting status is set immediately
        expect(n1.status.calls).toContainEqual([{
          fill: 'blue',
          shape: 'dot',
          text: 'requesting...'
        }]);
        
        done();
      });
    });

    it('should set success status after successful API call', (done) => {
      helper.load([configNode, apiNode], flows.basicApiFlow, () => {
        const n1 = helper.getNode('grocy-api-1');
        
        n1.receive(messages.systemInfo);
        
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
  });
});