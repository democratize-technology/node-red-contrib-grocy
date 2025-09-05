// Specialized validator modules
const ParameterValidators = require('./validators/parameter-validators');
const TypeValidators = require('./validators/type-validators');
const FormatValidators = require('./validators/format-validators');
const ConfigValidators = require('./validators/config-validators');
const SchemaValidators = require('./validators/schema-validators');
const ValidationUtils = require('./validators/validation-utils');

/**
 * Main validation facade class
 * Delegates to specialized validator modules while maintaining API compatibility
 * Provides comprehensive validation with detailed error messages
 * and support for multiple validation failures
 */
class Validators {
  // === Parameter Validation Methods ===
  
  /**
   * Validate required parameters with detailed error collection
   * @param {Object} payload - The payload to validate
   * @param {Array<string>} requiredParams - Array of required parameter names
   * @param {Object} options - Validation options
   * @throws {Error} If required parameters are missing
   */
  static validateRequired(payload, requiredParams, options = {}) {
    return ParameterValidators.validateRequired(payload, requiredParams, options);
  }

  /**
   * Validate operation name with supported operations check
   * @param {string} operation - The operation name
   * @param {Array<string>} supportedOperations - Optional list of supported operations
   * @throws {Error} If operation is invalid
   */
  static validateOperation(operation, supportedOperations = null) {
    return ParameterValidators.validateOperation(operation, supportedOperations);
  }

  /**
   * Validate entity type for generic operations
   * @param {string} entity - The entity type
   * @param {Array<string>} supportedEntities - Optional list of supported entities
   * @throws {Error} If entity is invalid
   */
  static validateEntity(entity, supportedEntities = null) {
    return ParameterValidators.validateEntity(entity, supportedEntities);
  }

  // === Type Validation Methods ===

  /**
   * Validate numeric ID with advanced checks
   * @param {*} id - The ID to validate
   * @param {string} paramName - Name of the parameter for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If ID is invalid
   */
  static validateId(id, paramName = 'id', options = {}) {
    return TypeValidators.validateId(id, paramName, options);
  }

  /**
   * Validate string with advanced checks
   * @param {string} str - The string to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If string is invalid
   */
  static validateString(str, paramName = 'string', options = {}) {
    return TypeValidators.validateString(str, paramName, options);
  }

  /**
   * Validate number with range checks
   * @param {number} num - The number to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If number is invalid
   */
  static validateNumber(num, paramName = 'number', options = {}) {
    return TypeValidators.validateNumber(num, paramName, options);
  }

  /**
   * Validate date string or Date object
   * @param {string|Date} date - The date to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If date is invalid
   */
  static validateDate(date, paramName = 'date', options = {}) {
    return TypeValidators.validateDate(date, paramName, options);
  }

  /**
   * Validate array with element validation
   * @param {Array} array - The array to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {Object} options - Validation options
   * @throws {Error} If array is invalid
   */
  static validateArray(array, paramName = 'array', options = {}) {
    return TypeValidators.validateArray(array, paramName, options);
  }

  // === Format Validation Methods ===

  /**
   * Validate barcode with format checks
   * @param {string} barcode - The barcode to validate
   * @param {Object} options - Validation options
   * @throws {Error} If barcode is invalid
   */
  static validateBarcode(barcode, options = {}) {
    return FormatValidators.validateBarcode(barcode, options);
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
    return FormatValidators.validateUrl(url, options);
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @throws {Error} If email is invalid
   */
  static validateEmail(email) {
    return FormatValidators.validateEmail(email);
  }

  // === Configuration Validation Methods ===

  /**
   * Validate file parameters for file operations
   * @param {Object} params - File operation parameters
   * @param {string} params.group - File group
   * @param {string} params.fileName - File name
   * @param {Object} options - Validation options
   * @param {Array<string>} options.allowedExtensions - Allowed file extensions
   * @throws {Error} If file parameters are invalid
   */
  static validateFileParams(params, options = {}) {
    return ConfigValidators.validateFileParams(params, options);
  }

  /**
   * Validate user setting key
   * @param {string} settingKey - The setting key to validate
   * @throws {Error} If setting key is invalid
   */
  static validateSettingKey(settingKey) {
    return ConfigValidators.validateSettingKey(settingKey);
  }

  /**
   * Validate data object for create/update operations
   * @param {Object} data - The data object to validate
   * @param {Object} schema - Optional schema for validation
   * @throws {Error} If data is invalid
   */
  static validateData(data, schema = null) {
    return ConfigValidators.validateData(data, schema);
  }

  /**
   * Validate options object with default values
   * @param {Object} options - The options object to validate
   * @param {Object} defaults - Default values for options
   * @returns {Object} Validated options with defaults applied
   */
  static validateOptions(options, defaults = {}) {
    return ConfigValidators.validateOptions(options, defaults);
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
    return ConfigValidators.validateConfig(config, options);
  }

  // === Schema Validation Methods ===

  /**
   * Validate against a simple schema
   * @param {Object} data - The data to validate
   * @param {Object} schema - The validation schema
   * @throws {Error} If validation fails
   */
  static validateAgainstSchema(data, schema) {
    return SchemaValidators.validateAgainstSchema(data, schema);
  }

  /**
   * Validate field against type specification
   * @param {*} value - The value to validate
   * @param {Object} fieldSpec - The field specification
   * @param {string} fieldName - The field name for errors
   * @throws {Error} If validation fails
   */
  static validateFieldType(value, fieldSpec, fieldName) {
    return SchemaValidators.validateFieldType(value, fieldSpec, fieldName);
  }

  // === Utility Methods ===

  /**
   * Collect multiple validation errors without throwing
   * @param {Array<Function>} validators - Array of validation functions
   * @returns {Array<string>} Array of error messages
   */
  static collectErrors(validators) {
    return ValidationUtils.collectErrors(validators);
  }

  /**
   * Create a validator function for reuse
   * @param {Function} validatorFn - The validator function
   * @param {Object} context - Context for the validator
   * @returns {Function} Bound validator function
   */
  static createValidator(validatorFn, context = {}) {
    return ValidationUtils.createValidator(validatorFn, context);
  }
}

module.exports = Validators;