# node-red-contrib-grocy

[![npm version](https://badge.fury.io/js/node-red-contrib-grocy.svg)](https://www.npmjs.com/package/node-red-contrib-grocy)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0.0+-red.svg)](https://nodered.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Node-RED nodes for [Grocy](https://grocy.info) — the self-hosted grocery and household management solution. Covers the full Grocy API: stock, shopping lists, chores, tasks, batteries, recipes, and generic CRUD.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Running Tests](#running-tests)
- [Installing in Node-RED](#installing-in-node-red)
- [Configuration Node](#configuration-node)
- [Available Nodes](#available-nodes)
  - [Stock Node](#stock-node)
  - [Shopping List Node](#shopping-list-node)
  - [Chores & Tasks Node](#chores--tasks-node)
  - [Batteries Node](#batteries-node)
  - [API Node (Generic)](#api-node-generic)
- [Message Format](#message-format)
- [Self-Hosted Deployment Scenarios](#self-hosted-deployment-scenarios)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20.0.0 or later |
| Node-RED | 2.0.0 or later |
| Grocy | Any version with API access enabled |

---

## Local Development Setup

These steps get the code running on your machine for development and testing.

### 1. Clone and install dependencies

```bash
git clone https://github.com/democratize-technology/node-red-contrib-grocy.git
cd node-red-contrib-grocy
npm install
```

### 2. Create your local `.env` file

Copy the example and fill in your Grocy credentials:

```bash
cp .env.example .env
```

Open `.env` and set your values:

```ini
# Your Grocy server URL — no trailing slash
GROCY_URL=https://homeassistant.local:9192

# API key from Grocy → Settings → Manage API keys
GROCY_API_KEY=your-api-key-here

# SSL options — set GROCY_ALLOW_SELF_SIGNED=true for self-signed certs
GROCY_VERIFY_SSL=true
GROCY_ALLOW_SELF_SIGNED=true

# Request timeout in milliseconds
GROCY_TIMEOUT=30000
```

> **Note:** `.env` is git-ignored and never committed. `.env.example` shows the required variables.

### 3. Find your Grocy API key

1. Log into your Grocy instance
2. Go to **Settings → Manage API keys**
3. Click **Add** — copy the generated key into `.env`

---

## Running Tests

### Unit tests (no Grocy server needed)

```bash
npm test
```

Runs all unit and mock-based integration tests. Safe to run anywhere, no live server required.

```bash
npm run test:unit        # unit tests only
npm run test:coverage    # with HTML coverage report
npm run test:watch       # re-run on file changes (useful during development)
```

### Live integration tests (requires a real Grocy server)

Once your `.env` is populated with real credentials:

```bash
npm run test:live
```

This hits your actual Grocy instance and verifies every major endpoint. Tests skip automatically if `.env` still has the placeholder values.

Expected output when everything works:

```
PASS test/live/live-api.test.js
  Live Grocy API
    System
      √ GET /system/info — connects and returns version info
      √ GET /system/db-changed-time — returns a timestamp
    Stock
      √ GET /stock — returns an array
      √ GET /stock/volatile — returns due/overdue/expired buckets
    Shopping list
      √ GET /shoppinglist — returns an array
    Recipes
      √ GET /recipes — returns an array via objects endpoint
    Chores
      √ GET /chores — returns an array
    Tasks
      √ GET /tasks — returns an array
    Batteries
      √ GET /batteries — returns an array
    Objects (CRUD)
      √ GET /objects/locations — returns an array
      √ GET /objects/quantity_units — returns an array
      √ GET /objects/product_groups — returns an array
    Users
      √ GET /user/settings — returns current user settings object
    Authentication
      √ API key is sent — bad key gets a 401 or 403

Tests: 14 passed, 14 total
```

---

## Installing in Node-RED

### Option A — Palette Manager (recommended)

1. Open Node-RED
2. Menu (top-right) → **Manage Palette** → **Install** tab
3. Search for `node-red-contrib-grocy`
4. Click **Install**

### Option B — Command line

```bash
# In your Node-RED user directory (usually ~/.node-red)
cd ~/.node-red
npm install node-red-contrib-grocy
```

Then restart Node-RED.

### Option C — Link local development copy

Use this when you're developing the package and want to test changes live in Node-RED without publishing to npm:

```bash
# From the project root
npm link

# In your Node-RED user directory
cd ~/.node-red
npm link node-red-contrib-grocy
```

Restart Node-RED after linking. Any change you make to the source files takes effect after restarting Node-RED (or reloading the palette).

---

## Configuration Node

Every Grocy node requires a **Grocy Config** node that holds the connection details.

### Adding the config node

1. Drag any Grocy node onto the canvas
2. Click the pencil icon next to the **Server** field
3. Fill in the connection details

### Config fields

| Field | Description |
|-------|-------------|
| **Name** | A label for this config (e.g. "Home Grocy") |
| **API URL** | Full URL to your Grocy instance, no trailing slash |
| **API Key** | From Grocy → Settings → Manage API keys |
| **Verify SSL** | Leave enabled unless you have cert issues |
| **Allow self-signed** | Enable for self-hosted instances with self-signed certs |
| **Timeout** | Request timeout in ms (default 30 000) |

### URL examples by setup

| Setup | URL format | SSL settings |
|-------|-----------|--------------|
| Home Assistant add-on | `https://homeassistant.local:9192` | Verify SSL ✓, Allow self-signed ✓ |
| HTTP on local network | `http://192.168.1.50:9283` | N/A |
| Docker + Traefik/Nginx | `https://grocy.home.lan` | Verify SSL ✓, Allow self-signed ✓ |
| Public VPS (Let's Encrypt) | `https://grocy.yourdomain.com` | Verify SSL ✓, Allow self-signed ✗ |

> If your Grocy is behind a reverse proxy that does TLS renegotiation (common with nginx on Home Assistant), the node handles redirect following and IPv4 resolution automatically.

---

## Available Nodes

All nodes share the same pattern: send a message in, get a message out. The `msg.payload` carries the parameters; the response is written back to `msg.payload`.

### Stock Node

**Palette category:** Grocy → Stock

| Operation | Description | Required payload fields |
|-----------|-------------|------------------------|
| `getStock` | Current stock overview | — |
| `getVolatileStock` | Due-soon / overdue / expired items | `dueSoonDays` (optional) |
| `getProductDetails` | Details for one product | `productId` |
| `getProductByBarcode` | Look up product by barcode | `barcode` |
| `addProductToStock` | Add quantity to stock | `productId`, `amount` |
| `addProductToStockByBarcode` | Add by barcode | `barcode`, `amount` |
| `consumeProduct` | Consume from stock | `productId`, `amount` |
| `consumeProductByBarcode` | Consume by barcode | `barcode`, `amount` |
| `transferProduct` | Move product between locations | `productId`, `amount`, `locationIdFrom`, `locationIdTo` |
| `inventoryProduct` | Set absolute stock level | `productId`, `newAmount` |
| `openProduct` | Mark product as opened | `productId`, `amount` |

**Example — consume a product:**

```javascript
msg.payload = {
    productId: 5,
    amount: 1,
    transactionType: "consume",
    spoiled: false
};
msg.operation = "consumeProduct";
return msg;
```

**Example — add to stock:**

```javascript
msg.payload = {
    productId: 12,
    amount: 3,
    bestBeforeDate: "2026-12-31",
    price: 1.99,
    locationId: 2
};
msg.operation = "addProductToStock";
return msg;
```

---

### Shopping List Node

**Palette category:** Grocy → Shopping List

| Operation | Description | Required payload fields |
|-----------|-------------|------------------------|
| `getShoppingLists` | All shopping lists | — |
| `getShoppingListItems` | Items in a list | `shoppingListId` (optional, defaults to list 1) |
| `addProductToShoppingList` | Add a specific product | `productId`, `amount` |
| `removeProductFromShoppingList` | Remove a specific product | `productId` |
| `clearShoppingList` | Remove all items | `listId` (optional) |
| `addMissingProductsToShoppingList` | Add stock-low products | `listId` (optional) |
| `addOverdueProductsToShoppingList` | Add overdue products | `listId` (optional) |
| `addExpiredProductsToShoppingList` | Add expired products | `listId` (optional) |
| `createShoppingList` | Create a new list | `name` |
| `updateShoppingList` | Rename a list | `id`, `name` |
| `deleteShoppingList` | Delete a list | `id` |

**Example — add a product to the shopping list:**

```javascript
msg.payload = {
    productId: 8,
    amount: 2,
    shoppingListId: 1,
    note: "Get organic if available"
};
msg.operation = "addProductToShoppingList";
return msg;
```

**Example — auto-fill with missing stock items:**

```javascript
msg.payload = {};
msg.operation = "addMissingProductsToShoppingList";
return msg;
```

---

### Chores & Tasks Node

**Palette category:** Grocy → Chores

| Operation | Description | Required payload fields |
|-----------|-------------|------------------------|
| `getChores` | All chores with next-due info | — |
| `getChoreDetails` | Details for one chore | `choreId` |
| `executeChore` | Mark chore as done | `choreId` |
| `getTasks` | All open tasks | — |
| `completeTask` | Mark task complete | `taskId` |
| `undoTask` | Undo task completion | `taskId` |

**Example — execute a chore:**

```javascript
msg.payload = {
    choreId: 3,
    trackedTime: "2026-05-01T09:00:00"  // optional
};
msg.operation = "executeChore";
return msg;
```

---

### Batteries Node

**Palette category:** Grocy → Batteries

| Operation | Description | Required payload fields |
|-----------|-------------|------------------------|
| `getBatteries` | All batteries with charge status | — |
| `getBatteryDetails` | Details for one battery | `batteryId` |
| `chargeBattery` | Log a charge cycle | `batteryId` |

**Example — log a battery charge:**

```javascript
msg.payload = {
    batteryId: 2,
    trackedTime: new Date().toISOString()  // optional, defaults to now
};
msg.operation = "chargeBattery";
return msg;
```

---

### API Node (Generic)

**Palette category:** Grocy → API

Use this node when you need an operation not covered by the specialized nodes, or when you want a single node to handle multiple categories.

The **Entity Type** dropdown becomes active for `getObjects` / `addObject` / etc. — select the Grocy entity you want to work with (products, recipes, locations, meal_plan, etc.).

#### System operations

| Operation | Description |
|-----------|-------------|
| `getSystemInfo` | Grocy version, PHP version, DB version |
| `getDbChangedTime` | Timestamp of last database change |
| `getConfig` | Full system configuration |
| `getTime` | Current server time |

#### Recipe operations

| Operation | Required payload |
|-----------|-----------------|
| `getRecipeFulfillment` | `recipeId` |
| `consumeRecipe` | `recipeId` |
| `getAllRecipesFulfillment` | — |
| `addRecipeProductsToShoppingList` | `recipeId` |

**Example — check if you have ingredients for a recipe:**

```javascript
msg.payload = { recipeId: 7 };
msg.operation = "getRecipeFulfillment";
return msg;
```

#### Objects / generic CRUD

Use **Entity Type** dropdown to pick an entity, then choose the operation:

| Operation | Description | Required payload |
|-----------|-------------|-----------------|
| `getObjects` | List all objects of an entity | `entity` (set via dropdown) |
| `getObject` | Get one object | `entity`, `objectId` |
| `addObject` | Create a new object | `entity`, `data` (object body) |
| `editObject` | Update an object | `entity`, `objectId`, `data` |
| `deleteObject` | Delete an object | `entity`, `objectId` |

Available entities include: `products`, `locations`, `quantity_units`, `product_groups`, `shopping_list`, `shopping_lists`, `recipes`, `meal_plan`, `tasks`, `task_categories`, `chores`, `batteries`, and more.

**Example — read the meal plan:**

```javascript
msg.payload = {};
msg.operation = "getObjects";
msg.entity = "meal_plan";
return msg;
```

**Example — create a product:**

```javascript
msg.payload = {
    entity: "products",
    data: {
        name: "Oat Milk",
        location_id: 2,
        qu_id_purchase: 1,
        qu_id_stock: 1,
        qu_factor_purchase_to_stock: 1,
        min_stock_amount: 2
    }
};
msg.operation = "addObject";
return msg;
```

#### User / settings operations

| Operation | Required payload |
|-----------|-----------------|
| `getCurrentUser` | — |
| `getUsers` | — |
| `getUserSettings` | — |
| `getUserSetting` | `settingKey` |
| `setUserSetting` | `settingKey`, `data` |

---

## Message Format

### Input message

Every Grocy node reads:

| Property | Source | Description |
|----------|--------|-------------|
| `msg.payload` | your function / inject node | Parameters for the operation |
| `msg.operation` | optional override | Overrides the operation set in the node UI |

Parameters can be set either in the node's dropdown (static) or sent in `msg.payload` (dynamic). Dynamic wins.

### Output message

On success the node adds to `msg`:

| Property | Type | Description |
|----------|------|-------------|
| `msg.payload` | any | Response from Grocy (array, object, or `{ success: true }`) |
| `msg.operation` | string | The operation that was executed |
| `msg.statusCode` | number | HTTP status code (200, 204, etc.) |

On error, the node calls `node.error()` with the error message and the original `msg`. Wire a **Catch** node to handle errors.

### Complete flow example — low stock alert

This flow checks stock every morning, finds items below minimum, and adds them to the shopping list.

```json
[
    {
        "id": "inject-1",
        "type": "inject",
        "name": "Every morning 8am",
        "repeat": "",
        "crontab": "0 8 * * *",
        "wires": [["stock-node"]]
    },
    {
        "id": "stock-node",
        "type": "grocy-stock",
        "name": "Get Stock",
        "server": "your-config-node-id",
        "operation": "getStock",
        "wires": [["filter-fn"]]
    },
    {
        "id": "filter-fn",
        "type": "function",
        "name": "Find low stock",
        "func": "const low = msg.payload.filter(i => i.stock_amount < i.product.min_stock_amount);\nif (!low.length) return null;\nmsg.payload = low;\nreturn msg;",
        "wires": [["shopping-node"]]
    },
    {
        "id": "shopping-node",
        "type": "grocy-shopping-list",
        "name": "Add missing to list",
        "server": "your-config-node-id",
        "operation": "addMissingProductsToShoppingList",
        "wires": [["debug-1"]]
    },
    {
        "id": "debug-1",
        "type": "debug",
        "name": "Done"
    }
]
```

---

## Self-Hosted Deployment Scenarios

### Home Assistant Grocy add-on

Grocy runs on HTTPS with a self-signed certificate managed by Home Assistant.

**Config node settings:**
```
API URL:            https://homeassistant.local:9192
Verify SSL:         ✓ enabled
Allow self-signed:  ✓ enabled
```

> Node.js resolves `.local` mDNS hostnames — the nodes automatically prefer IPv4 to avoid link-local IPv6 routing issues.

### Docker with HTTP (trusted LAN)

```
API URL:            http://192.168.1.50:9283
Verify SSL:         (not applicable for HTTP)
Allow self-signed:  (not applicable for HTTP)
```

### Docker with Traefik / nginx reverse proxy (HTTPS + self-signed)

```
API URL:            https://grocy.home.lan
Verify SSL:         ✓ enabled
Allow self-signed:  ✓ enabled
```

### Public VPS with Let's Encrypt

```
API URL:            https://grocy.yourdomain.com
Verify SSL:         ✓ enabled
Allow self-signed:  ✗ disabled
```

---

## Troubleshooting

### Connection refused (`ECONNREFUSED`)

- Verify the Grocy server is running
- Check the port number in your URL
- Confirm no firewall is blocking the connection from the Node-RED host

### SSL / TLS errors on self-hosted instance

The most common SSL error messages and their fixes:

| Error | Fix |
|-------|-----|
| `self-signed certificate` | Enable **Allow self-signed** in config node |
| `certificate has expired` | Renew the certificate on the server, or temporarily disable SSL verify |
| `unable to verify the first certificate` | Enable **Allow self-signed** |

### HTTP 400 "The plain HTTP request was sent to HTTPS port"

Your URL uses `http://` but the server requires `https://`. Change the protocol in the config node URL.

### Requests time out / ECONNRESET on `.local` hostnames

This is an IPv6 mDNS issue. The node already handles it internally (preferring IPv4), but if you still see it:

1. Confirm the hostname resolves: `ping homeassistant.local`
2. Use the direct IPv4 address instead: `https://192.168.1.x:9192`

### Invalid / expired API key (401)

1. Log into Grocy → **Settings → Manage API keys**
2. Delete the old key and create a new one
3. Update the **API Key** field in the config node

### Operations return empty arrays on a fresh Grocy install

This is expected — Grocy has no data yet. Create products, chores, and batteries through the Grocy UI first.

---

## Development

```bash
# All unit tests
npm test

# Live tests against a real Grocy server (requires .env)
npm run test:live

# Coverage report (opens in browser)
npm run test:coverage

# Watch mode
npm run test:watch
```

### Project structure

```
nodes/
  grocy-config.js/.html      — Connection config node
  grocy-stock.js/.html       — Stock operations node
  grocy-shopping-list.js/.html — Shopping list node
  grocy-chores.js/.html      — Chores & tasks node
  grocy-batteries.js/.html   — Batteries node
  grocy-api.js/.html         — Generic API node
  lib/
    grocy-api-wrapper.js     — HTTP client (all Grocy endpoints)
    grocy-client.js          — Connection management
    custom-fetch.js          — Low-level HTTP/HTTPS with SSL + redirect support
    handlers/                — Per-node operation handlers
    operations/              — Business logic per domain
test/
  unit/                      — Mocked unit tests
  integration/               — Node-RED helper integration tests
  live/                      — Live tests against a real Grocy server
```

---

## Resources

- [Grocy API reference](https://demo.grocy.info/api/) — live demo with Swagger UI
- [Grocy project](https://grocy.info)
- [Node-RED documentation](https://nodered.org/docs)
- [GitHub issues](https://github.com/democratize-technology/node-red-contrib-grocy/issues)

---

MIT License — [Democratize Technology](https://democratize.technology)
