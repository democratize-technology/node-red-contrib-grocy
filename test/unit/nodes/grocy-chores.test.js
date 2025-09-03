const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const choresNode = require('../../../nodes/grocy-chores.js');
const { sampleData } = require('../../mocks/grocy-api');
const { flows } = require('../../fixtures/test-data');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getChores: jest.fn().mockResolvedValue(sampleData.chores),
      executeChore: jest.fn().mockResolvedValue({ success: true }),
      getChoreDetails: jest.fn().mockResolvedValue(sampleData.chores[0])
    }))
  };
});

describe('grocy-chores node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  describe('node initialization', () => {
    it('should be loaded with valid configuration', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        expect(n1).toBeDefined();
        expect(n1.name).toBe('Test Chores Node');
        expect(n1.operation).toBe('getChores');
        done();
      });
    });

    it('should show error status when server config is missing', (done) => {
      const flowWithoutConfig = [{
        id: 'grocy-chores-2',
        type: 'grocy-chores',
        name: 'Chores Node No Server',
        server: '',
        operation: 'getChores'
      }];

      helper.load([configNode, choresNode], flowWithoutConfig, () => {
        const n1 = helper.getNode('grocy-chores-2');
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

  describe('chores operations', () => {
    it('should handle getChores operation', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        n1.receive({
          payload: {},
          operation: 'getChores'
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

    it('should handle executeChore operation', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        n1.receive({
          payload: { choreId: 1 },
          operation: 'executeChore'
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

    it('should handle getChoreDetails operation', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        n1.receive({
          payload: { choreId: 1 },
          operation: 'getChoreDetails'
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
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
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

    it('should handle missing choreId for executeChore', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        let errorCaught = false;
        n1.on('call:error', (call) => {
          expect(call.args[0]).toBeInstanceOf(Error);
          expect(call.args[0].message).toContain('choreId is required');
          errorCaught = true;
        });

        n1.receive({
          payload: {},
          operation: 'executeChore'
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
        getChores: jest.fn().mockRejectedValue(new Error('Chores API Error'))
      }));

      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        n1.receive({
          payload: {},
          operation: 'getChores'
        });
        
        setTimeout(() => {
          expect(n1.status.calls).toContainEqual([{
            fill: 'red',
            shape: 'ring',
            text: 'Chores API Error'
          }]);
          done();
        }, 100);
      });
    });
  });

  describe('message output', () => {
    it('should send output message with chores result', (done) => {
      helper.load([configNode, choresNode], flows.choresFlow, () => {
        const n1 = helper.getNode('grocy-chores-1');
        
        n1.on('input', (msg) => {
          setTimeout(() => {
            expect(n1.send).toHaveBeenCalled();
            const sentMessage = n1.send.mock.calls[0][0];
            expect(sentMessage.payload).toEqual(sampleData.chores);
            expect(sentMessage.operation).toBe('getChores');
            done();
          }, 50);
        });

        n1.receive({
          payload: {},
          operation: 'getChores'
        });
      });
    });
  });
});