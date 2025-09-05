# Security Implementation Guide

This guide provides step-by-step instructions for implementing the security fixes identified in the audit.

## Immediate Actions (P0) - Do These First

### 1. Fix Jest Version

✅ **COMPLETED** - Updated package.json to use stable Jest version (29.7.0)

Run to apply:
```bash
npm install
```

### 2. Enforce HTTPS in Production

Add this to `/nodes/lib/validators.js` in the `validateConfig` method:

```javascript
static validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw ErrorHandler.configError('Configuration must be an object');
  }

  // Required configuration fields
  const requiredFields = ['apiUrl'];
  const missing = requiredFields.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw ErrorHandler.configError(`Missing required configuration: ${missing.join(', ')}`);
  }

  // SECURITY FIX: Enforce HTTPS in production
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Allow HTTP only in development with explicit opt-in
  const allowInsecure = isDevelopment && process.env.ALLOW_HTTP === 'true';
  
  this.validateUrl(config.apiUrl, { 
    requireHttps: !allowInsecure,
    allowLocalhost: isDevelopment
  });

  // Validate credentials if present
  if (config.credentials) {
    if (!config.credentials.apiKey) {
      throw ErrorHandler.configError('API key is required in credentials');
    }
    
    if (typeof config.credentials.apiKey !== 'string' || config.credentials.apiKey.trim() === '') {
      throw ErrorHandler.configError('API key must be a non-empty string');
    }
    
    // SECURITY FIX: Enforce minimum API key length
    if (config.credentials.apiKey.length < 16) {
      throw ErrorHandler.configError('API key must be at least 16 characters for security');
    }
  }
}
```

### 3. Add Environment-based Security

Create `.env.example`:
```bash
# Security Configuration
NODE_ENV=production
ALLOW_HTTP=false
ENFORCE_HTTPS=true
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
SESSION_TIMEOUT=3600000
AUDIT_ENABLED=true
```

## Short-term Actions (P1) - Within 1 Week

### 1. Import Security Module

Add to each node file that handles requests:

```javascript
const { 
  SecureUrlValidator, 
  RateLimiter, 
  InputSanitizer,
  SecurityAuditLogger 
} = require('./security-fixes');

// Initialize at module level
const rateLimiter = new RateLimiter();
const auditLogger = new SecurityAuditLogger();
```

### 2. Add Rate Limiting

In `/nodes/lib/base-node.js`, update `handleInput`:

```javascript
async handleInput(msg, send, done) {
  // SECURITY: Rate limiting
  const clientId = msg._msgid || 'anonymous';
  try {
    rateLimiter.check(clientId);
  } catch (error) {
    if (error.statusCode === 429) {
      this.setStatus('red', 'ring', 'rate limited');
      ErrorHandler.handle(error, this.node, msg, done);
      return;
    }
  }

  // SECURITY: Audit logging
  auditLogger.log({
    type: 'api_request',
    action: this.getOperation(msg),
    clientId,
    metadata: {
      nodeId: this.node.id,
      nodeType: this.node.type
    }
  });

  // ... rest of existing code
}
```

### 3. Sanitize All Inputs

In `/nodes/lib/validators.js`, add input sanitization:

```javascript
static validateString(str, paramName = 'string', options = {}) {
  const { 
    minLength = 0, 
    maxLength = null, 
    allowEmpty = true, 
    pattern = null, 
    trim = true,
    allowUnicode = true,
    // SECURITY: Add sanitization option
    sanitize = true
  } = options;
  
  if (typeof str !== 'string') {
    throw ErrorHandler.validationError(`${paramName} must be a string`);
  }

  // SECURITY: Sanitize input
  if (sanitize) {
    const { InputSanitizer } = require('./security-fixes');
    str = InputSanitizer.sanitizeString(str, {
      preventXss: true,
      preventSql: true,
      maxLength: maxLength || 10000
    });
  }

  // ... rest of existing validation
}
```

### 4. Add SSRF Protection

Update URL validation in `/nodes/lib/validators.js`:

```javascript
static validateUrl(url, options = {}) {
  const { 
    requireHttps = false, 
    allowLocalhost = true,
    // SECURITY: Add SSRF protection
    blockPrivateIPs = true,
    blockMetadata = true
  } = options;
  
  // ... existing validation ...
  
  // SECURITY: SSRF Protection
  if (blockPrivateIPs && !allowLocalhost) {
    const { SecureUrlValidator } = require('./security-fixes');
    SecureUrlValidator.blockPrivateIPs(parsedUrl.hostname);
  }
  
  if (blockMetadata) {
    const { SecureUrlValidator } = require('./security-fixes');
    SecureUrlValidator.blockMetadataEndpoints(parsedUrl.hostname);
  }
}
```

