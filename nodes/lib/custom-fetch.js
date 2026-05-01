const https = require('https');
const http = require('http');
const dns = require('dns');

// Force IPv4 for mDNS (.local) hostnames — link-local IPv6 addresses returned
// by mDNS require a zone ID that Node.js cannot specify in HTTPS connections.
function ipv4Lookup(hostname, options, callback) {
    dns.lookup(hostname, { ...options, family: 4 }, (err, address, family) => {
        if (err) {
            // Fall back to default lookup if IPv4 not available
            dns.lookup(hostname, options, callback);
        } else {
            callback(null, address, family);
        }
    });
}

/**
 * Custom fetch wrapper that supports SSL verification options for self-hosted deployments.
 * This is necessary because the native fetch API doesn't expose certificate verification options.
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options including SSL settings
 * @returns {Promise<Response>} - Fetch response
 */
async function customFetch(url, options = {}, _redirectCount = 0) {
    const MAX_REDIRECTS = 5;
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
                signal: controller.signal,
                redirect: 'follow'
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
            timeout: timeout,
            // Prefer IPv4 to avoid link-local IPv6 issues with mDNS (.local) hostnames
            lookup: ipv4Lookup
        };

        if (isHttps) {
            if (!verifySsl || allowSelfSigned) {
                agentOptions.rejectUnauthorized = false;
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
            // Follow redirects (301, 302, 303, 307, 308)
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume(); // drain the response body
                if (_redirectCount >= MAX_REDIRECTS) {
                    return reject(new Error(`Too many redirects (max ${MAX_REDIRECTS})`));
                }
                const redirectUrl = new URL(res.headers.location, url).toString();
                // 303 always converts to GET; for others preserve the method
                const redirectMethod = res.statusCode === 303 ? 'GET' : (fetchOptions.method || 'GET');
                const redirectOptions = {
                    ...options,
                    method: redirectMethod,
                    // Don't forward body on GET redirect
                    body: redirectMethod === 'GET' ? undefined : fetchOptions.body
                };
                resolve(customFetch(redirectUrl, redirectOptions, _redirectCount + 1));
                return;
            }

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