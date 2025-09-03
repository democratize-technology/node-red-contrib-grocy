/**
 * Test suite for refactored node structure
 * Validates that the new shared architecture works correctly
 */

const { StockOperations, ShoppingListOperations, ChoresOperations, BatteriesOperations } = require('../../nodes/lib/handlers');
const BaseGrocyNode = require('../../nodes/lib/base-node');
const SpecializedGrocyNode = require('../../nodes/lib/specialized-node');
const GrocyClient = require('../../nodes/lib/grocy-client');
const Validators = require('../../nodes/lib/validators');

// Mock the node-grocy module
jest.mock('node-grocy', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getStock: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Product' }]),
      getObjects: jest.fn().mockResolvedValue([{ id: 1, name: 'Test List' }]),
      getChores: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Chore' }]),
      getBatteries: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Battery' }])
    }))
  };
});

describe('Refactored Node Architecture', () => {
  describe('Validators', () => {
    it('should validate required parameters', () => {
      expect(() => {
        Validators.validateRequired({ name: 'test' }, ['name']);
      }).not.toThrow();

      expect(() => {
        Validators.validateRequired({ name: 'test' }, ['name', 'missing']);
      }).toThrow('Missing required parameters: missing');
    });

    it('should validate operations', () => {
      expect(() => {
        Validators.validateOperation('getStock');
      }).not.toThrow();

      expect(() => {
        Validators.validateOperation('');
      }).toThrow('Operation must be a non-empty string');
    });

    it('should validate IDs', () => {
      expect(() => {
        Validators.validateId(123);
      }).not.toThrow();

      expect(() => {
        Validators.validateId('invalid');
      }).toThrow('id must be a valid positive number');
    });
  });

  describe('GrocyClient', () => {
    const mockServerConfig = {
      apiUrl: 'http://test.grocy.com',
      credentials: { apiKey: 'test-key' }
    };

    it('should create client with valid config', () => {
      expect(() => {
        new GrocyClient(mockServerConfig);
      }).not.toThrow();
    });

    it('should throw on invalid config', () => {
      expect(() => {
        new GrocyClient(null);
      }).toThrow();

      expect(() => {
        new GrocyClient({ apiUrl: 'http://test.com' }); // missing credentials
      }).toThrow();
    });
  });

  describe('Operation Handlers', () => {
    const mockClient = {
      api: {
        getStock: jest.fn().mockResolvedValue([{ id: 1 }]),
        getObjects: jest.fn().mockResolvedValue([{ id: 1 }]),
        getChores: jest.fn().mockResolvedValue([{ id: 1 }]),
        getBatteries: jest.fn().mockResolvedValue([{ id: 1 }])
      }
    };

    describe('StockOperations', () => {
      const stockOps = new StockOperations(mockClient);

      it('should return supported operations', () => {
        const operations = StockOperations.getSupportedOperations();
        expect(operations).toContain('getStock');
        expect(operations).toContain('getProductDetails');
        expect(operations.length).toBe(11);
      });

      it('should execute valid operation', async () => {
        const result = await stockOps.execute('getStock');
        expect(mockClient.api.getStock).toHaveBeenCalled();
        expect(result).toEqual([{ id: 1 }]);
      });

      it('should throw on invalid operation', async () => {
        await expect(stockOps.execute('invalidOperation')).rejects.toThrow('Invalid stock operation');
      });
    });

    describe('ShoppingListOperations', () => {
      const shoppingOps = new ShoppingListOperations(mockClient);

      it('should return supported operations', () => {
        const operations = ShoppingListOperations.getSupportedOperations();
        expect(operations).toContain('getShoppingLists');
        expect(operations).toContain('addProductToShoppingList');
        expect(operations.length).toBe(11);
      });

      it('should execute valid operation', async () => {
        const result = await shoppingOps.execute('getShoppingLists');
        expect(mockClient.api.getObjects).toHaveBeenCalledWith('shopping_lists');
        expect(result).toEqual([{ id: 1 }]);
      });
    });

    describe('ChoresOperations', () => {
      const choresOps = new ChoresOperations(mockClient);

      it('should return supported operations', () => {
        const operations = ChoresOperations.getSupportedOperations();
        expect(operations).toContain('getChores');
        expect(operations).toContain('getTasks');
        expect(operations.length).toBe(9);
      });
    });

    describe('BatteriesOperations', () => {
      const batteriesOps = new BatteriesOperations(mockClient);

      it('should return supported operations', () => {
        const operations = BatteriesOperations.getSupportedOperations();
        expect(operations).toContain('getBatteries');
        expect(operations).toContain('chargeBattery');
        expect(operations.length).toBe(6);
      });
    });
  });

  describe('Node Registration', () => {
    const mockRED = {
      nodes: {
        createNode: jest.fn(),
        getNode: jest.fn().mockReturnValue({
          apiUrl: 'http://test.com',
          credentials: { apiKey: 'test-key' }
        }),
        registerType: jest.fn()
      }
    };

    it('should register all node types without error', () => {
      expect(() => {
        require('../../nodes/grocy-config.js')(mockRED);
        require('../../nodes/grocy-stock.js')(mockRED);
        require('../../nodes/grocy-shopping-list.js')(mockRED);
        require('../../nodes/grocy-chores.js')(mockRED);
        require('../../nodes/grocy-batteries.js')(mockRED);
      }).not.toThrow();

      expect(mockRED.nodes.registerType).toHaveBeenCalledTimes(5);
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith('grocy-config', expect.any(Function), expect.any(Object));
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith('grocy-stock', expect.any(Function));
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith('grocy-shopping-list', expect.any(Function));
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith('grocy-chores', expect.any(Function));
      expect(mockRED.nodes.registerType).toHaveBeenCalledWith('grocy-batteries', expect.any(Function));
    });
  });

  describe('Code Reduction Analysis', () => {
    it('should have significantly reduced code duplication', () => {
      // Original files had ~500+ lines of duplicate code
      // Each refactored node is now ~16 lines (from 112-138 lines)
      
      const fs = require('fs');
      
      // Check refactored node sizes
      const stockLines = fs.readFileSync('nodes/grocy-stock.js', 'utf8').split('\n').length;
      const shoppingLines = fs.readFileSync('nodes/grocy-shopping-list.js', 'utf8').split('\n').length;
      const choresLines = fs.readFileSync('nodes/grocy-chores.js', 'utf8').split('\n').length;
      const batteriesLines = fs.readFileSync('nodes/grocy-batteries.js', 'utf8').split('\n').length;
      
      // Each node should be under 20 lines now (massive reduction)
      expect(stockLines).toBeLessThan(20);
      expect(shoppingLines).toBeLessThan(20);
      expect(choresLines).toBeLessThan(20);
      expect(batteriesLines).toBeLessThan(20);
      
      console.log(`✅ Code reduction achieved:
        - Stock node: ${stockLines} lines (was ~138)
        - Shopping list node: ${shoppingLines} lines (was ~135)
        - Chores node: ${choresLines} lines (was ~131)
        - Batteries node: ${batteriesLines} lines (was ~112)`);
    });
  });
});