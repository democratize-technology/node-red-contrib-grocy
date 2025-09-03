const customFetch = require('./custom-fetch');
const { createLogger, generateCorrelationId } = require('./logging');

/**
 * Wrapper around node-grocy API that adds SSL verification support.
 * This extends the base Grocy API class to use our custom fetch implementation
 * that supports self-hosted deployment patterns.
 */
class GrocyAPIWrapper {
    constructor(baseUrl, apiKey, sslOptions = {}, loggingConfig = {}) {
        this.baseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
        this.apiKey = apiKey;
        this.sslOptions = {
            verifySsl: sslOptions.verifySsl !== false,
            allowSelfSigned: sslOptions.allowSelfSigned === true,
            timeout: sslOptions.timeout || 30000
        };
        
        // Initialize logger if config provided
        this.logger = loggingConfig.enabled !== false ? createLogger({
            id: loggingConfig.nodeId || 'grocy-api-wrapper',
            type: 'api-wrapper',
            ...loggingConfig
        }) : null;
        
        // Try to load the actual node-grocy module
        try {
            const GrocyModule = require('node-grocy');
            this._baseAPI = new GrocyModule(baseUrl, apiKey);
        } catch (error) {
            // Module not available, we'll handle requests directly
            this._baseAPI = null;
        }
    }
    
    /**
     * Make a request to the Grocy API with SSL options
     */
    async request(endpoint, method = 'GET', data = null, queryParams = {}, correlationId = null) {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }
        
        // Generate correlation ID if not provided
        const cid = correlationId || (this.logger ? generateCorrelationId() : null);
        
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        // Add query parameters
        if (queryParams && Object.keys(queryParams).length > 0) {
            Object.entries(queryParams).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => url.searchParams.append(`${key}[]`, v));
                } else if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }
        
        const options = {
            method,
            headers: {
                'GROCY-API-KEY': this.apiKey,
                'Content-Type': 'application/json'
            },
            // Include our SSL options
            verifySsl: this.sslOptions.verifySsl,
            allowSelfSigned: this.sslOptions.allowSelfSigned,
            timeout: this.sslOptions.timeout
        };
        
        // Add correlation ID header if available
        if (cid) {
            options.headers['X-Correlation-ID'] = cid;
        }
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // Log request if logger is available
        let requestContext = null;
        if (this.logger) {
            requestContext = this.logger.logRequest(method, endpoint, {
                url: url.toString(),
                hasData: !!data,
                queryParamCount: Object.keys(queryParams).length
            }, cid);
        }
        
        try {
            const response = await customFetch(url.toString(), options);
            
            // Handle non-JSON responses
            if (response.status === 204) {
                // Log successful response
                if (this.logger && requestContext) {
                    this.logger.logResponse(requestContext, 204, { noContent: true });
                }
                return { success: true };
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                
                if (!response.ok) {
                    const error = new Error(jsonData.error_message || `HTTP error! status: ${response.status}`);
                    // Log error response
                    if (this.logger && requestContext) {
                        this.logger.logResponse(requestContext, response.status, {
                            error: jsonData.error_message
                        }, error);
                    }
                    throw error;
                }
                
                // Log successful response
                if (this.logger && requestContext) {
                    this.logger.logResponse(requestContext, response.status, {
                        hasData: true,
                        dataType: typeof jsonData
                    });
                }
                
                return jsonData;
            } else if (response.ok) {
                // Log successful non-JSON response
                if (this.logger && requestContext) {
                    this.logger.logResponse(requestContext, response.status, {
                        contentType: contentType || 'unknown'
                    });
                }
                return { success: true };
            }
            
            const error = new Error(`HTTP error! status: ${response.status}`);
            // Log error response
            if (this.logger && requestContext) {
                this.logger.logResponse(requestContext, response.status, {}, error);
            }
            throw error;
        } catch (error) {
            // Log error if we haven't already
            if (this.logger && requestContext && !error.logged) {
                this.logger.logResponse(requestContext, 0, {
                    errorType: error.constructor.name,
                    errorCode: error.code
                }, error);
            }
            
            // Enhance error messages for common SSL issues
            if (error.message.includes('self-signed')) {
                throw new Error(
                    'SSL Error: ' + error.message + '\n' +
                    'Solution: Enable "Allow self-signed certificates" in the Grocy configuration node.'
                );
            } else if (error.message.includes('certificate')) {
                throw new Error(
                    'SSL Error: ' + error.message + '\n' +
                    'Solution: Check SSL settings in the Grocy configuration node.'
                );
            }
            throw error;
        }
    }
    
    // Proxy common methods to either the base API or our custom implementation
    async getSystemInfo() {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            // Use original API for standard HTTPS
            return this._baseAPI.getSystemInfo();
        }
        return this.request('/system/info');
    }
    
    async testConnection() {
        try {
            const info = await this.getSystemInfo();
            return { success: true, systemInfo: info };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Stock methods
    async getStock() {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getStock();
        }
        return this.request('/stock');
    }
    
    async getStockByProductId(productId) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getStockByProductId(productId);
        }
        return this.request(`/stock/products/${productId}`);
    }
    
    // Shopping list methods
    async getShoppingList() {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getShoppingList();
        }
        return this.request('/stock/shoppinglist');
    }
    
    async addToShoppingList(productId, amount, note) {
        const data = {
            product_id: productId,
            amount: amount,
            note: note
        };
        
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.addToShoppingList(productId, amount, note);
        }
        return this.request('/stock/shoppinglist/add-product', 'POST', data);
    }
    
    // Chores methods
    async getChores() {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getChores();
        }
        return this.request('/chores');
    }
    
    async getChore(choreId) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getChore(choreId);
        }
        return this.request(`/chores/${choreId}`);
    }
    
    // Battery methods
    async getBatteries() {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getBatteries();
        }
        return this.request('/batteries');
    }
    
    async getBattery(batteryId) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getBattery(batteryId);
        }
        return this.request(`/batteries/${batteryId}`);
    }
    
    // Generic entity methods
    async getObjects(entity) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getObjects(entity);
        }
        return this.request(`/objects/${entity}`);
    }
    
    async getObject(entity, objectId) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.getObject(entity, objectId);
        }
        return this.request(`/objects/${entity}/${objectId}`);
    }
    
    async createObject(entity, data) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.createObject(entity, data);
        }
        return this.request(`/objects/${entity}`, 'POST', data);
    }
    
    async editObject(entity, objectId, data) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.editObject(entity, objectId, data);
        }
        return this.request(`/objects/${entity}/${objectId}`, 'PUT', data);
    }
    
    async deleteObject(entity, objectId) {
        if (this._baseAPI && this.sslOptions.verifySsl && !this.sslOptions.allowSelfSigned) {
            return this._baseAPI.deleteObject(entity, objectId);
        }
        return this.request(`/objects/${entity}/${objectId}`, 'DELETE');
    }
}

module.exports = GrocyAPIWrapper;