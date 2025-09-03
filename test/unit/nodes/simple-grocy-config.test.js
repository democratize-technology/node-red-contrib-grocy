const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');

describe('grocy-config node - simple test', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', (done) => {
    const flow = [{
      id: 'config-node-1',
      type: 'grocy-config',
      name: 'Test Grocy Server',
      apiUrl: 'http://localhost:9283',
      credentials: {
        apiKey: 'test-api-key-123'
      }
    }];
    
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1).toBeDefined();
      expect(n1.name).toBe('Test Grocy Server');
      expect(n1.apiUrl).toBe('http://localhost:9283');
      done();
    });
  });

  it('should register with correct node type', (done) => {
    const flow = [{
      id: 'config-node-1',
      type: 'grocy-config',
      name: 'Test Grocy Server',
      apiUrl: 'http://localhost:9283',
      credentials: {
        apiKey: 'test-api-key-123'
      }
    }];
    
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1.type).toBe('grocy-config');
      done();
    });
  });
});