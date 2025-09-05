const path = require('path');
const ErrorHandler = require('../error-handler');

/**
 * Security-focused validation utilities
 * Provides comprehensive protection against common security vulnerabilities
 * including path traversal, injection attacks, and unsafe patterns
 */
class SecurityValidators {
  /**
   * Validate file path for security vulnerabilities
   * Prevents path traversal attacks by blocking dangerous patterns
   * 
   * Security Features:
   * - Blocks directory traversal patterns (../, ..\)
   * - Blocks absolute paths on Unix and Windows
   * - Blocks UNC paths on Windows
   * - Blocks null bytes and control characters
   * - Normalizes paths to prevent bypass attempts
   * 
   * @param {string} filePath - The file path to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.allowAbsolute - Allow absolute paths (default: false)
   * @param {boolean} options.allowRelative - Allow relative paths within current dir (default: true)
   * @param {Array<string>} options.allowedExtensions - Allowed file extensions
   * @param {Array<string>} options.blockedPatterns - Additional patterns to block
   * @throws {Error} If path contains security vulnerabilities
   */
  static validateFilePath(filePath, options = {}) {
    const {
      allowAbsolute = false,
      allowRelative = true,
      allowedExtensions = null,
      blockedPatterns = []
    } = options;

    // Null and type check
    if (!filePath || typeof filePath !== 'string') {
      throw ErrorHandler.validationError('File path must be a non-empty string', {
        field: 'filePath',
        security: true
      });
    }

    // Check for null bytes (path truncation attack)
    if (filePath.includes('\0')) {
      throw ErrorHandler.securityError('File path contains null bytes', {
        field: 'filePath',
        pattern: 'null-byte'
      });
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f]/.test(filePath)) {
      throw ErrorHandler.securityError('File path contains control characters', {
        field: 'filePath',
        pattern: 'control-chars'
      });
    }

    // Normalize the path to resolve . and .. segments
    // This helps detect traversal attempts that use various encodings
    const normalizedPath = path.normalize(filePath);

