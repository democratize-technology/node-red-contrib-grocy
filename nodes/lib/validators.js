const ErrorHandler = require('./error-handler');

/**
 * Parameter validation utilities for Grocy operations
 * Provides comprehensive validation with detailed error messages
 * and support for multiple validation failures
 */
class Validators {
  /**
   * Validate required parameters with detailed error collection
   * @param {Object} payload - The payload to validate
   * @param {Array<string>} requiredParams - Array of required parameter names
   * @param {Object} options - Validation options
   * @throws {Error} If required parameters are missing
   */
  static validateRequired(payload, requiredParams, options = {}) {
    const { collectAllErrors = false, allowEmptyStrings = false } = options;
    
    if (!payload || typeof payload !== 'object') {
      throw ErrorHandler.validationError('Payload must be an object');
    }

    const missing = [];
    const invalid = [];

    for (const param of requiredParams) {
      const value = payload[param];
      
      if (value === undefined || value === null) {
        missing.push(param);
      } else if (!allowEmptyStrings && typeof value === 'string' && value.trim() === '') {
        invalid.push(`${param} cannot be empty`);
      }
    }

    const errors = [];
    if (missing.length > 0) {
      errors.push(`Missing required parameters: ${missing.join(', ')}`);
    }
    if (invalid.length > 0) {
      errors.push(...invalid);
    }

    if (errors.length > 0) {
      throw collectAllErrors ? 
        ErrorHandler.aggregateValidationErrors(errors) : 
        ErrorHandler.validationError(errors[0]);
    }
  }

  /**
   * Validate operation name with supported operations check
   * @param {string} operation - The operation name
   * @param {Array<string>} supportedOperations - Optional list of supported operations
   * @throws {Error} If operation is invalid
   */
  static validateOperation(operation, supportedOperations = null) {
    if (!operation || typeof operation !== 'string' || operation.trim() === '') {
      throw ErrorHandler.validationError('Operation must be a non-empty string');
    }

    const trimmedOperation = operation.trim();
    
    if (supportedOperations && !supportedOperations.includes(trimmedOperation)) {
      throw ErrorHandler.validationError(
        `Unsupported operation '${trimmedOperation}'. Supported operations: ${supportedOperations.join(', ')}`
      );
    }
  }

  /**
   * Validate entity type for generic operations
   * @param {string} entity - The entity type
   * @param {Array<string>} supportedEntities - Optional list of supported entities
   * @throws {Error} If entity is invalid
   */
  static validateEntity(entity, supportedEntities = null) {
    if (!entity || typeof entity !== 'string' || entity.trim() === '') {
      throw ErrorHandler.validationError('Entity type must be a non-empty string');
    }

    const trimmedEntity = entity.trim();
    
    if (supportedEntities && !supportedEntities.includes(trimmedEntity)) {
      throw ErrorHandler.validationError(
        `Unsupported entity '${trimmedEntity}'. Supported entities: ${supportedEntities.join(', ')}`
      );
    }
  }

  /**
   * Validate numeric ID with advanced checks
   * @param {*} id - The ID to validate
   * @param {string} paramName - Name of the parameter for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If ID is invalid
   */
  static validateId(id, paramName = 'id', options = {}) {
    const { allowZero = false, allowNegative = false, maxValue = null } = options;
    
    if (id === undefined || id === null) {
      throw ErrorHandler.validationError(`${paramName} is required`);
    }

    // Handle string IDs that should be numeric
    let numId;
    if (typeof id === 'string') {
      if (id.trim() === '') {
        throw ErrorHandler.validationError(`${paramName} cannot be empty`);
      }
      numId = Number(id.trim());
    } else {
      numId = Number(id);
    }

    if (isNaN(numId) || !isFinite(numId)) {
      throw ErrorHandler.validationError(`${paramName} must be a valid number`);
    }

    if (!allowZero && numId === 0) {
      throw ErrorHandler.validationError(`${paramName} must be greater than 0`);
    }

    if (!allowNegative && numId < 0) {
      throw ErrorHandler.validationError(`${paramName} must be a positive number`);
    }

    if (maxValue !== null && numId > maxValue) {
      throw ErrorHandler.validationError(`${paramName} must be less than or equal to ${maxValue}`);
    }

    // Check for integer values
    if (!Number.isInteger(numId)) {
      throw ErrorHandler.validationError(`${paramName} must be an integer`);
    }
  }

