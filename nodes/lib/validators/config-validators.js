const ErrorHandler = require('../error-handler');
const FormatValidators = require('./format-validators');
const ParameterValidators = require('./parameter-validators');
const SecurityValidators = require('./security-validators');

/**
 * Configuration and domain-specific validation utilities
 * Handles validation of configurations, file parameters, settings, and data objects
 */
class ConfigValidators {
  /**
   * Validate file parameters for file operations with comprehensive security checks
   * Prevents path traversal attacks and validates file groups
   * 
   * Security Features:
   * - Path traversal protection (blocks ../, absolute paths, etc.)
   * - File group validation (alphanumeric only)
   * - File extension validation (optional)
   * - Dangerous pattern blocking (.env, .git, etc.)
   * 
   * @param {Object} params - File operation parameters
   * @param {string} params.group - File group (alphanumeric, underscore, hyphen only)
   * @param {string} params.fileName - File name (must be safe relative path)
   * @param {Object} options - Additional validation options
   * @param {Array<string>} options.allowedExtensions - Restrict to specific file extensions
   * @throws {Error} If file parameters are invalid or contain security vulnerabilities
   */
  static validateFileParams(params, options = {}) {
    // First validate required parameters exist
    ParameterValidators.validateRequired(params, ['group', 'fileName']);
    
    // Validate and sanitize the file group
    const validatedGroup = SecurityValidators.validateFileGroup(params.group);
    
    // Validate the file name with comprehensive security checks
    const fileValidationOptions = {
      allowAbsolute: false,  // Never allow absolute paths for security
      allowRelative: true,   // Allow relative paths within current directory
      allowedExtensions: options.allowedExtensions || null,
      blockedPatterns: options.blockedPatterns || []
    };
    
    const validatedFileName = SecurityValidators.validateFilePath(
      params.fileName, 
      fileValidationOptions
    );
    
    // Return validated and normalized parameters
    return {
      group: validatedGroup,
      fileName: validatedFileName
    };
  }

  /**
   * Validate user setting key
   * @param {string} settingKey - The setting key to validate
   * @throws {Error} If setting key is invalid
   */
  static validateSettingKey(settingKey) {
    if (!settingKey || typeof settingKey !== 'string' || settingKey.trim().length === 0) {
      throw new Error('Setting key must be a non-empty string');
    }
  }

  /**
   * Validate data object for create/update operations
   * @param {Object} data - The data object to validate
   * @param {Object} schema - Optional schema for validation
   * @throws {Error} If data is invalid
   */
  static validateData(data, schema = null) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw ErrorHandler.validationError('Data must be an object');
    }

    // Check for empty object if schema requires fields
    const keys = Object.keys(data);
    if (keys.length === 0 && schema && schema.requireFields) {
      throw ErrorHandler.validationError('Data object cannot be empty');
    }

    // Basic schema validation if provided
    if (schema) {
      const SchemaValidators = require('./schema-validators');
      SchemaValidators.validateAgainstSchema(data, schema);
    }
  }

  /**
   * Validate options object with default values
   * @param {Object} options - The options object to validate
   * @param {Object} defaults - Default values for options
   * @returns {Object} Validated options with defaults applied
   */
  static validateOptions(options, defaults = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      return { ...defaults };
    }
    
    // Merge with defaults
    const validatedOptions = { ...defaults, ...options };
    
    // Remove undefined values
    Object.keys(validatedOptions).forEach(key => {
      if (validatedOptions[key] === undefined) {
        delete validatedOptions[key];
      }
    });
    
    return validatedOptions;
  }

  /**
   * Validate configuration object with flexible security options
   * 
   * Security Note: Supports both secure defaults and self-hosted patterns.
   * SSL verification can be disabled for trusted self-hosted instances.
   * 
   * @param {Object} config - The configuration to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.isDevelopment - Flag for development environment
   * @param {boolean} options.allowInsecure - Allow insecure connections (when SSL verification disabled)
   * @throws {Error} If configuration is invalid
   */
  static validateConfig(config, options = {}) {
    const { isDevelopment = false, allowInsecure = false } = options;
    
    if (!config || typeof config !== 'object') {
      throw ErrorHandler.configError('Configuration must be an object');
    }

    // Required configuration fields
    const requiredFields = ['apiUrl'];
    const missing = requiredFields.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw ErrorHandler.configError(`Missing required configuration: ${missing.join(', ')}`);
    }

    // URL validation based on SSL verification settings
    // If SSL verification is disabled (allowInsecure), be more permissive
    const urlOptions = {
      requireHttps: !isDevelopment && !allowInsecure,
      allowLocalhost: true,
      allowInsecureHttp: isDevelopment || allowInsecure
    };
    
    FormatValidators.validateUrl(config.apiUrl, urlOptions);
    
    // Log security posture based on configuration
    if (config.apiUrl) {
      const url = new URL(config.apiUrl);
      const isLocal = url.hostname === 'localhost' || 
                     url.hostname === '127.0.0.1' ||
                     url.hostname.startsWith('192.168.') ||
                     url.hostname.startsWith('10.') ||
                     url.hostname.startsWith('172.');
      
      if (url.protocol === 'http:' && !isLocal) {
        console.warn(
          '⚠️ Security Notice: HTTP connection to', url.hostname,
          'Consider using HTTPS for better security.'
        );
      } else if (url.protocol === 'https:' && config.verifySsl === false) {
        console.warn(
          '🔓 SSL verification disabled for', url.hostname,
          'Certificate validation bypassed - use only for trusted networks.'
        );
      }
    }

    // Validate credentials if present
    if (config.credentials) {
      if (!config.credentials.apiKey) {
        throw ErrorHandler.configError('API key is required in credentials');
      }
      
      if (typeof config.credentials.apiKey !== 'string' || config.credentials.apiKey.trim() === '') {
        throw ErrorHandler.configError('API key must be a non-empty string');
      }
    }
    
    // Validate SSL options if present
    if ('verifySsl' in config && typeof config.verifySsl !== 'boolean') {
      throw ErrorHandler.configError('verifySsl must be a boolean');
    }
    
    if ('allowSelfSigned' in config && typeof config.allowSelfSigned !== 'boolean') {
      throw ErrorHandler.configError('allowSelfSigned must be a boolean');
    }
    
    if ('timeout' in config && (typeof config.timeout !== 'number' || config.timeout < 1000 || config.timeout > 300000)) {
      throw ErrorHandler.configError('timeout must be a number between 1000 and 300000 milliseconds');
    }
  }
}

module.exports = ConfigValidators;