    // Check for directory traversal patterns
    const traversalPatterns = [
      /\.\.[\/\\]/,           // ../ or ..\
      /[\/\\]\.\.[\/\\]/,     // /../ or \..\
      /[\/\\]\.\.$/,          // ends with /.. or \..
      /^\.\.[\/\\]/,          // starts with ../ or ..\
      /^\.\.$/                // exactly ..
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(filePath) || pattern.test(normalizedPath)) {
        throw ErrorHandler.securityError('Path traversal attempt detected', {
          field: 'filePath',
          pattern: 'directory-traversal',
          value: filePath
        });
      }
    }

    // Check for absolute paths (Unix and Windows)
    const isAbsolute = path.isAbsolute(filePath) || 
                      /^[a-zA-Z]:/.test(filePath) ||  // Windows drive letter
                      /^\\\\/.test(filePath) ||        // UNC path
                      /^\//.test(filePath);            // Unix absolute path

    if (isAbsolute && !allowAbsolute) {
      throw ErrorHandler.securityError('Absolute paths are not allowed', {
        field: 'filePath',
        pattern: 'absolute-path',
        value: filePath
      });
    }

    // Check for Windows UNC paths specifically
    if (/^\\\\/.test(filePath)) {
      throw ErrorHandler.securityError('UNC paths are not allowed', {
        field: 'filePath',
        pattern: 'unc-path',
        value: filePath
      });
    }

    // Check that after normalization, the path doesn't go outside current directory
    if (!allowAbsolute && normalizedPath.startsWith('..')) {
      throw ErrorHandler.securityError('Path goes outside the allowed directory', {
        field: 'filePath',
        pattern: 'outside-directory',
        value: filePath
      });
    }

    // Check for URL-encoded traversal attempts
    let decodedPath = filePath;
    try {
      decodedPath = decodeURIComponent(filePath);
    } catch (e) {
      // Invalid encoding, treat as suspicious
      throw ErrorHandler.securityError('Invalid URL encoding in file path', {
        field: 'filePath',
        pattern: 'invalid-encoding',
        value: filePath
      });
    }
    
    if (decodedPath !== filePath) {
      // Re-validate the decoded path
      if (/\.\.[\/\\]/.test(decodedPath) || path.normalize(decodedPath).startsWith('..')) {
        throw ErrorHandler.securityError('URL-encoded path traversal attempt detected', {
          field: 'filePath',
          pattern: 'encoded-traversal',
          value: filePath
        });
      }
      
      // Check for double-encoded attempts
      let doubleDecoded;
      try {
        doubleDecoded = decodeURIComponent(decodedPath);
      } catch (e) {
        // Invalid encoding in double-decode attempt, not necessarily suspicious
        doubleDecoded = null;
      }
      
      if (doubleDecoded && doubleDecoded !== decodedPath) {
        // Path was double-encoded, check if it contains traversal after double-decoding
        if (/\.\.[\/\\]/.test(doubleDecoded) || path.normalize(doubleDecoded).startsWith('..')) {
          throw ErrorHandler.securityError('Double-encoded path traversal attempt detected', {
            field: 'filePath',
            pattern: 'double-encoded-traversal',
            value: filePath
          });
        }
      }
    }

    // Check file extension if restrictions are specified
    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = path.extname(normalizedPath).toLowerCase();
      const normalizedExtensions = allowedExtensions.map(e => 
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
      );
      
      if (!normalizedExtensions.includes(ext)) {
        throw ErrorHandler.securityError('File extension not allowed', {
          field: 'filePath',
          allowed: normalizedExtensions.join(', '),
          actual: ext
        });
      }
    }

    // Check for additional blocked patterns
    const defaultBlockedPatterns = [
      /^\.ht/,              // .htaccess, .htpasswd
      /^web\.config$/i,     // IIS config
      /\.bak$/i,            // Backup files
      /\.swp$/i,            // Vim swap files
      /~$/,                 // Temporary files
      /\.env/i,             // Environment files
      /\.git/i,             // Git files
      /\.svn/i              // SVN files
    ];

    const allBlockedPatterns = [...defaultBlockedPatterns, ...blockedPatterns];
    const fileName = path.basename(normalizedPath);
    
    for (const pattern of allBlockedPatterns) {
      if (pattern.test(fileName) || pattern.test(normalizedPath)) {
        throw ErrorHandler.securityError('File name contains blocked pattern', {
          field: 'filePath',
          pattern: pattern.toString(),
          value: filePath
        });
      }
    }

    // Additional Windows-specific checks
    if (process.platform === 'win32') {
      // Check for alternate data streams
      if (filePath.includes(':') && !/^[a-zA-Z]:/.test(filePath)) {
        throw ErrorHandler.securityError('Alternate data streams are not allowed', {
          field: 'filePath',
          pattern: 'alternate-data-stream',
          value: filePath
        });
      }

      // Check for device names
      const deviceNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                          'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                          'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
      
      const upperFileName = fileName.toUpperCase();
      const baseNameWithoutExt = upperFileName.replace(/\.[^.]*$/, '');
      
      if (deviceNames.includes(baseNameWithoutExt)) {
        throw ErrorHandler.securityError('Windows device names are not allowed', {
          field: 'filePath',
          pattern: 'device-name',
          value: filePath
        });
      }
    }

    // Check path length limits
    if (normalizedPath.length > 255) {
      throw ErrorHandler.validationError('File path exceeds maximum length', {
        field: 'filePath',
        maxLength: 255,
        actualLength: normalizedPath.length
      });
    }

    // If all checks pass, return the normalized path
    return normalizedPath;
  }

  /**
   * Validate file group name for security
   * @param {string} group - The file group name
   * @throws {Error} If group name contains dangerous patterns
   */
  static validateFileGroup(group) {
    if (!group || typeof group !== 'string') {
      throw ErrorHandler.validationError('File group must be a non-empty string', {
        field: 'group',
        security: true
      });
    }

    // Remove whitespace
    const trimmedGroup = group.trim();
    if (trimmedGroup.length === 0) {
      throw ErrorHandler.validationError('File group cannot be empty', {
        field: 'group',
        security: true
      });
    }

    // Check for path traversal in group name
    if (/[\/\\]/.test(trimmedGroup)) {
      throw ErrorHandler.securityError('File group cannot contain path separators', {
        field: 'group',
        pattern: 'path-separator',
        value: group
      });
    }

    // Check for dots that could be used for traversal
    if (/^\.\.?$/.test(trimmedGroup) || trimmedGroup.includes('..')) {
      throw ErrorHandler.securityError('File group cannot contain traversal patterns', {
        field: 'group',
        pattern: 'dot-traversal',
        value: group
      });
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f]/.test(trimmedGroup)) {
      throw ErrorHandler.securityError('File group contains control characters', {
        field: 'group',
        pattern: 'control-chars'
      });
    }

    // Validate group name pattern (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedGroup)) {
      throw ErrorHandler.validationError('File group must contain only alphanumeric characters, underscores, and hyphens', {
        field: 'group',
        pattern: '^[a-zA-Z0-9_-]+$',
        value: group
      });
    }

    return trimmedGroup;
  }

  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - The input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input, options = {}) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const {
      allowHtml = false,
      maxLength = 1000
    } = options;

    let sanitized = input;

    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    if (!allowHtml) {
      // Remove HTML tags and encode special characters
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/&(?!(amp|lt|gt|quot|#x27|#x2F);)/g, '&amp;');
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove non-printable characters (except newline and tab)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Validate command input to prevent command injection
   * @param {string} command - The command to validate
   * @param {Array<string>} allowedCommands - List of allowed commands
   * @throws {Error} If command is potentially dangerous
   */
  static validateCommand(command, allowedCommands = []) {
    if (!command || typeof command !== 'string') {
      throw ErrorHandler.validationError('Command must be a non-empty string', {
        field: 'command',
        security: true
      });
    }

    // Check against allowed commands if specified
    if (allowedCommands.length > 0 && !allowedCommands.includes(command)) {
      throw ErrorHandler.securityError('Command not in allowed list', {
        field: 'command',
        allowed: allowedCommands,
        actual: command
      });
    }

    // Check for command injection patterns
    const dangerousPatterns = [
      /[;&|`$(){}[\]<>]/,     // Shell metacharacters
      /\n|\r/,                 // Newlines
      /\0/                     // Null bytes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw ErrorHandler.securityError('Command contains dangerous characters', {
          field: 'command',
          pattern: pattern.toString()
        });
      }
    }

    return command;
  }
}

module.exports = SecurityValidators;