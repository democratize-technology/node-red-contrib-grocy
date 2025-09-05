const ErrorHandler = require('../error-handler');

/**
 * Schema and structure validation utilities
 * Handles validation against schemas and field type specifications
 */
class SchemaValidators {
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
    
    // Import validators to avoid circular dependencies
    const TypeValidators = require('./type-validators');
    
    switch (type) {
      case 'string':
        TypeValidators.validateString(value, fieldName, { minLength: min, maxLength: max, pattern });
        break;
      case 'number':
        TypeValidators.validateNumber(value, fieldName, { min, max });
        break;
      case 'integer':
        TypeValidators.validateNumber(value, fieldName, { min, max, allowDecimals: false });
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw ErrorHandler.validationError(`${fieldName} must be a boolean`);
        }
        break;
      case 'date':
        TypeValidators.validateDate(value, fieldName);
        break;
      case 'array':
        TypeValidators.validateArray(value, fieldName, { minLength: min, maxLength: max });
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
}

module.exports = SchemaValidators;