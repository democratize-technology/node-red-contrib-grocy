const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const batteriesNode = require('../../../nodes/grocy-batteries.js');
const { sampleData } = require('../../mocks/grocy-api');
const { flows } = require('../../fixtures/test-data');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getBatteries: jest.fn().mockResolvedValue(sampleData.batteries),
      chargeBattery: jest.fn().mockResolvedValue({ success: true }),
      getBatteryDetails: jest.fn().mockResolvedValue(sampleData.batteries[0])
    }))
  };
});

describe('grocy-batteries node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  describe('node initialization', () => {
    it('should be loaded with valid configuration', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        expect(n1).toBeDefined();
        expect(n1.name).toBe('Test Batteries Node');
        expect(n1.operation).toBe('getBatteries');
        done();
      });
    });

    it('should show error status when server config is missing', (done) => {
      const flowWithoutConfig = [{
        id: 'grocy-batteries-2',
        type: 'grocy-batteries',
        name: 'Batteries Node No Server',
        server: '',
        operation: 'getBatteries'
      }];

      helper.load([configNode, batteriesNode], flowWithoutConfig, () => {
        const n1 = helper.getNode('grocy-batteries-2');
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

  describe('batteries operations', () => {
    it('should handle getBatteries operation', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        n1.receive({
          payload: {},
          operation: 'getBatteries'
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

    it('should handle chargeBattery operation', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        n1.receive({
          payload: { batteryId: 1 },
          operation: 'chargeBattery'
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

    it('should handle getBatteryDetails operation', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        n1.receive({
          payload: { batteryId: 1 },
          operation: 'getBatteryDetails'
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
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
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
          done();
        }, 100);
      });
    });

    it('should handle missing batteryId for chargeBattery', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toContain('batteryId is required');
          errorCaught = true;
        });

        n1.receive({
          payload: {},
          operation: 'chargeBattery'
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
        getBatteries: jest.fn().mockRejectedValue(new Error('Batteries API Error'))
      }));

      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        n1.receive({
          payload: {},
          operation: 'getBatteries'
        });
        
        setTimeout(() => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'Batteries API Error'
          }]);
          done();
        }, 100);
      });
    });
  });

  describe('message output', () => {
    it('should send output message with batteries result', (done) => {
      helper.load([configNode, batteriesNode], flows.batteriesFlow, () => {
        const n1 = helper.getNode('grocy-batteries-1');
        
        n1.on('input', (msg) => {
          setTimeout(() => {
            expect(n1.send).toHaveBeenCalled();
            const sentMessage = n1.send.mock.calls[0][0];
            expect(sentMessage.payload).toEqual(sampleData.batteries);
            expect(sentMessage.operation).toBe('getBatteries');
            done();
          }, 50);
        });

        n1.receive({
          payload: {},
          operation: 'getBatteries'
        });
      });
    });
  });
});