/**
 * Security Fixes Implementation
 * 
 * This file contains security enhancements that should be integrated
 * into the node-red-contrib-grocy package to address vulnerabilities
 * identified in the security audit.
 * 
 * @see SECURITY_AUDIT_REPORT.md for full details
 */

const crypto = require('crypto');

/**
 * Security configuration with secure defaults
 */
class SecurityConfig {
  static get defaults() {
    return {
      // Transport security
      requireHttps: process.env.NODE_ENV === 'production',
      allowLocalhost: process.env.NODE_ENV !== 'production',
      
      // Rate limiting
      rateLimitWindow: 60000, // 1 minute
      rateLimitMax: 100, // requests per window
      
      // Session security
      sessionTimeout: 3600000, // 1 hour
      maxSessions: 10,
      
      // Input validation
      maxPayloadSize: 1048576, // 1MB
      maxStringLength: 10000,
      
      // API security
      apiKeyMinLength: 32,
      apiKeyRotationDays: 90,
      
      // Audit settings
      auditEnabled: true,
      auditLevel: 'info'
    };
  }
}

/**
 * Enhanced URL validator with SSRF protection
 */
class SecureUrlValidator {
  static validate(url, options = {}) {
    const config = { ...SecurityConfig.defaults, ...options };
    
    // Parse URL
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    // Enforce HTTPS in production
    if (config.requireHttps && parsed.protocol !== 'https:') {
      throw new Error('HTTPS is required for API URLs in production');
    }
    
    // Block private IP ranges (SSRF protection)
    if (!config.allowLocalhost) {
      this.blockPrivateIPs(parsed.hostname);
      this.blockMetadataEndpoints(parsed.hostname);
    }
    
    // Block suspicious ports
    this.validatePort(parsed.port);
    
    return true;
  }
  
  static blockPrivateIPs(hostname) {
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/i,
      /^fc00:/i,
      /^fd00:/i,
      /^localhost$/i
    ];
    
    if (privateRanges.some(range => range.test(hostname))) {
      throw new Error('Private IP addresses and localhost are not allowed');
    }
  }
  
  static blockMetadataEndpoints(hostname) {
    const blockedHosts = [
      '169.254.169.254', // AWS metadata
      'metadata.google.internal', // GCP metadata  
      'metadata.azure.com', // Azure metadata
      'metadata', // Generic metadata
      'meta-data' // Alternative metadata
    ];
    
    if (blockedHosts.includes(hostname.toLowerCase())) {
      throw new Error('Cloud metadata endpoints are not allowed');
    }
  }
  
  static validatePort(port) {
    const blockedPorts = [22, 23, 135, 139, 445, 3389]; // SSH, Telnet, SMB, RDP
    
    if (port && blockedPorts.includes(parseInt(port))) {
      throw new Error(`Port ${port} is not allowed`);
    }
  }
}

/**
 * Rate limiter implementation
 */
