/**
 * Test data fixtures for Node-RED Grocy tests
 */

// Configuration fixtures
const configurations = {
  validConfig: {
    id: 'config-node-1',
    type: 'grocy-config',
    name: 'Test Grocy Server',
    apiUrl: 'http://localhost:9283',
    credentials: {
      apiKey: 'test-api-key-123'
    }
  },

  invalidConfig: {
    id: 'config-node-2',
    type: 'grocy-config',
    name: 'Invalid Config',
    apiUrl: 'invalid-url',
    credentials: {
      apiKey: ''
    }
  }
};

// Node configurations for different node types
const nodeConfigs = {
  grocyApi: {
    basic: {
      id: 'grocy-api-1',
      type: 'grocy-api',
      name: 'Test API Node',
      server: 'config-node-1',
      operation: 'getSystemInfo',
      entityType: 'system'
    },

    withoutServer: {
      id: 'grocy-api-2',
      type: 'grocy-api',
      name: 'API Node No Server',
      server: '',
      operation: 'getStock',
      entityType: 'stock'
    },

    withoutOperation: {
      id: 'grocy-api-3',
      type: 'grocy-api',
      name: 'API Node No Operation',
      server: 'config-node-1',
      operation: '',
      entityType: 'products'
    }
  },

  grocyStock: {
    basic: {
      id: 'grocy-stock-1',
      type: 'grocy-stock',
      name: 'Test Stock Node',
      server: 'config-node-1',
      operation: 'getStock'
    }
  },

  grocyShoppingList: {
    basic: {
      id: 'grocy-shopping-1',
      type: 'grocy-shopping-list',
      name: 'Test Shopping List Node',
      server: 'config-node-1',
      operation: 'getShoppingList'
    }
  },

  grocyChores: {
    basic: {
      id: 'grocy-chores-1',
      type: 'grocy-chores',
      name: 'Test Chores Node',
      server: 'config-node-1',
      operation: 'getChores'
    }
  },

  grocyBatteries: {
    basic: {
      id: 'grocy-batteries-1',
      type: 'grocy-batteries',
      name: 'Test Batteries Node',
      server: 'config-node-1',
      operation: 'getBatteries'
    }
  }
};

// Test message payloads
const messages = {
  empty: { payload: {} },
  
  systemInfo: {
    payload: {},
    operation: 'getSystemInfo'
  },

  getStock: {
    payload: {},
    operation: 'getStock'
  },

  getStockEntry: {
    payload: { productId: 1 },
    operation: 'getStockEntry'
  },

  addToShoppingList: {
    payload: {
      productId: 1,
      amount: 2
    },
    operation: 'addToShoppingList'
  },

  executeChore: {
    payload: { choreId: 1 },
    operation: 'executeChore'
  },

  invalidMessage: {
    payload: { invalid: 'data' },
    operation: 'nonexistentOperation'
  }
};

// Expected API responses
const expectedResponses = {
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
  ]
};

// Error scenarios
const errorScenarios = {
  networkError: {
    code: 'ECONNREFUSED',
    message: 'Connection refused'
  },

  authError: {
    statusCode: 401,
    message: 'Unauthorized'
  },

  serverError: {
    statusCode: 500,
    message: 'Internal Server Error'
  },

  notFoundError: {
    statusCode: 404,
    message: 'Not Found'
  }
};

// Flow definitions for integration tests
const flows = {
  basicApiFlow: [
    configurations.validConfig,
    nodeConfigs.grocyApi.basic
  ],

  stockFlow: [
    configurations.validConfig,
    nodeConfigs.grocyStock.basic
  ],

  shoppingListFlow: [
    configurations.validConfig,
    nodeConfigs.grocyShoppingList.basic
  ],

  choresFlow: [
    configurations.validConfig,
    nodeConfigs.grocyChores.basic
  ],

  batteriesFlow: [
    configurations.validConfig,
    nodeConfigs.grocyBatteries.basic
  ],

  // Error flow with missing config
  errorFlow: [
    nodeConfigs.grocyApi.withoutServer
  ]
};

module.exports = {
  configurations,
  nodeConfigs,
  messages,
  expectedResponses,
  errorScenarios,
  flows
};