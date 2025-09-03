const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const shoppingListNode = require('../../../nodes/grocy-shopping-list.js');
const { sampleData } = require('../../mocks/grocy-api');
const { flows, messages } = require('../../fixtures/test-data');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getShoppingList: jest.fn().mockResolvedValue(sampleData.shoppingList),
      addToShoppingList: jest.fn().mockResolvedValue({ id: 123 }),
      removeFromShoppingList: jest.fn().mockResolvedValue({ success: true }),
      clearShoppingList: jest.fn().mockResolvedValue({ success: true })
    }))
  };
});

describe('grocy-shopping-list node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  describe('node initialization', () => {
    it('should be loaded with valid configuration', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        expect(n1).toBeDefined();
        expect(n1.name).toBe('Test Shopping List Node');
        expect(n1.operation).toBe('getShoppingList');
        done();
      });
    });

    it('should show error status when server config is missing', (done) => {
      const flowWithoutConfig = [{
        id: 'grocy-shopping-2',
        type: 'grocy-shopping-list',
        name: 'Shopping List Node No Server',
        server: '',
        operation: 'getShoppingList'
      }];

      helper.load([configNode, shoppingListNode], flowWithoutConfig, () => {
        const n1 = helper.getNode('grocy-shopping-2');
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

  describe('shopping list operations', () => {
    it('should handle getShoppingList operation', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.on('input', () => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'blue',
            shape: 'dot',
            text: 'requesting...'
          }]);
        });

        n1.receive({
          payload: {},
          operation: 'getShoppingList'
        });
        
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

    it('should handle addToShoppingList operation', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.receive({
          payload: {
            productId: 1,
            amount: 2
          },
          operation: 'addToShoppingList'
        });
        
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

    it('should handle removeFromShoppingList operation', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.receive({
          payload: { itemId: 1 },
          operation: 'removeFromShoppingList'
        });
        
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

    it('should handle clearShoppingList operation', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.receive({
          payload: {},
          operation: 'clearShoppingList'
        });
        
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

  describe('error handling', () => {
    it('should error when no operation is specified', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
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

    it('should handle missing required parameters for addToShoppingList', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toContain('productId is required');
          errorCaught = true;
        });

        n1.receive({
          payload: { amount: 2 },
          operation: 'addToShoppingList'
        });
        
        setTimeout(() => {
          expect(errorCaught).toBe(true);
          done();
        }, 100);
      });
    });

    it('should handle API errors', (done) => {
      const GrocyAPI = require('node-grocy').default;
      GrocyAPI.mockImplementation(() => ({
        getShoppingList: jest.fn().mockRejectedValue(new Error('Shopping List API Error'))
      }));

      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.receive({
          payload: {},
          operation: 'getShoppingList'
        });
        
        setTimeout(() => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'Shopping List API Error'
          }]);
          done();
        }, 100);
      });
    });
  });

  describe('message output', () => {
    it('should send output message with shopping list result', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        n1.on('input', (msg) => {
          setTimeout(() => {
            expect(n1.send).toHaveBeenCalled();
            const sentMessage = n1.send.mock.calls[0][0];
            expect(sentMessage.payload).toEqual(sampleData.shoppingList);
            expect(sentMessage.operation).toBe('getShoppingList');
            done();
          }, 50);
        });

        n1.receive({
          payload: {},
          operation: 'getShoppingList'
        });
      });
    });

    it('should preserve original message properties', (done) => {
      helper.load([configNode, shoppingListNode], flows.shoppingListFlow, () => {
        const n1 = helper.getNode('grocy-shopping-1');
        
        const originalMessage = {
          payload: {},
          operation: 'getShoppingList',
          topic: 'shopping',
          customProperty: 'test'
        };
        
        n1.on('input', (msg) => {
          setTimeout(() => {
            const sentMessage = n1.send.mock.calls[0][0];
            expect(sentMessage.topic).toBe('shopping');
            expect(sentMessage.customProperty).toBe('test');
            done();
          }, 50);
        });

        n1.receive(originalMessage);
      });
    });
  });
});