## Long-term Actions (P2) - Within 1 Month

### 1. Add Security Tests

Create `/test/security/security.test.js`:

```javascript
const { 
  SecureUrlValidator,
  RateLimiter,
  InputSanitizer,
  ApiKeyManager
} = require('../../security-fixes');

describe('Security Tests', () => {
  describe('URL Validation', () => {
    test('should reject HTTP in production', () => {
      process.env.NODE_ENV = 'production';
      expect(() => {
        SecureUrlValidator.validate('http://example.com');
      }).toThrow('HTTPS is required');
    });

    test('should block private IPs', () => {
      expect(() => {
        SecureUrlValidator.validate('https://192.168.1.1', { allowLocalhost: false });
      }).toThrow('Private IP addresses');
    });

    test('should block metadata endpoints', () => {
      expect(() => {
        SecureUrlValidator.validate('https://169.254.169.254');
      }).toThrow('metadata endpoints');
    });
  });

  describe('Input Sanitization', () => {
    test('should remove XSS vectors', () => {
      const input = '<script>alert("xss")</script>Normal text';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('Normal text');
    });

    test('should prevent SQL injection', () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).not.toContain('DROP TABLE');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', () => {
      const limiter = new RateLimiter({ rateLimitMax: 2 });
      limiter.check('test-client');
      limiter.check('test-client');
      expect(() => limiter.check('test-client')).toThrow('Rate limit exceeded');
    });
  });
});
```

### 2. Add Security Documentation

Create `/docs/SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to security@democratize.technology

Do NOT create public issues for security vulnerabilities.

## Security Features

- HTTPS enforcement in production
- API key validation and rotation
- Rate limiting
- Input sanitization
- SSRF protection
- Security audit logging
- Automated security scanning

## Best Practices

1. Always use HTTPS for Grocy server URLs
2. Use strong API keys (minimum 32 characters)
3. Rotate API keys regularly
4. Monitor audit logs for suspicious activity
5. Keep dependencies updated
6. Run security scans before deployment
```

### 3. Add Pre-commit Hooks

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security audit
npm audit --audit-level=moderate

# Check for secrets
npx secretlint "**/*"

# Run tests
npm test
```

## Testing Security Fixes

### Manual Testing

1. Test HTTPS enforcement:
```bash
# Should fail in production
NODE_ENV=production node -e "require('./nodes/lib/validators').validateUrl('http://example.com')"

# Should work in development with flag
NODE_ENV=development ALLOW_HTTP=true node -e "require('./nodes/lib/validators').validateUrl('http://localhost')"
```

2. Test rate limiting:
```javascript
// In Node-RED flow, send rapid requests
// Should see "rate limited" status after threshold
```

3. Test input sanitization:
```javascript
// Try injecting XSS/SQL in Node-RED UI
// Should be sanitized in logs/output
```

### Automated Testing

Run security tests:
```bash
npm test -- --testPathPattern=security
```

Run GitHub Actions locally:
```bash
act -j security-audit
```

## Monitoring

### Audit Log Review

Check audit logs regularly:
```javascript
const { SecurityAuditLogger } = require('./security-fixes');
const logger = new SecurityAuditLogger();

// Query suspicious activity
const suspiciousEvents = logger.query({
  type: 'auth_failure',
  startTime: new Date(Date.now() - 86400000) // Last 24 hours
});
```

### Metrics to Monitor

- Failed authentication attempts
- Rate limit violations
- Invalid URL attempts
- Sanitization events
- API errors by type

## Rollback Plan

If security fixes cause issues:

1. **Immediate rollback:**
```bash
git revert HEAD
npm install
npm test
```

2. **Disable specific features:**
```javascript
// In security-fixes.js
const FEATURES = {
  RATE_LIMITING: false, // Disable temporarily
  HTTPS_ENFORCE: true,
  INPUT_SANITIZE: true
};
```

3. **Emergency bypass:**
```bash
# Allow HTTP temporarily
ALLOW_HTTP=true NODE_ENV=development npm start
```

## Compliance Checklist

Before deploying to production:

- [ ] Jest version updated to stable (29.7.0)
- [ ] HTTPS enforcement enabled
- [ ] Rate limiting configured
- [ ] Input sanitization active
- [ ] SSRF protection enabled
- [ ] Security headers implemented
- [ ] Audit logging enabled
- [ ] Security tests passing
- [ ] GitHub Actions security workflow active
- [ ] Security documentation complete
- [ ] Team trained on security practices

## Support

For security questions or concerns:
- Email: security@democratize.technology
- Documentation: /docs/SECURITY.md
- Issue tracker: Use "security" label (for non-sensitive issues only)

---
*Last updated: 2025-09-03*