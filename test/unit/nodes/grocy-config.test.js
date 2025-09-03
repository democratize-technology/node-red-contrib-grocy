const helper = require('node-red-node-test-helper');
const configNode = require('../../../nodes/grocy-config.js');
const { configurations } = require('../../fixtures/test-data');

describe('grocy-config node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', (done) => {
    const flow = [configurations.validConfig];
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1).toBeDefined();
      expect(n1.name).toBe('Test Grocy Server');
      expect(n1.apiUrl).toBe('http://localhost:9283');
      done();
    });
  });

  it('should handle valid configuration', (done) => {
    const flow = [configurations.validConfig];
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1.name).toBe('Test Grocy Server');
      expect(n1.apiUrl).toBe('http://localhost:9283');
      // Note: credentials are not directly accessible in tests for security
      done();
    });
  });

  it('should handle missing name gracefully', (done) => {
    const configWithoutName = {
      ...configurations.validConfig,
      name: ''
    };
    const flow = [configWithoutName];
    
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1).toBeDefined();
      expect(n1.name).toBe('');
      expect(n1.apiUrl).toBe('http://localhost:9283');
      done();
    });
  });

  it('should handle missing API URL gracefully', (done) => {
    const configWithoutUrl = {
      ...configurations.validConfig,
      apiUrl: ''
    };
    const flow = [configWithoutUrl];
    
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1).toBeDefined();
      expect(n1.apiUrl).toBe('');
      done();
    });
  });

  it('should register with correct node type', (done) => {
    const flow = [configurations.validConfig];
    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('config-node-1');
      expect(n1.type).toBe('grocy-config');
      done();
    });
  });

  describe('credentials handling', () => {
    it('should have credentials configuration', () => {
      // This tests the node registration, not instance credentials
      expect(typeof configNode).toBe('function');
      
      // Mock RED to test registration
      const mockRED = {
        nodes: {
          createNode: jest.fn(),
          registerType: jest.fn()
        }
      };
      
      configNode(mockRED);
      
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith(
        'grocy-config',
        expect.any(Function),
        expect.objectContaining({
          credentials: expect.objectContaining({
            apiKey: expect.objectContaining({
              type: 'password',
              required: true
            })
          })
        })
      );
    });

    it('should handle missing credentials gracefully', (done) => {
      const configWithoutCredentials = {
        ...configurations.validConfig
      };
      delete configWithoutCredentials.credentials;
      
      const flow = [configWithoutCredentials];
      helper.load(configNode, flow, () => {
        const n1 = helper.getNode('config-node-1');
        expect(n1).toBeDefined();
        // Node should still be created even without credentials
        done();
      });
    });
  });
});