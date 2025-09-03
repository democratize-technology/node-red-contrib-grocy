# Example Flows

This directory contains example Node-RED flows demonstrating how to use the node-red-contrib-grocy nodes.

## Available Examples

### 1. Get Stock (`get-stock.json`)
A simple flow that retrieves current stock levels from Grocy.

**What it does:**
- Fetches all stock items
- Displays current quantities
- Shows products below minimum stock level

**Key concepts:**
- Basic node configuration
- Using the stock node
- Processing response data

### 2. Shopping List Management (`shopping-list.json`)
Complete shopping list workflow including adding items and managing lists.

**What it does:**
- Lists all shopping lists
- Adds items to lists
- Marks items as purchased
- Clears completed items

**Key concepts:**
- Multiple operations in sequence
- Error handling
- Working with list IDs

### 3. Battery Tracking (`batteries.json`)
Comprehensive battery management system.

**What it does:**
- Tracks battery charge cycles
- Monitors battery age
- Sends alerts for batteries needing charge
- Logs charge history

**Key concepts:**
- Scheduling periodic checks
- Creating notifications
- Date/time handling

### 4. Chores & Tasks (`chores.json`)
Automated chore tracking and task management.

**What it does:**
- Lists overdue chores
- Marks chores as completed
- Creates recurring tasks
- Sends reminders

**Key concepts:**
- Working with recurring events
- User assignment
- Due date management

### 5. Advanced API Usage (`api-usage.json`)
Advanced patterns using the generic API node.

**What it does:**
- Custom API queries
- Batch operations
- Complex data transformations
- Integration with other systems

**Key concepts:**
- Direct API access
- Custom endpoints
- Response transformation
- Error recovery

## How to Use These Examples

### Importing Flows

1. Open Node-RED
2. Click the hamburger menu (☰) in the top right
3. Select "Import"
4. Choose "select a file to import"
5. Select one of the JSON files from this directory
6. Click "Import"

### Configuration Required

Before using any example flow:

1. **Add a Grocy Config node:**
   - Double-click the Grocy Config node
   - Enter your Grocy server URL
   - Enter your API key
   - Click "Done"

2. **Deploy the flow:**
   - Click the "Deploy" button
   - Test with inject nodes

### Customization Tips

#### Adapting to Your Setup

- **Product IDs**: Update product IDs to match your Grocy instance
- **Location IDs**: Change location IDs for your storage areas
- **User IDs**: Update user IDs for task assignment
- **List IDs**: Modify shopping list IDs as needed

#### Common Modifications

**Change trigger frequency:**
```javascript
// In inject node, modify repeat interval
// Default: every 24 hours
// Change to: every 6 hours, every week, etc.
```

**Filter results:**
```javascript
// In function node after API call
msg.payload = msg.payload.filter(item => 
    item.amount < item.min_stock_amount
);
return msg;
```

**Add notifications:**
```javascript
// Add email, pushbullet, or telegram nodes
if (msg.payload.length > 0) {
    msg.topic = "Grocy Alert";
    msg.payload = `${msg.payload.length} items need attention`;
    return msg;
}
```

## Example Patterns

### Pattern 1: Conditional Processing
```javascript
// Only process if conditions are met
if (msg.payload.stock_amount < 5) {
    msg.operation = "addToShoppingList";
    return msg;
}
return null; // Stop flow
```

### Pattern 2: Error Recovery
```javascript
// In catch node
if (msg.error.code === 'ECONNREFUSED') {
    // Retry after 5 seconds
    return new Promise(resolve => {
        setTimeout(() => resolve(msg), 5000);
    });
}
node.error("Unrecoverable error", msg);
```

### Pattern 3: Batch Operations
```javascript
// Process multiple items
const results = [];
for (const item of msg.payload) {
    const result = await processItem(item);
    results.push(result);
}
msg.payload = results;
return msg;
```

### Pattern 4: Data Enrichment
```javascript
// Add calculated fields
msg.payload = msg.payload.map(item => ({
    ...item,
    daysUntilExpiry: calculateDays(item.best_before_date),
    value: item.amount * item.price,
    status: item.amount < item.min_stock_amount ? 'low' : 'ok'
}));
return msg;
```

## Troubleshooting Examples

### Issue: Flow doesn't trigger
- Check inject node is enabled
- Verify timestamps if using time-based triggers
- Ensure flow is deployed

### Issue: No data returned
- Verify Grocy has data for the requested operation
- Check API connection in config node
- Enable debug nodes to see actual responses

### Issue: Errors in function nodes
- Check Node-RED logs for JavaScript errors
- Ensure all variables are defined
- Verify data structure matches expectations

## Contributing Examples

Have a useful flow pattern? We welcome contributions!

1. Create your flow
2. Test thoroughly
3. Export as JSON
4. Add documentation
5. Submit a pull request

## Support

For help with examples:
- Open an issue on GitHub
- Check API_REFERENCE.md for operation details
- Review Node-RED documentation for flow basics