/**
 * Validation utility functions
 * Handles error collection and validator function creation
 */
class ValidationUtils {
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

module.exports = ValidationUtils;