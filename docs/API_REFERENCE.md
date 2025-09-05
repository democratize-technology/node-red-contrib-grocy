# API Reference

## Table of Contents

- [Node Configuration](#node-configuration)
- [Message Structure](#message-structure)
- [Stock Operations](#stock-operations)
- [Shopping List Operations](#shopping-list-operations)
- [Chores & Tasks Operations](#chores--tasks-operations)
- [Battery Operations](#battery-operations)
- [Generic API Operations](#generic-api-operations)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Shared Libraries](#shared-libraries)

## Node Configuration

### Grocy Config Node

The configuration node stores connection details for your Grocy instance.

#### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `name` | string | No | "Grocy" | Display name for the configuration |
| `apiUrl` | string | Yes | - | Base URL of your Grocy instance |
| `apiKey` | string | Yes | - | API key for authentication |
| `timeout` | number | No | 30000 | Request timeout in milliseconds |
| `verifyTls` | boolean | No | true | Whether to verify SSL certificates |

#### Example Configuration

```javascript
{
    name: "Home Grocy",
    apiUrl: "https://grocy.example.com",
    apiKey: "your-api-key-here",
    timeout: 30000,
    verifyTls: true
}
```

## Message Structure

### Input Message

All nodes accept input through the `msg` object with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | object | Operation parameters |
| `msg.operation` | string | Operation to perform (optional, can be set in node) |
| `msg.timeout` | number | Override timeout for this request |
| `msg.headers` | object | Additional HTTP headers |

### Output Message

Successful responses include:

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | any | Response data from Grocy |
| `msg.statusCode` | number | HTTP status code |
| `msg.headers` | object | Response headers |
| `msg.operation` | string | Operation that was performed |

Error responses include:

| Property | Type | Description |
|----------|------|-------------|
| `msg.error` | object | Error details |
| `msg.error.message` | string | Error message |
| `msg.error.code` | string | Error code |
| `msg.error.statusCode` | number | HTTP status code (if applicable) |
| `msg.error.details` | object | Additional error context |

## Stock Operations

### `getStock`
Get current stock overview

**Parameters:** None

**Response:**
```javascript
[
    {
        product_id: 1,
        amount: 5.5,
        amount_aggregated: 10.5,
        value: 25.50,
        product: { /* product details */ },
        best_before_date: "2024-12-31"
    }
]
```

### `getProductDetails`
Get detailed information about a product

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | number | Yes | Product ID |

**Response:**
```javascript
{
    product: { /* product data */ },
    stock_amount: 5,
    stock_value: 10.50,
    default_quantity_unit_purchase: { /* unit details */ },
    quantity_unit_stock: { /* unit details */ }
}
```

### `consumeProduct`
Consume/use a product from stock

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `productId` | number | Yes | - | Product ID |
| `amount` | number | Yes | - | Amount to consume |
| `transactionType` | string | No | "consume" | Type of consumption |
| `spoiled` | boolean | No | false | Whether product is spoiled |
| `locationId` | number | No | null | Location ID |
| `recipeId` | number | No | null | Recipe ID if consumed for recipe |
| `stockEntryId` | string | No | null | Specific stock entry |

**Response:**
```javascript
{
    id: 123,
    product_id: 1,
    amount: -2,
    transaction_type: "consume",
    transaction_date: "2024-01-15"
}
```

### `addProduct`
Add product to stock

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `productId` | number | Yes | - | Product ID |
| `amount` | number | Yes | - | Amount to add |
| `bestBeforeDate` | string | No | null | Best before date (YYYY-MM-DD) |
| `transactionType` | string | No | "purchase" | Transaction type |
| `price` | number | No | null | Purchase price |
| `locationId` | number | No | null | Storage location |
| `shoppingLocationId` | number | No | null | Where purchased |

### `transferProduct`
Transfer product between locations

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | number | Yes | Product ID |
| `amount` | number | Yes | Amount to transfer |
| `locationIdFrom` | number | Yes | Source location |
| `locationIdTo` | number | Yes | Destination location |
| `stockEntryId` | string | No | Specific stock entry |

### `inventoryProduct`
Set exact product inventory

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | number | Yes | Product ID |
| `newAmount` | number | Yes | New total amount |
| `bestBeforeDate` | string | No | Best before date |
| `locationId` | number | No | Location ID |
| `price` | number | No | Current price |

### `openProduct`
Mark product as opened

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | number | Yes | Product ID |
| `amount` | number | No | Amount opened (default: 1) |
| `stockEntryId` | string | No | Specific stock entry |

## Shopping List Operations

### `getShoppingLists`
Get all shopping lists

**Parameters:** None

**Response:**
```javascript
[
    {
        id: 1,
        name: "Grocery List",
        description: "Weekly shopping"
    }
]
```

### `getShoppingListItems`
Get items in a shopping list

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listId` | number | Yes | Shopping list ID |

### `addItem`
Add item to shopping list

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `listId` | number | Yes | - | Shopping list ID |
| `productId` | number | Yes | - | Product ID |
| `amount` | number | No | 1 | Amount to add |
| `note` | string | No | "" | Additional note |
| `shoppingListId` | number | No | listId | Alternative parameter name |

### `updateItem`
Update shopping list item

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listId` | number | Yes | Shopping list ID |
| `itemId` | number | Yes | Item ID |
| `amount` | number | No | New amount |
| `note` | string | No | Updated note |
| `done` | boolean | No | Mark as done |

### `removeItem`
Remove item from shopping list

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listId` | number | Yes | Shopping list ID |
| `itemId` | number | Yes | Item ID |

### `clearList`
Clear all items from shopping list

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listId` | number | Yes | Shopping list ID |

### `addMissingProducts`
Add products below minimum stock

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `listId` | number | No | Target shopping list (default: 1) |

## Chores & Tasks Operations

### `getChores`
Get all chores

**Parameters:** None

**Response:**
```javascript
[
    {
        id: 1,
        name: "Clean Kitchen",
        period_type: "daily",
        period_days: 1,
        next_execution_date: "2024-01-16"
    }
]
```

### `getChoreDetails`
Get chore details

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `choreId` | number | Yes | Chore ID |

### `executeChore`
Mark chore as done

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `choreId` | number | Yes | - | Chore ID |
| `doneTime` | string | No | now | Execution timestamp |
| `doneBy` | number | No | null | User ID who did it |

### `getTasks`
Get all tasks

**Parameters:** None

### `createTask`
Create new task

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Task name |
| `description` | string | No | "" | Task description |
| `dueDate` | string | No | null | Due date (YYYY-MM-DD) |
| `categoryId` | number | No | null | Category ID |
| `assignedToUserId` | number | No | null | Assigned user |

### `completeTask`
Mark task as complete

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | number | Yes | Task ID |
| `doneTime` | string | No | Completion timestamp |

### `deleteTask`
Delete a task

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | number | Yes | Task ID |

## Battery Operations

### `getBatteries`
Get all tracked batteries

**Parameters:** None

**Response:**
```javascript
[
    {
        id: 1,
        name: "Remote Control",
        charge_cycles_count: 5,
        last_charged: "2024-01-01"
    }
]
```

### `getBatteryDetails`
Get battery details

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `batteryId` | number | Yes | Battery ID |

### `trackCharge`
Record battery charge

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `batteryId` | number | Yes | - | Battery ID |
| `chargedTime` | string | No | now | When charged |

### `createBattery`
Create new battery

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Battery name |
| `description` | string | No | "" | Description |
| `usedIn` | string | No | "" | Where it's used |
| `chargeCyclesCount` | number | No | 0 | Initial charge count |

## Generic API Operations

The generic API node provides direct access to any Grocy endpoint.

### Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `method` | string | No | "GET" | HTTP method |
| `endpoint` | string | Yes | - | API endpoint path |
| `payload` | object | No | {} | Request body/parameters |
| `headers` | object | No | {} | Additional headers |

### Examples

#### Custom GET Request
```javascript
msg.payload = {
    endpoint: "/api/objects/products",
    method: "GET"
};
```

#### Custom POST Request
```javascript
msg.payload = {
    endpoint: "/api/objects/products",
    method: "POST",
    payload: {
        name: "New Product",
        description: "Product description"
    }
};
```

## Error Handling

### Error Classification

The error handler classifies errors into categories:

| Category | Error Codes | Recovery Strategy |
|----------|------------|-------------------|
| Network | `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND` | Retry with backoff |
| Authentication | `401`, `403` | Check API key |
| Validation | `400`, `422` | Fix input data |
| Rate Limit | `429` | Wait and retry |
| Server Error | `500`, `502`, `503` | Retry after delay |
| Timeout | `TIMEOUT` | Increase timeout setting |

### Error Response Structure

```javascript
{
    message: "Human-readable error message",
    code: "ERROR_CODE",
    statusCode: 400,
    details: {
        field: "productId",
        value: -1,
        constraint: "must be positive"
    },
    isRetryable: true,
    suggestedRetryAfter: 5000,
    context: {
        operation: "consumeProduct",
        nodeId: "node123"
    }
}
```

### Error Recovery Examples

#### Handling Network Errors
```javascript
if (msg.error && msg.error.code === 'ECONNREFUSED') {
    // Grocy server is not accessible
    // Implement retry logic
    setTimeout(() => {
        node.send(msg);
    }, 5000);
}
```

#### Handling Validation Errors
```javascript
if (msg.error && msg.error.statusCode === 400) {
    // Input validation failed
    // Check error.details for specific field issues
    console.error('Validation failed:', msg.error.details);
}
```

## Validation Rules

### Field Types

#### ID Validation
- Must be positive integer
- Maximum value: 2147483647
- Zero allowed only when explicitly configured

#### String Validation
- Configurable min/max length
- UTF-8 support
- Pattern matching with regex
- XSS prevention through sanitization

#### Date Validation
- Format: YYYY-MM-DD
- Future dates allowed for best-before
- Past dates allowed for consumption

#### Number Validation
- Positive numbers for amounts
- Decimal support for quantities
- Currency format for prices

#### URL Validation
- Protocol required (http/https)
- Valid hostname
- Port number optional
- Path and query parameters allowed

### Validation Options

```javascript
// Required field validation
validators.validateRequired(payload, ['field1', 'field2'], {
    collectAllErrors: true  // Collect all errors instead of throwing on first
});

// ID validation
validators.validateId(id, {
    allowZero: false,
    maxValue: 1000000
});

// String validation
validators.validateString(value, {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9]+$/,
    allowUnicode: true
});

// URL validation
validators.validateUrl(url, {
    requireHttps: true,
    allowLocalhost: false
});
```

## Shared Libraries

### BaseNode Class

Base class for all Grocy nodes providing common functionality.

#### Methods

| Method | Description |
|--------|-------------|
| `constructor(config)` | Initialize node with configuration |
| `processInput(msg, config)` | Process incoming message (override in subclass) |
| `handleError(error, msg, operation)` | Unified error handling |
| `setNodeStatus(status, text)` | Update node status indicator |

#### Usage Example

```javascript
class MyGrocyNode extends BaseNode {
    constructor(config) {
        super(config, RED, 'my-node-type');
    }
    
    async processInput(msg, config) {
        try {
            const result = await this.performOperation(msg.payload);
            return { payload: result };
        } catch (error) {
            throw this.handleError(error, msg, 'myOperation');
        }
    }
}
```

### GrocyClient

Wrapper around the node-grocy API client.

#### Methods

| Method | Description |
|--------|-------------|
| `constructor(config)` | Initialize with API configuration |
| `getClient()` | Get or create API client instance |
| `testConnection()` | Test API connectivity |
| `handleRequest(operation, payload)` | Execute API operation |

### ErrorHandler

Centralized error handling and classification.

#### Static Methods

| Method | Description |
|--------|-------------|
| `classifyError(error)` | Determine error category |
| `formatError(error, context)` | Format error for output |
| `createValidationError(field, value, constraint)` | Create validation error |
| `createTimeoutError(operation, timeout)` | Create timeout error |
| `isRetryable(error)` | Check if error can be retried |

### TimeoutHandler

Manages request timeouts with cleanup.

#### Methods

| Method | Description |
|--------|-------------|
| `executeWithTimeout(promise, timeout, operation)` | Execute with timeout |
| `cleanup()` | Clean up pending timeouts |

### OperationRouter

Routes operations to appropriate handler modules.

#### Methods

| Method | Description |
|--------|-------------|
| `route(nodeType, operation, client, payload)` | Route to operation handler |
| `getAvailableOperations(nodeType)` | List operations for node type |

## Operation Modules

### Module Structure

Each operation module exports functions for specific operations:

```javascript
// operations/stock-operations.js
module.exports = {
    async getStock(client, payload) {
        // Implementation
    },
    
    async consumeProduct(client, payload) {
        validators.validateRequired(payload, ['productId', 'amount']);
        validators.validateId(payload.productId);
        validators.validateNumber(payload.amount, { min: 0.01 });
        
        return await client.stock.consumeProduct(
            payload.productId,
            payload.amount,
            payload.transactionType,
            payload.spoiled
        );
    }
};
```

### Available Modules

| Module | Operations | Description |
|--------|------------|-------------|
| `stock-operations` | 20+ operations | Stock management |
| `shopping-list-operations` | 10+ operations | Shopping list management |
| `task-chore-operations` | 12+ operations | Tasks and chores |
| `battery-operations` | 8+ operations | Battery tracking |
| `product-operations` | 6+ operations | Product master data |
| `generic-operations` | Any endpoint | Direct API access |

## Advanced Usage

### Custom Headers

```javascript
msg.headers = {
    'X-Custom-Header': 'value',
    'Accept-Language': 'en-US'
};
```

### Batch Operations

```javascript
// Process multiple products
const products = [1, 2, 3, 4, 5];
const results = await Promise.all(
    products.map(id => 
        node.processInput({
            payload: { productId: id },
            operation: 'getProductDetails'
        })
    )
);
```

### Error Recovery with Exponential Backoff

```javascript
async function retryWithBackoff(operation, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!ErrorHandler.isRetryable(error)) {
                throw error;
            }
            
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}
```

### Webhook Integration

```javascript
// Use with Node-RED HTTP In node
// POST /api/grocy/consume/:productId/:amount

msg.payload = {
    productId: msg.req.params.productId,
    amount: msg.req.params.amount,
    transactionType: 'consume'
};
msg.operation = 'consumeProduct';
```

## Performance Considerations

### Caching

Implement caching for frequently accessed data:

```javascript
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getCachedStock() {
    const cached = cache.get('stock');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const data = await fetchStock();
    cache.set('stock', { data, timestamp: Date.now() });
    return data;
}
```

### Connection Pooling

The client maintains connection pools automatically. Configure in Grocy config node:

```javascript
{
    maxSockets: 10,      // Maximum concurrent connections
    keepAlive: true,     // Keep connections alive
    keepAliveMsecs: 1000 // Keep-alive interval
}
```

### Rate Limiting

Implement rate limiting to avoid overwhelming the API:

```javascript
const RateLimiter = require('limiter').RateLimiter;
const limiter = new RateLimiter(10, 'second'); // 10 requests per second

async function rateLimitedRequest(operation) {
    return new Promise((resolve, reject) => {
        limiter.removeTokens(1, async (err) => {
            if (err) return reject(err);
            try {
                resolve(await operation());
            } catch (error) {
                reject(error);
            }
        });
    });
}
```

## Migration Guide

### From v0.1.x to v0.2.x

The refactored architecture maintains backward compatibility while offering improved performance:

1. **No breaking changes** in node configuration or message format
2. **Operation names remain the same**
3. **Error format enhanced** but maintains backward compatibility
4. **New operations added** without affecting existing ones

### Future Deprecations

None currently planned. All v0.1.x flows will continue to work.