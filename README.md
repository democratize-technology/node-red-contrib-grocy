# node-red-contrib-grocy

A set of Node-RED nodes to interact with the Grocy API. These nodes allow easy integration with Grocy, a self-hosted groceries and household management solution.

## Installation

You can install these nodes using the Node-RED Palette Manager or by running:

```
npm install node-red-contrib-grocy
```

## Prerequisites

- Node-RED (version 2.0.0 or later)
- Grocy instance with API access
- Grocy API key

## Node Types

### Grocy API

A general-purpose node to interact with the full Grocy API. Provides access to all API endpoints.

### Grocy Stock

Focused on stock management, allowing you to:
- Get current stock levels
- Add products to stock
- Consume products
- Transfer products between locations
- Inventory products
- Get product details

### Grocy Shopping List

Manage shopping lists in Grocy:
- View, create, update, and delete shopping lists
- Add or remove items from shopping lists
- Add missing, overdue, or expired products to shopping lists
- Clear shopping lists

### Grocy Chores & Tasks

Manage chores and tasks in Grocy:
- List all chores and tasks
- Mark chores as executed
- Complete or undo tasks
- Create, update, and delete tasks

### Grocy Batteries

Track batteries in Grocy:
- List all batteries
- Get battery details
- Log battery charges
- Create, update, and delete batteries

## Usage

### Configuration

1. Add a Grocy Configuration node and configure:
   - API URL: The URL of your Grocy instance (e.g., https://your-grocy-instance.com)
   - API Key: Your Grocy API key (can be generated in Grocy settings)

2. Add a Grocy node to your flow and connect it to the configuration node

### Example Flow

Here's a simple flow to get the current stock:

```json
[
    {
        "id": "123456",
        "type": "grocy-stock",
        "name": "Get Current Stock",
        "server": "config-node-id",
        "operation": "getStock",
        "wires": [
            [
                "debug-node-id"
            ]
        ]
    },
    {
        "id": "config-node-id",
        "type": "grocy-config",
        "name": "My Grocy",
        "apiUrl": "https://your-grocy-instance.com"
    },
    {
        "id": "debug-node-id",
        "type": "debug",
        "name": "Debug",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "x": 540,
        "y": 200,
        "wires": []
    }
]
```

## License

MIT
