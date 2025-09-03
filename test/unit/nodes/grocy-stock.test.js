const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const stockNode = require('../../../nodes/grocy-stock.js');
const { MockGrocyAPI, sampleData } = require('../../mocks/grocy-api');
const { flows, messages } = require('../../fixtures/test-data');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getStock: jest.fn().mockResolvedValue(sampleData.stock),
      getVolatileStock: jest.fn().mockResolvedValue(sampleData.stock.slice(1)),
      getProductDetails: jest.fn().mockResolvedValue(sampleData.stock[0]),
      getProductByBarcode: jest.fn().mockResolvedValue(sampleData.stock[0]),
      addProductToStock: jest.fn().mockResolvedValue({ success: true }),
      consumeProduct: jest.fn().mockResolvedValue({ success: true }),
      transferProduct: jest.fn().mockResolvedValue({ success: true }),
      inventoryProduct: jest.fn().mockResolvedValue({ success: true })
    }))
  };
});

describe('grocy-stock node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  describe('node initialization', () => {
    it('should be loaded with valid configuration', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        expect(n1).toBeDefined();
        expect(n1.name).toBe('Test Stock Node');
        expect(n1.operation).toBe('getStock');
        done();
      });
    });

    it('should show error status when server config is missing', (done) => {
      const flowWithoutConfig = [{
        id: 'grocy-stock-2',
        type: 'grocy-stock',
        name: 'Stock Node No Server',
        server: '',
        operation: 'getStock'
      }];

      helper.load([configNode, stockNode], flowWithoutConfig, () => {
        const n1 = helper.getNode('grocy-stock-2');
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

  describe('stock operations', () => {
    it('should handle getStock operation', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.on('input', () => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'blue',
            shape: 'dot',
            text: 'requesting...'
          }]);
        });

        n1.receive(messages.getStock);
        
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

    it('should handle getVolatileStock operation', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.receive({
          payload: { dueSoonDays: 7 },
          operation: 'getVolatileStock'
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

    it('should handle getProductDetails operation', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.receive({
          payload: { productId: 1 },
          operation: 'getProductDetails'
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

    it('should handle addProductToStock operation', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.receive({
          payload: {
            productId: 1,
            data: {
              amount: 5,
              best_before_date: '2024-12-31'
            }
          },
          operation: 'addProductToStock'
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

    it('should handle consumeProduct operation', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.receive({
          payload: {
            productId: 1,
            data: { amount: 1 }
          },
          operation: 'consumeProduct'
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
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
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

    it('should handle missing required parameters', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toContain('productId is required');
          errorCaught = true;
        });

        n1.receive({
          payload: {},
          operation: 'getProductDetails'
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
        getStock: jest.fn().mockRejectedValue(new Error('Stock API Error'))
      }));

      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.receive(messages.getStock);
        
        setTimeout(() => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'Stock API Error'
          }]);
          done();
        }, 100);
      });
    });
  });

  describe('message output', () => {
    it('should send output message with API result', (done) => {
      helper.load([configNode, stockNode], flows.stockFlow, () => {
        const n1 = helper.getNode('grocy-stock-1');
        
        n1.on('input', (msg) => {
          setTimeout(() => {
            // Check that send was called with the result
            expect(n1.send).toHaveBeenCalled();
            const sentMessage = n1.send.mock.calls[0][0];
            expect(sentMessage.payload).toEqual(sampleData.stock);
            expect(sentMessage.operation).toBe('getStock');
            done();
          }, 50);
        });

        n1.receive(messages.getStock);
      });
    });
  });
});