  /**
   * Validate barcode with format checks
   * @param {string} barcode - The barcode to validate
   * @param {Object} options - Validation options
   * @throws {Error} If barcode is invalid
   */
  static validateBarcode(barcode, options = {}) {
    const { minLength = 1, maxLength = 50, allowedChars = null } = options;
    
    if (!barcode || typeof barcode !== 'string') {
      throw ErrorHandler.validationError('Barcode must be a string');
    }

    const trimmedBarcode = barcode.trim();
    if (trimmedBarcode.length === 0) {
      throw ErrorHandler.validationError('Barcode cannot be empty');
    }

    if (trimmedBarcode.length < minLength) {
      throw ErrorHandler.validationError(`Barcode must be at least ${minLength} characters`);
    }

    if (trimmedBarcode.length > maxLength) {
      throw ErrorHandler.validationError(`Barcode cannot exceed ${maxLength} characters`);
    }

    // Basic format validation - no control characters
    if (/[\x00-\x1F\x7F-\x9F]/.test(trimmedBarcode)) {
      throw ErrorHandler.validationError('Barcode contains invalid characters');
    }

    if (allowedChars && !new RegExp(`^[${allowedChars}]+$`).test(trimmedBarcode)) {
      throw ErrorHandler.validationError(`Barcode can only contain characters: ${allowedChars}`);
    }
  }

