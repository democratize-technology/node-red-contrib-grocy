const ErrorHandler = require('../error-handler');

/**
 * Data type validation utilities
 * Handles validation of IDs, strings, numbers, dates, and arrays
 */
class TypeValidators {
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
}

module.exports = TypeValidators;