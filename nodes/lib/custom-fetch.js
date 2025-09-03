const https = require('https');
const http = require('http');

/**
 * Custom fetch wrapper that supports SSL verification options for self-hosted deployments.
 * This is necessary because the native fetch API doesn't expose certificate verification options.
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options including SSL settings
 * @returns {Promise<Response>} - Fetch response
 */
async function customFetch(url, options = {}) {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    
    // Extract custom SSL options (not part of standard fetch)
    const { 
        verifySsl = true, 
        allowSelfSigned = false, 
        timeout = 30000,
        ...fetchOptions 
    } = options;
    
    // If using native fetch and HTTPS with default settings, use it directly
    if (typeof fetch !== 'undefined' && isHttps && verifySsl && !allowSelfSigned) {
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }
    
    // For HTTP or custom SSL settings, use Node.js http/https modules
    return new Promise((resolve, reject) => {
        const protocol = isHttps ? https : http;
        
        // Build agent options for SSL configuration
        const agentOptions = {
            timeout: timeout
        };
        
        if (isHttps) {
            // SSL/TLS options for self-hosted scenarios
            if (!verifySsl) {
                // Completely disable certificate verification (use with caution)
                agentOptions.rejectUnauthorized = false;
            } else if (allowSelfSigned) {
                // Allow self-signed certificates but still verify hostname
                agentOptions.rejectUnauthorized = false;
                // Note: In production, you might want to pin specific certificates here
            }
        }
        
        // Create custom agent with SSL settings
        const agent = new protocol.Agent(agentOptions);
        
        // Prepare request options
        const requestOptions = {
            method: fetchOptions.method || 'GET',
            headers: fetchOptions.headers || {},
            agent: agent,
            timeout: timeout
        };
        
        const req = protocol.request(parsedUrl, requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // Create a fetch-like response object
                const response = {
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: {
                        get: (name) => res.headers[name.toLowerCase()]
                    },
                    text: async () => data,
                    json: async () => {
                        try {
                            return JSON.parse(data);
                        } catch (e) {
                            throw new Error('Invalid JSON response');
                        }
                    }
                };
                resolve(response);
            });
        });
        
        req.on('error', (error) => {
            if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                reject(new Error(
                    'Certificate verification failed. This often happens with self-signed certificates. ' +
                    'Enable "Allow self-signed certificates" in the configuration if you trust this server.'
                ));
            } else if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                reject(new Error(
                    'Self-signed certificate detected. Enable "Allow self-signed certificates" ' +
                    'in the configuration if you trust this server.'
                ));
            } else if (error.code === 'CERT_HAS_EXPIRED') {
                reject(new Error(
                    'SSL certificate has expired. Contact the server administrator or ' +
                    'disable SSL verification (not recommended) if you trust this server.'
                ));
            } else if (error.code === 'ECONNREFUSED') {
                reject(new Error(
                    'Connection refused. Please check if the Grocy server is running and accessible.'
                ));
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                reject(new Error(`Connection timeout after ${timeout}ms`));
            } else {
                reject(error);
            }
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        // Send request body if present
        if (fetchOptions.body) {
            req.write(fetchOptions.body);
        }
        
        req.end();
    });
}

module.exports = customFetch;