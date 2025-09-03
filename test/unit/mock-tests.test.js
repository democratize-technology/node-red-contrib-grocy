// Tests for our mock utilities
const { MockGrocyAPI, sampleData } = require('../mocks/grocy-api');
const { createMockRED, createMockCredentials } = require('../mocks/node-red-runtime');

describe('Mock Utilities Tests', () => {
  describe('MockGrocyAPI', () => {
    let mockApi;
    
    beforeEach(() => {
      mockApi = new MockGrocyAPI('http://test.local', 'test-key');
    });

    afterEach(() => {
      if (mockApi) {
        mockApi.clearAll();
      }
    });

    it('should initialize with correct parameters', () => {
      expect(mockApi.apiUrl).toBe('http://test.local');
      expect(mockApi.apiKey).toBe('test-key');
    });

    it('should store mock responses', () => {
      const testData = { test: 'data' };
      mockApi.mockSystemInfo(testData);
      
      expect(mockApi.getMockResponse('getSystemInfo')).toEqual(testData);
    });

    it('should clear stored responses', () => {
      mockApi.mockSystemInfo({ test: 'data' });
      mockApi.clearAll();
      
      expect(mockApi.getMockResponse('getSystemInfo')).toBeUndefined();
    });
  });

  describe('Sample Data', () => {
    it('should have valid system info structure', () => {
      expect(sampleData.systemInfo).toHaveProperty('grocy_version');
      expect(sampleData.systemInfo).toHaveProperty('php_version');
      expect(typeof sampleData.systemInfo.grocy_version).toBe('string');
    });

    it('should have valid stock data structure', () => {
      expect(Array.isArray(sampleData.stock)).toBe(true);
      expect(sampleData.stock.length).toBeGreaterThan(0);
      
      const stockItem = sampleData.stock[0];
      expect(stockItem).toHaveProperty('product_id');
      expect(stockItem).toHaveProperty('amount');
      expect(stockItem).toHaveProperty('product');
      expect(stockItem.product).toHaveProperty('name');
    });

    it('should have valid shopping list structure', () => {
      expect(Array.isArray(sampleData.shoppingList)).toBe(true);
      expect(sampleData.shoppingList.length).toBeGreaterThan(0);
      
      const shoppingItem = sampleData.shoppingList[0];
      expect(shoppingItem).toHaveProperty('id');
      expect(shoppingItem).toHaveProperty('product_id');
      expect(shoppingItem).toHaveProperty('amount');
    });

    it('should have valid chores data structure', () => {
      expect(Array.isArray(sampleData.chores)).toBe(true);
      expect(sampleData.chores.length).toBeGreaterThan(0);
      
      const choreItem = sampleData.chores[0];
      expect(choreItem).toHaveProperty('id');
      expect(choreItem).toHaveProperty('name');
    });

    it('should have valid batteries data structure', () => {
      expect(Array.isArray(sampleData.batteries)).toBe(true);
      expect(sampleData.batteries.length).toBeGreaterThan(0);
      
      const batteryItem = sampleData.batteries[0];
      expect(batteryItem).toHaveProperty('id');
      expect(batteryItem).toHaveProperty('name');
    });
  });

  describe('MockRED', () => {
    let mockRED;
    
    beforeEach(() => {
      mockRED = createMockRED();
    });

    it('should initialize correctly', () => {
      expect(mockRED).toBeDefined();
      expect(typeof mockRED.registerType).toBe('function');
      expect(typeof mockRED.createNode).toBe('function');
    });

    it('should register node types', () => {
      const mockConstructor = jest.fn();
      const options = { credentials: { apiKey: { type: 'password' } } };
      
      mockRED.registerType('test-type', mockConstructor, options);
      
      expect(mockRED.nodeTypes.has('test-type')).toBe(true);
      const registered = mockRED.nodeTypes.get('test-type');
      expect(registered.constructor).toBe(mockConstructor);
      expect(registered.options).toBe(options);
    });

    it('should manage nodes', () => {
      const testNode = { id: 'test-node', type: 'test' };
      mockRED.addNode(testNode);
      
      expect(mockRED.getNode('test-node')).toBe(testNode);
    });

    it('should clear nodes and types', () => {
      mockRED.registerType('test', jest.fn());
      mockRED.addNode({ id: 'test', type: 'test' });
      
      mockRED.reset();
      
      expect(mockRED.nodeTypes.size).toBe(0);
      expect(mockRED.nodes.size).toBe(0);
    });
  });

  describe('Mock Credentials', () => {
    let mockCreds;
    
    beforeEach(() => {
      mockCreds = createMockCredentials('node-id', { 
        apiKey: 'test-key',
        username: 'test-user'
      });
    });

    it('should get credentials', () => {
      expect(mockCreds.get('apiKey')).toBe('test-key');
      expect(mockCreds.get('username')).toBe('test-user');
      expect(mockCreds.get('nonexistent')).toBeUndefined();
    });

    it('should add credentials', () => {
      mockCreds.add('newKey', 'newValue');
      expect(mockCreds.get('newKey')).toBe('newValue');
    });

    it('should delete credentials', () => {
      mockCreds.delete('apiKey');
      expect(mockCreds.get('apiKey')).toBeUndefined();
    });

    it('should clean all credentials', () => {
      mockCreds.clean();
      expect(mockCreds.get('apiKey')).toBeUndefined();
      expect(mockCreds.get('username')).toBeUndefined();
    });
  });
});