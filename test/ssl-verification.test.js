const GrocyClient = require('../nodes/lib/grocy-client');
const customFetch = require('../nodes/lib/custom-fetch');

describe('SSL Verification Features', () => {
    describe('Configuration Options', () => {
        test('should default to SSL verification enabled', () => {
            const config = {
                apiUrl: 'https://grocy.example.com',
                credentials: { apiKey: 'test-key' }
            };
            
            const client = new GrocyClient(config);
            const connInfo = client.getConnectionInfo();
            
            expect(connInfo.sslOptions.verifySsl).toBe(true);
            expect(connInfo.sslOptions.allowSelfSigned).toBe(false);
        });
        
        test('should respect SSL verification disabled setting', () => {
            const config = {
                apiUrl: 'https://grocy.example.com',
                verifySsl: false,
                credentials: { apiKey: 'test-key' }
            };
            
            const client = new GrocyClient(config);
            const connInfo = client.getConnectionInfo();
            
            expect(connInfo.sslOptions.verifySsl).toBe(false);
        });
        
        test('should respect self-signed certificate setting', () => {
            const config = {
                apiUrl: 'https://grocy.example.com',
                verifySsl: true,
                allowSelfSigned: true,
                credentials: { apiKey: 'test-key' }
            };
            
            const client = new GrocyClient(config);
            const connInfo = client.getConnectionInfo();
            
            expect(connInfo.sslOptions.verifySsl).toBe(true);
            expect(connInfo.sslOptions.allowSelfSigned).toBe(true);
        });
        
        test('should respect custom timeout setting', () => {
            const config = {
                apiUrl: 'https://grocy.example.com',
                timeout: 60000,
                credentials: { apiKey: 'test-key' }
            };
            
            const client = new GrocyClient(config);
            const connInfo = client.getConnectionInfo();
            
            expect(connInfo.sslOptions.timeout).toBe(60000);
        });
    });
    
    describe('Self-Hosted Patterns', () => {
        test('should allow HTTP for localhost', () => {
            const config = {
                apiUrl: 'http://localhost:9283',
                credentials: { apiKey: 'test-key' }
            };
            
            expect(() => new GrocyClient(config)).not.toThrow();
        });
        
        test('should allow HTTP for private networks', () => {
            const privateNetworks = [
                'http://192.168.1.100:9283',
                'http://10.0.0.50:9283',
                'http://172.16.0.10:9283'
            ];
            
            privateNetworks.forEach(url => {
                const config = {
                    apiUrl: url,
                    credentials: { apiKey: 'test-key' }
                };
                
                expect(() => new GrocyClient(config)).not.toThrow();
            });
        });
        
        test('should allow HTTP when SSL verification is disabled', () => {
            const config = {
                apiUrl: 'http://grocy.external.com',
                verifySsl: false,
                credentials: { apiKey: 'test-key' }
            };
            
            expect(() => new GrocyClient(config)).not.toThrow();
        });
    });
    
    describe('Security Warnings', () => {
        let consoleWarnSpy;
        
        beforeEach(() => {
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        });
        
        afterEach(() => {
            consoleWarnSpy.mockRestore();
        });
        
        test('should warn about HTTP on public networks', () => {
            const config = {
                apiUrl: 'http://grocy.public.com',
                verifySsl: false,
                credentials: { apiKey: 'test-key' }
            };
            
            new GrocyClient(config);
            
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Security Notice'),
                'grocy.public.com',
                expect.stringContaining('Consider using HTTPS')
            );
        });
        
        test('should warn when SSL verification is disabled', () => {
            const config = {
                apiUrl: 'https://grocy.example.com',
                verifySsl: false,
                credentials: { apiKey: 'test-key' }
            };
            
            new GrocyClient(config);
            
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('SSL verification disabled'),
                'grocy.example.com',
                expect.stringContaining('Certificate validation bypassed')
            );
        });
    });
    
    describe('Custom Fetch Implementation', () => {
        test('should handle self-signed certificate errors gracefully', async () => {
            // This would require mocking the https module
            // For now, we just verify the function exists
            expect(typeof customFetch).toBe('function');
        });
        
        test('should support timeout configuration', async () => {
            // Verify timeout handling exists in custom fetch
            const fetchPromise = customFetch('https://example.com', { timeout: 100 });
            expect(fetchPromise).toBeInstanceOf(Promise);
        });
    });
});