  /**
   * Validate file parameters for file operations
   * @param {Object} params - File operation parameters
   * @param {string} params.group - File group
   * @param {string} params.fileName - File name
   * @throws {Error} If file parameters are invalid
   */
  static validateFileParams(params) {
    this.validateRequired(params, ['group', 'fileName']);
    
    if (typeof params.group !== 'string' || params.group.trim().length === 0) {
      throw new Error('File group must be a non-empty string');
    }
    
    if (typeof params.fileName !== 'string' || params.fileName.trim().length === 0) {
      throw new Error('File name must be a non-empty string');
    }
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
      this.validateAgainstSchema(data, schema);
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
   * Validate URL format with HTTPS enforcement by default
   * 
   * Security Note: HTTPS is mandatory by default to protect API keys and sensitive data.
   * For development/testing, use allowInsecureHttp option explicitly.
   * 
   * @param {string} url - The URL to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.requireHttps - Require HTTPS protocol (default: true)
   * @param {boolean} options.allowLocalhost - Allow localhost URLs (default: true for dev)
   * @param {boolean} options.allowInsecureHttp - Explicitly allow HTTP for development (default: false)
   * @throws {Error} If URL is invalid
   */
  static validateUrl(url, options = {}) {
    const { 
      requireHttps = true,  // SECURITY: HTTPS by default
      allowLocalhost = true, 
      allowInsecureHttp = false  // Must explicitly opt-in to HTTP
    } = options;
    
    if (!url || typeof url !== 'string') {
      throw ErrorHandler.validationError('URL must be a string');
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
      throw ErrorHandler.validationError('URL cannot be empty');
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch (e) {
      throw ErrorHandler.validationError(`Invalid URL format: ${trimmedUrl}`);
    }

    // Protocol validation
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw ErrorHandler.validationError('URL must use HTTP or HTTPS protocol');
    }

    // SECURITY: Check for development/localhost scenarios
    const isLocalDev = allowLocalhost && 
      (parsedUrl.hostname === 'localhost' || 
       parsedUrl.hostname === '127.0.0.1' ||
       parsedUrl.hostname.startsWith('192.168.') ||
       parsedUrl.hostname.startsWith('10.') ||
       parsedUrl.hostname.startsWith('172.'));

    // SECURITY: Enforce HTTPS by default for production
    if (parsedUrl.protocol === 'http:') {
      if (!allowInsecureHttp && !isLocalDev) {
        throw ErrorHandler.validationError(
          '⚠️ SECURITY WARNING: HTTPS is required for production use. ' +
          'HTTP connections expose your API key and data. ' +
          'For local development only, use allowInsecureHttp option explicitly.'
        );
      }
      
      if (requireHttps && !isLocalDev) {
        throw ErrorHandler.validationError(
          '🔒 HTTPS protocol required. HTTP is only allowed for localhost/development. ' +
          'Use HTTPS to protect your API credentials and data.'
        );
      }
      
      // Log security warning for HTTP usage
      if (!isLocalDev && allowInsecureHttp) {
        console.warn(
          '⚠️ SECURITY WARNING: Using HTTP connection to', parsedUrl.hostname,
          '- This exposes your API key and data. Switch to HTTPS for production use.'
        );
      }
    }

    // Hostname validation for non-localhost restrictions
    if (!allowLocalhost && isLocalDev) {
      throw ErrorHandler.validationError('Localhost/private network URLs are not allowed in this context');
    }
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @throws {Error} If email is invalid
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw ErrorHandler.validationError('Email must be a string');
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail === '') {
      throw ErrorHandler.validationError('Email cannot be empty');
    }

    // Basic email regex - not comprehensive but catches most issues
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw ErrorHandler.validationError('Invalid email format');
    }
  }

  /**
   * Validate date string or Date object
   * @param {string|Date} date - The date to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If date is invalid
   */
  static validateDate(date, paramName = 'date', options = {}) {
    const { allowPast = true, allowFuture = true, format = null } = options;
    
    if (date === undefined || date === null) {
      throw ErrorHandler.validationError(`${paramName} is required`);
    }

    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      if (date.trim() === '') {
        throw ErrorHandler.validationError(`${paramName} cannot be empty`);
      }
      
      // Try to parse the date string
      dateObj = new Date(date);
    } else {
      throw ErrorHandler.validationError(`${paramName} must be a Date object or date string`);
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      throw ErrorHandler.validationError(`${paramName} is not a valid date`);
    }

    // Check past/future constraints
    const now = new Date();
    if (!allowPast && dateObj < now) {
      throw ErrorHandler.validationError(`${paramName} cannot be in the past`);
    }
    if (!allowFuture && dateObj > now) {
      throw ErrorHandler.validationError(`${paramName} cannot be in the future`);
    }

    // Format validation if specified (basic ISO check)
    if (format === 'ISO' && typeof date === 'string') {
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (!isoRegex.test(date)) {
        throw ErrorHandler.validationError(`${paramName} must be in ISO format`);
      }
    }
  }

  /**
   * Validate array with element validation
   * @param {Array} array - The array to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If array is invalid
   */
  static validateArray(array, paramName = 'array', options = {}) {
    const { minLength = 0, maxLength = null, allowEmpty = true, elementValidator = null } = options;
    
    if (!Array.isArray(array)) {
      throw ErrorHandler.validationError(`${paramName} must be an array`);
    }

    if (!allowEmpty && array.length === 0) {
      throw ErrorHandler.validationError(`${paramName} cannot be empty`);
    }

    if (array.length < minLength) {
      throw ErrorHandler.validationError(`${paramName} must have at least ${minLength} elements`);
    }

    if (maxLength !== null && array.length > maxLength) {
      throw ErrorHandler.validationError(`${paramName} cannot have more than ${maxLength} elements`);
    }

    // Validate each element if validator provided
    if (elementValidator && typeof elementValidator === 'function') {
      const elementErrors = [];
      array.forEach((element, index) => {
        try {
          elementValidator(element, index);
        } catch (error) {
          elementErrors.push(`Element ${index}: ${error.message}`);
        }
      });
      
      if (elementErrors.length > 0) {
        // For array validation, always use the "Multiple" format even for single errors
        const error = new Error(`Multiple validation errors: ${elementErrors.join('; ')}`);
        error.type = 'validation';
        error.validationErrors = elementErrors;
        throw error;
      }
    }
  }

  /**
   * Validate string with advanced checks
   * @param {string} str - The string to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If string is invalid
   */
  static validateString(str, paramName = 'string', options = {}) {
    const { 
      minLength = 0, 
      maxLength = null, 
      allowEmpty = true, 
      pattern = null, 
      trim = true,
      allowUnicode = true 
    } = options;
    
    if (typeof str !== 'string') {
      throw ErrorHandler.validationError(`${paramName} must be a string`);
    }

    let processedStr = trim ? str.trim() : str;
    
    if (!allowEmpty && processedStr.length === 0) {
      throw ErrorHandler.validationError(`${paramName} cannot be empty`);
    }

    if (processedStr.length < minLength) {
      throw ErrorHandler.validationError(`${paramName} must be at least ${minLength} characters`);
    }

    if (maxLength !== null && processedStr.length > maxLength) {
      throw ErrorHandler.validationError(`${paramName} cannot exceed ${maxLength} characters`);
    }

    // Unicode validation
    if (!allowUnicode && /[^\x00-\x7F]/.test(processedStr)) {
      throw ErrorHandler.validationError(`${paramName} contains non-ASCII characters`);
    }

    // Pattern validation
    if (pattern) {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      if (!regex.test(processedStr)) {
        throw ErrorHandler.validationError(`${paramName} does not match required format`);
      }
    }
  }

  /**
   * Validate number with range checks
   * @param {number} num - The number to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If number is invalid
   */
  static validateNumber(num, paramName = 'number', options = {}) {
    const { min = null, max = null, allowDecimals = true, allowInfinity = false } = options;
    
    if (typeof num !== 'number') {
      throw ErrorHandler.validationError(`${paramName} must be a number`);
    }

    if (isNaN(num)) {
      throw ErrorHandler.validationError(`${paramName} cannot be NaN`);
    }

    if (!allowInfinity && !isFinite(num)) {
      throw ErrorHandler.validationError(`${paramName} cannot be infinite`);
    }

    if (!allowDecimals && !Number.isInteger(num)) {
      throw ErrorHandler.validationError(`${paramName} must be an integer`);
    }

    if (min !== null && num < min) {
      throw ErrorHandler.validationError(`${paramName} must be at least ${min}`);
    }

    if (max !== null && num > max) {
      throw ErrorHandler.validationError(`${paramName} must be at most ${max}`);
    }
  }

  /**
   * Validate against a simple schema
   * @param {Object} data - The data to validate
   * @param {Object} schema - The validation schema
   * @throws {Error} If validation fails
   */
  static validateAgainstSchema(data, schema) {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    // Check field types
    if (schema.fields) {
      for (const [fieldName, fieldSpec] of Object.entries(schema.fields)) {
        const value = data[fieldName];
        if (value !== undefined && value !== null) {
          try {
            this.validateFieldType(value, fieldSpec, fieldName);
          } catch (error) {
            errors.push(error.message);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw ErrorHandler.aggregateValidationErrors(errors);
    }
  }

  /**
   * Validate field against type specification
   * @param {*} value - The value to validate
   * @param {Object} fieldSpec - The field specification
   * @param {string} fieldName - The field name for errors
   * @throws {Error} If validation fails
   */
  static validateFieldType(value, fieldSpec, fieldName) {
    const { type, min, max, pattern, enum: enumValues } = fieldSpec;
    
    switch (type) {
      case 'string':
        this.validateString(value, fieldName, { minLength: min, maxLength: max, pattern });
        break;
      case 'number':
        this.validateNumber(value, fieldName, { min, max });
        break;
      case 'integer':
        this.validateNumber(value, fieldName, { min, max, allowDecimals: false });
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw ErrorHandler.validationError(`${fieldName} must be a boolean`);
        }
        break;
      case 'date':
        this.validateDate(value, fieldName);
        break;
      case 'array':
        this.validateArray(value, fieldName, { minLength: min, maxLength: max });
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw ErrorHandler.validationError(`${fieldName} must be an object`);
        }
        break;
      default:
        // Unknown type, skip validation
        break;
    }

    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
      throw ErrorHandler.validationError(`${fieldName} must be one of: ${enumValues.join(', ')}`);
    }
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
    
    this.validateUrl(config.apiUrl, urlOptions);
    
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

  /**
   * Collect multiple validation errors without throwing
   * @param {Array<Function>} validators - Array of validation functions
   * @returns {Array<string>} Array of error messages
   */
  static collectErrors(validators) {
    const errors = [];
    
    for (const validator of validators) {
      try {
        if (typeof validator === 'function') {
          validator();
        }
      } catch (error) {
        if (error.validationErrors) {
          errors.push(...error.validationErrors);
        } else {
          errors.push(error.message);
        }
      }
    }
    
    return errors;
  }

  /**
   * Create a validator function for reuse
   * @param {Function} validatorFn - The validator function
   * @param {Object} context - Context for the validator
   * @returns {Function} Bound validator function
   */
  static createValidator(validatorFn, context = {}) {
    return (data) => {
      return validatorFn.call(this, data, context);
    };
  }
}

module.exports = Validators;