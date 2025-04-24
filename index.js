// Export Grocy Node-RED nodes
module.exports = function(RED) {
    // Load nodes
    require('./nodes/grocy-config.js')(RED);
    require('./nodes/grocy-api.js')(RED);
    require('./nodes/grocy-stock.js')(RED);
    require('./nodes/grocy-shopping-list.js')(RED);
    require('./nodes/grocy-chores.js')(RED);
    require('./nodes/grocy-batteries.js')(RED);
};
