# SSL/TLS Configuration Guide

This guide explains the SSL/TLS verification options available in node-red-contrib-grocy, designed to support both secure cloud deployments and self-hosted instances.

## Quick Start

### Default Configuration (Recommended)
```javascript
// Secure by default - full SSL verification
{
    apiUrl: "https://grocy.yourdomain.com",
    verifySsl: true,  // Default
    allowSelfSigned: false  // Default
}
```

### Common Self-Hosted Patterns

#### Home Network (HTTP)
```javascript
// Common for Home Assistant, local NAS
{
    apiUrl: "http://192.168.1.100:9283",
    verifySsl: false  // Not applicable for HTTP
}
```

#### Homelab with Self-Signed Certificate
```javascript
// Docker + Traefik/Nginx with self-signed cert
{
    apiUrl: "https://grocy.homelab.local",
    verifySsl: true,
    allowSelfSigned: true
}
```

#### Trusted Internal Network
```javascript
// Corporate network or trusted VLAN
{
    apiUrl: "https://grocy.internal.corp",
    verifySsl: false  // Disable for internal CA issues
}
```

## Configuration Options

### `verifySsl` (boolean)
- **Default:** `true`
- **Purpose:** Enable/disable SSL certificate verification
- **When to disable:**
  - Self-hosted instances with certificate issues
  - Internal networks with custom CAs
  - Development/testing environments
- **Security:** Only disable for trusted networks

### `allowSelfSigned` (boolean)
- **Default:** `false`
- **Purpose:** Accept self-signed certificates
- **Requires:** `verifySsl: true`
- **When to enable:**
  - Homelab deployments with self-signed certs
  - Development environments
  - Internal deployments without proper CA

### `timeout` (number)
- **Default:** `30000` (30 seconds)
- **Range:** `1000` - `300000` ms
- **Purpose:** Connection timeout for slow networks
- **When to increase:**
  - Slow network connections
  - Large database operations
  - Remote/cloud instances

## Security Warnings

The system provides contextual warnings based on your configuration:

### 🔒 HTTPS with Full Verification
```
✓ HTTPS with full certificate verification for grocy.example.com
```
No warnings - this is the most secure configuration.

### ⚠️ HTTP Connection
```
⚠️ SECURITY: Using HTTP connection to grocy.public.com
API key and data are transmitted unencrypted.
Consider using HTTPS for better security.
```
Shows when using HTTP on non-local networks.

### ℹ️ Local Network HTTP
```
ℹ️ Using HTTP for local/private network at 192.168.1.100
```
Informational message for recognized private networks.

### 🔓 SSL Verification Disabled
```
🔓 SSL verification disabled for grocy.internal.local
Certificate validation bypassed - use only for trusted networks.
```
Shows when SSL verification is explicitly disabled.

### 📜 Self-Signed Certificates Allowed
```
📜 HTTPS with self-signed certificates allowed for grocy.homelab.local
```
Shows when accepting self-signed certificates.

## Common Deployment Scenarios

### 1. Cloud VPS with Let's Encrypt
**Scenario:** Public-facing Grocy instance with proper SSL certificate
```javascript
{
    apiUrl: "https://grocy.yourdomain.com",
    verifySsl: true,
    allowSelfSigned: false
}
```
**Security Level:** ⭐⭐⭐⭐⭐ Maximum

### 2. Home Assistant Integration
**Scenario:** Local network integration with Home Assistant
```javascript
{
    apiUrl: "http://192.168.1.50:9283",
    verifySsl: false  // HTTP doesn't use SSL
}
```
**Security Level:** ⭐⭐⭐ Acceptable for isolated networks

### 3. Docker Homelab with Traefik
**Scenario:** Reverse proxy with self-signed certificate
```javascript
{
    apiUrl: "https://grocy.homelab.local",
    verifySsl: true,
    allowSelfSigned: true
}
```
**Security Level:** ⭐⭐⭐⭐ Good for internal use

