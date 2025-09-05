const ErrorHandler = require('../error-handler');

/**
 * Parameter Validation Utilities
 * @module ParameterValidators
 * @description Comprehensive validation module for parameter checking
 * 
 * Provides robust methods to validate:
 * - Required parameters
 * - Operation names
 * - Entity types
 * 
 * Designed to support flexible validation with configurable options
 * 
 * @example
 * // Validate required parameters in a payload
 * ParameterValidators.validateRequired(payload, ['name', 'id'], {
 *   collectAllErrors: true,
 *   allowEmptyStrings: false
 * });
 * 
 * // Validate operation
 * ParameterValidators.validateOperation('create', ['create', 'update', 'delete']);
 * 
 * @see {@link module:ErrorHandler|ErrorHandler} for error handling mechanisms
 */
class ParameterValidators {
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
}

module.exports = ParameterValidators;