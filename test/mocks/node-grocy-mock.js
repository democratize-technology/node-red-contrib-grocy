/**
 * Mock implementation of node-grocy for testing
 */
class MockGrocyAPI {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  // System operations
  async getSystemInfo() {
    return { grocy_version: '3.3.2', php_version: '8.1.0' };
  }

  async getDbChangedTime() {
    return { changed_time: '2023-01-01 12:00:00' };
  }

  async getConfig() {
    return { calendar: { first_day_of_week: 1 } };
  }

  async getTime(offset = 0) {
    return { time: new Date().toISOString() };
  }

  // Stock operations
  async getStock() {
    return [
      { product_id: 1, amount: '10', best_before_date: '2023-12-31' }
    ];
  }

  async getStockEntry(entryId) {
    return { id: entryId, amount: '5', best_before_date: '2023-12-31' };
  }

  async editStockEntry(entryId, data) {
    return { id: entryId, ...data };
  }

  async getVolatileStock(dueSoonDays) {
    return [];
  }

  async getProductDetails(productId) {
    return { id: productId, name: 'Test Product' };
  }

  async getProductByBarcode(barcode) {
    return { id: 1, name: 'Test Product', barcode };
  }

  async addProductToStock(productId, data) {
    return { success: true, product_id: productId };
  }

  async addProductToStockByBarcode(barcode, data) {
    return { success: true, barcode };
  }

  async consumeProduct(productId, data) {
    return { success: true, product_id: productId };
  }

  async consumeProductByBarcode(barcode, data) {
    return { success: true, barcode };
  }

  async transferProduct(productId, data) {
    return { success: true, product_id: productId };
  }

  async inventoryProduct(productId, data) {
    return { success: true, product_id: productId };
  }

  async openProduct(productId, data) {
    return { success: true, product_id: productId };
  }

  // Shopping list operations
  async getShoppingList() {
    return [];
  }

  async addProductToShoppingList(productId, data) {
    return { success: true, product_id: productId };
  }

  async removeProductFromShoppingList(productId) {
    return { success: true, product_id: productId };
  }

  async clearShoppingList() {
    return { success: true };
  }

  // Generic operations
  async getObjects(entity, query) {
    return [];
  }

  async getObject(entity, objectId) {
    return { id: objectId };
  }

  async createObject(entity, data) {
    return { id: 1, ...data };
  }

  async editObject(entity, objectId, data) {
    return { id: objectId, ...data };
  }

  async deleteObject(entity, objectId) {
    return { success: true, id: objectId };
  }

  // File operations
  async uploadFile(group, fileName, fileData) {
    return { success: true, group, fileName };
  }

  async getFile(group, fileName) {
    return Buffer.from('test file content');
  }

  async deleteFile(group, fileName) {
    return { success: true, group, fileName };
  }

  // User settings
  async getUserSetting(settingKey) {
    return { value: 'test-value' };
  }

  async setUserSetting(settingKey, value) {
    return { success: true, settingKey, value };
  }

  // Task/Chore operations
  async getTasks() {
    return [];
  }

  async getTask(taskId) {
    return { id: taskId, name: 'Test Task' };
  }

  async completeTask(taskId) {
    return { success: true, task_id: taskId };
  }

  async getChores() {
    return [];
  }

  async getChore(choreId) {
    return { id: choreId, name: 'Test Chore' };
  }

  async executeChore(choreId, trackedTime) {
    return { success: true, chore_id: choreId };
  }

  // Battery operations
  async getBatteries() {
    return [];
  }

  async getBattery(batteryId) {
    return { id: batteryId, name: 'Test Battery' };
  }

  async chargeBattery(batteryId, trackedTime) {
    return { success: true, battery_id: batteryId };
  }
}

module.exports = MockGrocyAPI;