### 4. Corporate Network with Internal CA
**Scenario:** Enterprise deployment with custom certificate authority
```javascript
{
    apiUrl: "https://grocy.corp.internal",
    verifySsl: false,  // Or true with proper CA trust
    timeout: 60000  // Longer timeout for corporate networks
}
```
**Security Level:** ⭐⭐⭐ Depends on network security

### 5. Development Environment
**Scenario:** Local development and testing
```javascript
{
    apiUrl: "http://localhost:9283",
    verifySsl: true  // Irrelevant for localhost HTTP
}
```
**Security Level:** N/A - Development only

## Troubleshooting

### Certificate Errors

#### Error: "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
**Solution:** Enable `allowSelfSigned: true` for self-signed certificates

#### Error: "DEPTH_ZERO_SELF_SIGNED_CERT"
**Solution:** Enable `allowSelfSigned: true` or disable `verifySsl` for trusted networks

#### Error: "CERT_HAS_EXPIRED"
**Solution:** 
1. Renew the certificate (recommended)
2. Or disable `verifySsl` for trusted networks only

### Connection Issues

#### Error: "ECONNREFUSED"
**Problem:** Grocy server not accessible
**Solutions:**
- Verify Grocy is running
- Check firewall rules
- Verify correct port number

#### Error: "Request timeout after 30000ms"
**Problem:** Slow network or server response
**Solution:** Increase `timeout` value (up to 300000ms)

## Best Practices

### For Production Deployments
1. **Always use HTTPS** with valid certificates
2. **Keep SSL verification enabled** (`verifySsl: true`)
3. **Use proper certificates** from Let's Encrypt or trusted CA
4. **Regular certificate renewal** before expiration

### For Self-Hosted Deployments
1. **Isolate on VLANs** when using HTTP
2. **Use self-signed certificates** rather than HTTP when possible
3. **Document security decisions** in your deployment notes
4. **Consider reverse proxy** with proper SSL termination

### For Development
1. **Use localhost** for HTTP during development
2. **Test with HTTPS** before production deployment
3. **Don't commit** insecure configurations to version control

## Security Considerations

### API Key Protection
Your Grocy API key is transmitted with every request. Protection levels:
- **HTTPS + Verification:** Encrypted and verified ✅
- **HTTPS + Self-Signed:** Encrypted but not fully verified ⚠️
- **HTTPS + No Verification:** Encrypted but vulnerable to MITM ⚠️
- **HTTP:** Completely unprotected ❌

### Network Segmentation
When using HTTP or disabled SSL verification:
- Isolate on separate VLAN
- Use firewall rules to restrict access
- Consider VPN for remote access
- Monitor network traffic

### Regular Security Audits
- Review SSL configuration quarterly
- Update certificates before expiration
- Check for security updates
- Monitor access logs

## Migration Guide

### From HTTP to HTTPS
1. Obtain SSL certificate (Let's Encrypt recommended)
2. Configure Grocy with HTTPS
3. Update Node-RED configuration:
   ```javascript
   // Before
   { apiUrl: "http://grocy.local:9283" }
   
   // After
   { apiUrl: "https://grocy.local:9283", allowSelfSigned: true }
   ```
4. Test thoroughly before removing HTTP access

### From Self-Signed to Proper Certificate
1. Obtain proper certificate
2. Install on Grocy server
3. Update Node-RED configuration:
   ```javascript
   // Before
   { apiUrl: "https://grocy.local", allowSelfSigned: true }
   
   // After
   { apiUrl: "https://grocy.local", allowSelfSigned: false }
   ```

## Compliance and Standards

This implementation follows community patterns from:
- **Home Assistant:** Flexible security for self-hosted
- **Nextcloud:** SSL options for private clouds
- **Docker/Kubernetes:** Certificate handling patterns
- **Node-RED:** Security best practices

## Support

For SSL/TLS configuration issues:
1. Check this documentation
2. Review error messages carefully
3. Verify network connectivity
4. Test with `curl` or `openssl` commands
5. Open an issue with configuration details (sanitized)

Remember: Security is a journey, not a destination. Start with the most secure configuration possible for your environment and improve over time.