class RateLimiter {
  constructor(options = {}) {
    this.config = { ...SecurityConfig.defaults, ...options };
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  
  check(clientId) {
    const now = Date.now();
    const window = this.config.rateLimitWindow;
    const max = this.config.rateLimitMax;
    
    let client = this.requests.get(clientId);
    
    if (!client || now > client.resetAt) {
      client = {
        count: 0,
        resetAt: now + window,
        firstRequest: now
      };
    }
    
    if (client.count >= max) {
      const retryAfter = Math.ceil((client.resetAt - now) / 1000);
      const error = new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      error.statusCode = 429;
      error.retryAfter = retryAfter;
      throw error;
    }
    
    client.count++;
    this.requests.set(clientId, client);
    
    return {
      remaining: max - client.count,
      resetAt: client.resetAt
    };
  }
  
  cleanup() {
    const now = Date.now();
    for (const [clientId, client] of this.requests.entries()) {
      if (now > client.resetAt + 60000) {
        this.requests.delete(clientId);
      }
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Security headers middleware
 */
class SecurityHeaders {
  static apply(res, options = {}) {
    const config = { ...SecurityConfig.defaults, ...options };
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Force HTTPS
    if (config.requireHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Node-RED requires inline scripts
      "style-src 'self' 'unsafe-inline'",  // Node-RED requires inline styles
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return res;
  }
}

/**
 * API key manager with rotation support
 */
class ApiKeyManager {
  constructor() {
    this.keys = new Map();
    this.rotationHistory = [];
  }
  
  generateKey(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  rotateKey(clientId, gracePeriod = 300000) {
    const oldKey = this.keys.get(clientId);
    const newKey = this.generateKey();
    
    const rotation = {
      clientId,
      oldKey: oldKey ? this.hashKey(oldKey.key) : null,
      newKey: this.hashKey(newKey),
      rotatedAt: Date.now(),
      gracePeriodEnds: Date.now() + gracePeriod
    };
    
    this.keys.set(clientId, {
      key: newKey,
      createdAt: Date.now(),
      previousKey: oldKey ? oldKey.key : null,
      previousKeyValidUntil: Date.now() + gracePeriod
    });
    
    this.rotationHistory.push(rotation);
    
    // Schedule cleanup of old key
    setTimeout(() => {
      const current = this.keys.get(clientId);
      if (current && current.previousKey) {
        current.previousKey = null;
        current.previousKeyValidUntil = null;
      }
    }, gracePeriod);
    
    return newKey;
  }
  
  validateKey(clientId, key) {
    const stored = this.keys.get(clientId);
    
    if (!stored) {
      return false;
    }
    
    // Check current key
    if (this.compareKeys(key, stored.key)) {
      return true;
    }
    
    // Check previous key during grace period
    if (stored.previousKey && 
        stored.previousKeyValidUntil > Date.now() &&
        this.compareKeys(key, stored.previousKey)) {
      return true;
    }
    
    return false;
  }
  
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  compareKeys(key1, key2) {
    const buf1 = Buffer.from(key1);
    const buf2 = Buffer.from(key2);
    
    if (buf1.length !== buf2.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(buf1, buf2);
  }
}

/**
 * Input sanitizer with XSS protection
 */
class InputSanitizer {
  static sanitizeString(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }
    
    let sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove control characters except tab, newline, carriage return
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Prevent XSS
    if (options.preventXss !== false) {
      // Remove script tags
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove event handlers
      sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
      
      // Remove javascript: protocol
      sanitized = sanitized.replace(/javascript:/gi, '');
      
      // Escape HTML entities
      if (options.escapeHtml) {
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    }
    
    // Prevent SQL injection
    if (options.preventSql !== false) {
      // Remove SQL keywords in suspicious contexts
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|AND|OR)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /([';])/g
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitized)) {
          // Log potential SQL injection attempt
          console.warn('Potential SQL injection attempt detected');
          sanitized = sanitized.replace(pattern, '');
        }
      }
    }
    
    // Limit length
    const maxLength = options.maxLength || SecurityConfig.defaults.maxStringLength;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized.trim();
  }
  
  static sanitizeObject(obj, options = {}) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key, { preventXss: true, preventSql: true });
      
      // Sanitize value recursively
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value, options);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value, options);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * Security audit logger
 */
class SecurityAuditLogger {
  constructor(options = {}) {
    this.config = { ...SecurityConfig.defaults, ...options };
    this.logs = [];
    this.maxLogs = 10000;
  }
  
  log(event) {
    if (!this.config.auditEnabled) {
      return;
    }
    
    const entry = {
      timestamp: new Date().toISOString(),
      level: event.level || 'info',
      type: event.type,
      action: event.action,
      user: event.user || 'system',
      clientId: event.clientId,
      ip: event.ip,
      userAgent: event.userAgent,
      result: event.result,
      error: event.error,
      metadata: this.sanitizeMetadata(event.metadata)
    };
    
    // Add to memory buffer
    this.logs.push(entry);
    
    // Rotate logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Write to persistent storage (implement based on your needs)
    this.writeToPersistentStorage(entry);
    
    return entry;
  }
  
  sanitizeMetadata(metadata) {
    if (!metadata) return {};
    
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'credential'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  writeToPersistentStorage(entry) {
    // TODO: Implement persistent storage
    // Options: File system, database, cloud logging service
    if (process.env.NODE_ENV === 'production') {
      // console.log('Audit:', JSON.stringify(entry));
    }
  }
  
  query(filters = {}) {
    let results = [...this.logs];
    
    if (filters.startTime) {
      results = results.filter(log => new Date(log.timestamp) >= new Date(filters.startTime));
    }
    
    if (filters.endTime) {
      results = results.filter(log => new Date(log.timestamp) <= new Date(filters.endTime));
    }
    
    if (filters.type) {
      results = results.filter(log => log.type === filters.type);
    }
    
    if (filters.user) {
      results = results.filter(log => log.user === filters.user);
    }
    
    if (filters.level) {
      results = results.filter(log => log.level === filters.level);
    }
    
    return results;
  }
}

/**
 * Request signature verification
 */
class RequestSigner {
  static sign(payload, secret) {
    const timestamp = Date.now();
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    
    return {
      signature,
      timestamp
    };
  }
  
  static verify(payload, signature, timestamp, secret, maxAge = 300000) {
    // Check timestamp age
    const now = Date.now();
    const age = now - parseInt(timestamp);
    
    if (age > maxAge) {
      throw new Error('Request signature expired');
    }
    
    // Recreate and verify signature
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    
    // Use timing-safe comparison
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
    
    if (!valid) {
      throw new Error('Invalid request signature');
    }
    
    return true;
  }
}

/**
 * Session manager with security features
 */
class SecureSessionManager {
  constructor(options = {}) {
    this.config = { ...SecurityConfig.defaults, ...options };
    this.sessions = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  
  createSession(userId, metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    
    // Check max sessions per user
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId);
    
    if (userSessions.length >= this.config.maxSessions) {
      // Remove oldest session
      const oldest = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      this.sessions.delete(oldest.id);
    }
    
    const session = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.sessionTimeout,
      metadata
    };
    
    this.sessions.set(sessionId, session);
    
    return sessionId;
  }
  
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    const now = Date.now();
    
    if (now > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    // Update activity
    session.lastActivity = now;
    session.expiresAt = now + this.config.sessionTimeout;
    
    return session;
  }
  
  revokeSession(sessionId) {
    return this.sessions.delete(sessionId);
  }
  
  cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

module.exports = {
  SecurityConfig,
  SecureUrlValidator,
  RateLimiter,
  SecurityHeaders,
  ApiKeyManager,
  InputSanitizer,
  SecurityAuditLogger,
  RequestSigner,
  SecureSessionManager
};