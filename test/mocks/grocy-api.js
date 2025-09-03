/**
 * Mock utilities for Grocy API testing
 */
const nock = require('nock');

class MockGrocyAPI {
  constructor(apiUrl = 'http://localhost:9283', apiKey = 'test-api-key') {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.mockResponses = new Map();
  }

  // Mock response setups for different operations
  mockSystemInfo(response = { grocy_version: '4.0.0', php_version: '8.1.0' }) {
    this.mockResponses.set('getSystemInfo', response);
    return nock(this.apiUrl)
      .get('/api/system/info')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockDbChangedTime(response = { changed_time: '2023-12-01 10:00:00' }) {
    this.mockResponses.set('getDbChangedTime', response);
    return nock(this.apiUrl)
      .get('/api/system/db-changed-time')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockStock(response = []) {
    this.mockResponses.set('getStock', response);
    return nock(this.apiUrl)
      .get('/api/stock')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockStockEntry(productId, response = {}) {
    this.mockResponses.set(`getStockEntry-${productId}`, response);
    return nock(this.apiUrl)
      .get(`/api/stock/products/${productId}`)
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockShoppingList(response = []) {
    this.mockResponses.set('getShoppingList', response);
    return nock(this.apiUrl)
      .get('/api/objects/shopping_list')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockAddToShoppingList(productId, amount = 1, response = { id: 123 }) {
    this.mockResponses.set(`addToShoppingList-${productId}`, response);
    return nock(this.apiUrl)
      .post('/api/stock/shoppinglist/add-product', {
        product_id: productId,
        list_id: 1,
        amount: amount
      })
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockChores(response = []) {
    this.mockResponses.set('getChores', response);
    return nock(this.apiUrl)
      .get('/api/objects/chores')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockExecuteChore(choreId, response = { success: true }) {
    this.mockResponses.set(`executeChore-${choreId}`, response);
    return nock(this.apiUrl)
      .post(`/api/chores/${choreId}/execute`)
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockBatteries(response = []) {
    this.mockResponses.set('getBatteries', response);
    return nock(this.apiUrl)
      .get('/api/objects/batteries')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockProducts(response = []) {
    this.mockResponses.set('getProducts', response);
    return nock(this.apiUrl)
      .get('/api/objects/products')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  mockLocations(response = []) {
    this.mockResponses.set('getLocations', response);
    return nock(this.apiUrl)
      .get('/api/objects/locations')
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(200, response);
  }

  // Error response mocking
  mockError(endpoint, statusCode = 500, errorMessage = 'Internal Server Error') {
    return nock(this.apiUrl)
      .get(endpoint)
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(statusCode, { error: errorMessage });
  }

  mockAuthError(endpoint) {
    return nock(this.apiUrl)
      .get(endpoint)
      .matchHeader('GROCY-API-KEY', this.apiKey)
      .reply(401, { error: 'Unauthorized' });
  }

  // Cleanup
  clearAll() {
    nock.cleanAll();
    this.mockResponses.clear();
  }

  // Helper to get stored mock response
  getMockResponse(operation) {
    return this.mockResponses.get(operation);
  }
}

// Sample test data
const sampleData = {
  systemInfo: {
    grocy_version: '4.0.0',
    php_version: '8.1.0',
    sqlite_version: '3.39.0'
  },

  stock: [
    {
      product_id: 1,
      amount: 5.0,
      best_before_date: '2024-12-31',
      product: {
        id: 1,
        name: 'Milk',
        description: '1L whole milk'
      }
    },
    {
      product_id: 2,
      amount: 2.0,
      best_before_date: '2024-06-15',
      product: {
        id: 2,
        name: 'Bread',
        description: 'Whole grain bread'
      }
    }
  ],

  shoppingList: [
    {
      id: 1,
      product_id: 3,
      amount: 1.0,
      product: {
        id: 3,
        name: 'Eggs',
        description: 'Free range eggs'
      }
    }
  ],

  chores: [
    {
      id: 1,
      name: 'Clean kitchen',
      description: 'Weekly kitchen cleaning',
      period_type: 'weekly',
      period_days: 7
    }
  ],

  batteries: [
    {
      id: 1,
      name: 'Remote Control Battery',
      description: 'AA battery for TV remote',
      charge_interval_days: 365
    }
  ],

  products: [
    { id: 1, name: 'Milk', description: '1L whole milk' },
    { id: 2, name: 'Bread', description: 'Whole grain bread' },
    { id: 3, name: 'Eggs', description: 'Free range eggs' }
  ],

  locations: [
    { id: 1, name: 'Fridge', description: 'Main refrigerator' },
    { id: 2, name: 'Pantry', description: 'Dry goods storage' }
  ]
};

module.exports = {
  MockGrocyAPI,
  sampleData
};