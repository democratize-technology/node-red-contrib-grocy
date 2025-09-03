const helper = require('node-red-node-test-helper');
const nock = require('nock');
const configNode = require('../../nodes/grocy-config.js');
const apiNode = require('../../nodes/grocy-api.js');
const stockNode = require('../../nodes/grocy-stock.js');
const shoppingListNode = require('../../nodes/grocy-shopping-list.js');
const choresNode = require('../../nodes/grocy-chores.js');
const batteriesNode = require('../../nodes/grocy-batteries.js');
const { MockGrocyAPI, sampleData } = require('../mocks/grocy-api');

describe('Node-RED Flow Integration Tests', () => {
  const testApiUrl = 'http://localhost:9283';
  const testApiKey = 'test-integration-key';

  beforeEach((done) => {
    helper.startServer(done);
    nock.cleanAll();
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
    nock.cleanAll();
  });

  describe('Complete Grocy Workflow', () => {
    it('should handle a complete stock management workflow', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockSystemInfo(sampleData.systemInfo);
      mockApi.mockStock(sampleData.stock);
      mockApi.mockAddToShoppingList(1, 2, { id: 456 });

      const flow = [
        // Configuration
        {
          id: 'config-node',
          type: 'grocy-config',
          name: 'Test Grocy Server',
          apiUrl: testApiUrl,
          credentials: { apiKey: testApiKey }
        },
        // Inject node to start the flow
        {
          id: 'inject-node',
          type: 'inject',
          payload: '{}',
          payloadType: 'json',
          wires: [['system-info-node']]
        },
        // Get system info first
        {
          id: 'system-info-node',
          type: 'grocy-api',
          name: 'Get System Info',
          server: 'config-node',
          operation: 'getSystemInfo',
          entityType: 'system',
          wires: [['stock-node']]
        },
        // Get current stock
        {
          id: 'stock-node',
          type: 'grocy-stock',
          name: 'Get Stock',
          server: 'config-node',
          operation: 'getStock',
          wires: [['check-stock-function']]
        },
        // Function to check if we need to add items to shopping list
        {
          id: 'check-stock-function',
          type: 'function',
          func: `
            // Check if we have low stock items
            const lowStockItems = msg.payload.filter(item => item.amount < 3);
            if (lowStockItems.length > 0) {
              msg.payload = {
                productId: lowStockItems[0].product_id,
                amount: 2
              };
              msg.operation = 'addToShoppingList';
              return msg;
            }
            return null;
          `,
          outputs: 1,
          wires: [['shopping-list-node']]
        },
        // Add to shopping list if needed
        {
          id: 'shopping-list-node',
          type: 'grocy-shopping-list',
          name: 'Add to Shopping List',
          server: 'config-node',
          operation: 'addToShoppingList',
          wires: [['result-node']]
        },
        // Final result
        {
          id: 'result-node',
          type: 'helper'
        }
      ];

      helper.load([
        configNode,
        apiNode,
        stockNode,
        shoppingListNode
      ], flow, () => {
        const injectNode = helper.getNode('inject-node');
        const resultNode = helper.getNode('result-node');

        let messageCount = 0;
        const expectedMessages = 1; // Should receive final result

        resultNode.on('input', (msg) => {
          messageCount++;
          
          try {
            // Should have the shopping list addition result
            expect(msg.payload).toEqual({ id: 456 });
            expect(msg.operation).toBe('addToShoppingList');
            
            if (messageCount === expectedMessages) {
              done();
            }
          } catch (error) {
            done(error);
          }
        });

        // Start the flow
        injectNode.receive({});
      });
    });

    it('should handle chores and batteries workflow', (done) => {
      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockChores(sampleData.chores);
      mockApi.mockBatteries(sampleData.batteries);
      mockApi.mockExecuteChore(1, { success: true });

      const flow = [
        {
          id: 'config-node',
          type: 'grocy-config',
          name: 'Test Grocy Server',
          apiUrl: testApiUrl,
          credentials: { apiKey: testApiKey }
        },
        {
          id: 'inject-node',
          type: 'inject',
          payload: '{}',
          payloadType: 'json',
          wires: [['chores-node', 'batteries-node']]
        },
        {
          id: 'chores-node',
          type: 'grocy-chores',
          name: 'Get Chores',
          server: 'config-node',
          operation: 'getChores',
          wires: [['execute-chore-function']]
        },
        {
          id: 'batteries-node',
          type: 'grocy-batteries',
          name: 'Get Batteries',
          server: 'config-node',
          operation: 'getBatteries',
          wires: [['battery-result-node']]
        },
        {
          id: 'execute-chore-function',
          type: 'function',
          func: `
            if (msg.payload && msg.payload.length > 0) {
              msg.payload = { choreId: msg.payload[0].id };
              msg.operation = 'executeChore';
              return msg;
            }
            return null;
          `,
          outputs: 1,
          wires: [['execute-chore-node']]
        },
        {
          id: 'execute-chore-node',
          type: 'grocy-chores',
          name: 'Execute Chore',
          server: 'config-node',
          operation: 'executeChore',
          wires: [['chore-result-node']]
        },
        {
          id: 'chore-result-node',
          type: 'helper'
        },
        {
          id: 'battery-result-node',
          type: 'helper'
        }
      ];

      helper.load([
        configNode,
        choresNode,
        batteriesNode
      ], flow, () => {
        const injectNode = helper.getNode('inject-node');
        const choreResultNode = helper.getNode('chore-result-node');
        const batteryResultNode = helper.getNode('battery-result-node');

        let choreReceived = false;
        let batteryReceived = false;

        choreResultNode.on('input', (msg) => {
          try {
            expect(msg.payload).toEqual({ success: true });
            expect(msg.operation).toBe('executeChore');
            choreReceived = true;
            
            if (choreReceived && batteryReceived) {
              done();
            }
          } catch (error) {
            done(error);
          }
        });

        batteryResultNode.on('input', (msg) => {
          try {
            expect(Array.isArray(msg.payload)).toBe(true);
            expect(msg.payload).toEqual(sampleData.batteries);
            batteryReceived = true;
            
            if (choreReceived && batteryReceived) {
              done();
            }
          } catch (error) {
            done(error);
          }
        });

        // Start the flow
        injectNode.receive({});
      });
    });
  });

  describe('Error Handling in Flows', () => {
    it('should handle errors gracefully without breaking the flow', (done) => {
      // Mock API to return error for system info but success for stock
      nock(testApiUrl)
        .get('/api/system/info')
        .matchHeader('GROCY-API-KEY', testApiKey)
        .reply(500, { error: 'System error' });

      const mockApi = new MockGrocyAPI(testApiUrl, testApiKey);
      mockApi.mockStock(sampleData.stock);

      const flow = [
        {
          id: 'config-node',
          type: 'grocy-config',
          name: 'Test Grocy Server',
          apiUrl: testApiUrl,
          credentials: { apiKey: testApiKey }
        },
        {
          id: 'inject-node',
          type: 'inject',
          payload: '{}',
          payloadType: 'json',
          wires: [['system-info-node', 'stock-node']]
        },
        {
          id: 'system-info-node',
          type: 'grocy-api',
          name: 'Get System Info (will fail)',
          server: 'config-node',
          operation: 'getSystemInfo',
          entityType: 'system',
          wires: [['error-result-node']]
        },
        {
          id: 'stock-node',
          type: 'grocy-stock',
          name: 'Get Stock (will succeed)',
          server: 'config-node',
          operation: 'getStock',
          wires: [['success-result-node']]
        },
        {
          id: 'error-result-node',
          type: 'helper'
        },
        {
          id: 'success-result-node',
          type: 'helper'
        }
      ];

      helper.load([
        configNode,
        apiNode,
        stockNode
      ], flow, () => {
        const injectNode = helper.getNode('inject-node');
        const systemInfoNode = helper.getNode('system-info-node');
        const successResultNode = helper.getNode('success-result-node');

        let errorHandled = false;
        let successReceived = false;

        // Monitor for errors on the system info node
        systemInfoNode.on('call:error', (call) => {
          expect(call.args[0].message).toContain('500');
          errorHandled = true;
          
          if (errorHandled && successReceived) {
            done();
          }
        });

        successResultNode.on('input', (msg) => {
          try {
            expect(msg.payload).toEqual(sampleData.stock);
            successReceived = true;
            
            if (errorHandled && successReceived) {
              done();
            }
          } catch (error) {
            done(error);
          }
        });

        // Start the flow
        injectNode.receive({});
      });
    });
  });

  describe('Configuration Management', () => {
    it('should handle multiple Grocy servers', (done) => {
      const server1Url = 'http://grocy1.local:9283';
      const server2Url = 'http://grocy2.local:9283';
      
      const mockApi1 = new MockGrocyAPI(server1Url, 'key1');
      const mockApi2 = new MockGrocyAPI(server2Url, 'key2');
      
      mockApi1.mockSystemInfo({ ...sampleData.systemInfo, grocy_version: '4.0.0' });
      mockApi2.mockSystemInfo({ ...sampleData.systemInfo, grocy_version: '4.1.0' });

      const flow = [
        // Server 1 config
        {
          id: 'config-node-1',
          type: 'grocy-config',
          name: 'Grocy Server 1',
          apiUrl: server1Url,
          credentials: { apiKey: 'key1' }
        },
        // Server 2 config
        {
          id: 'config-node-2',
          type: 'grocy-config',
          name: 'Grocy Server 2',
          apiUrl: server2Url,
          credentials: { apiKey: 'key2' }
        },
        {
          id: 'inject-node',
          type: 'inject',
          payload: '{}',
          payloadType: 'json',
          wires: [['api-node-1', 'api-node-2']]
        },
        {
          id: 'api-node-1',
          type: 'grocy-api',
          name: 'API Node 1',
          server: 'config-node-1',
          operation: 'getSystemInfo',
          entityType: 'system',
          wires: [['result-node-1']]
        },
        {
          id: 'api-node-2',
          type: 'grocy-api',
          name: 'API Node 2',
          server: 'config-node-2',
          operation: 'getSystemInfo',
          entityType: 'system',
          wires: [['result-node-2']]
        },
        {
          id: 'result-node-1',
          type: 'helper'
        },
        {
          id: 'result-node-2',
          type: 'helper'
        }
      ];

      helper.load([configNode, apiNode], flow, () => {
        const injectNode = helper.getNode('inject-node');
        const resultNode1 = helper.getNode('result-node-1');
        const resultNode2 = helper.getNode('result-node-2');

        let results = [];

        resultNode1.on('input', (msg) => {
          results.push({ server: 1, version: msg.payload.grocy_version });
          checkCompletion();
        });

        resultNode2.on('input', (msg) => {
          results.push({ server: 2, version: msg.payload.grocy_version });
          checkCompletion();
        });

        function checkCompletion() {
          if (results.length === 2) {
            try {
              expect(results).toContainEqual({ server: 1, version: '4.0.0' });
              expect(results).toContainEqual({ server: 2, version: '4.1.0' });
              done();
            } catch (error) {
              done(error);
            }
          }
        }

        // Start the flow
        injectNode.receive({});
      });
    });
  });
});