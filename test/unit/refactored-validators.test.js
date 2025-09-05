/**
 * Comprehensive tests for refactored validator modules
 * Ensures each validator module works individually and the unified system maintains API compatibility
 */

// Import individual validator modules
const ParameterValidators = require('../../nodes/lib/validators/parameter-validators');
const TypeValidators = require('../../nodes/lib/validators/type-validators');
const FormatValidators = require('../../nodes/lib/validators/format-validators');
const ConfigValidators = require('../../nodes/lib/validators/config-validators');
const SchemaValidators = require('../../nodes/lib/validators/schema-validators');
const ValidationUtils = require('../../nodes/lib/validators/validation-utils');

// Import the unified validator interface
const Validators = require('../../nodes/lib/validators');

describe('Refactored Validator Modules', () => {

  describe('Module Structure and Exports', () => {
    test('should export all required validator modules', () => {
      expect(ParameterValidators).toBeDefined();
      expect(TypeValidators).toBeDefined();
      expect(FormatValidators).toBeDefined();
      expect(ConfigValidators).toBeDefined();
      expect(SchemaValidators).toBeDefined();
      expect(ValidationUtils).toBeDefined();
    });

    test('should maintain unified Validators API compatibility', () => {
      // Check that main Validators still has all public methods
      expect(typeof Validators.validateRequired).toBe('function');
      expect(typeof Validators.validateId).toBe('function');
      expect(typeof Validators.validateString).toBe('function');
      expect(typeof Validators.validateNumber).toBe('function');
      expect(typeof Validators.validateDate).toBe('function');
      expect(typeof Validators.validateArray).toBe('function');
      expect(typeof Validators.validateUrl).toBe('function');
      expect(typeof Validators.validateEmail).toBe('function');
      expect(typeof Validators.validateBarcode).toBe('function');
      expect(typeof Validators.validateConfig).toBe('function');
    });
  });

  describe('ParameterValidators Module', () => {
    test('should validate required parameters with detailed error collection', () => {
      const payload = { field1: 'value1', field2: 'value2' };
      
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field2']);
      }).not.toThrow();
    });

    test('should throw for missing required fields with detailed messages', () => {
      const payload = { field1: 'value1' };
      
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field2', 'field3']);
      }).toThrow('Missing required parameters: field2, field3');
    });

    test('should handle null/undefined values appropriately', () => {
      const payload = { 
        field1: 'value1', 
        field2: null, 
        field3: undefined, 
        field4: '',
        field5: 0,
        field6: false
      };
      
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field2', 'field3']);
      }).toThrow('Missing required parameters: field2, field3');

      // Test with allowEmptyStrings: true
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field4'], { allowEmptyStrings: true });
      }).not.toThrow();

      // Test with allowFalsy: true
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field5', 'field6'], { allowFalsy: true });
      }).not.toThrow();
    });

    test('should collect all errors when configured', () => {
      const payload = { field1: '' };
      
      expect(() => {
        ParameterValidators.validateRequired(payload, ['field1', 'field2', 'field3'], { 
          collectAllErrors: true,
          allowEmptyStrings: false 
        });
      }).toThrow('Multiple validation errors');
    });

    test('should validate operation names', () => {
      expect(() => {
        ParameterValidators.validateOperation('validOperation');
      }).not.toThrow();

      expect(() => {
        ParameterValidators.validateOperation(null);
      }).toThrow('operation is required');

      expect(() => {
        ParameterValidators.validateOperation('');
      }).toThrow('operation cannot be empty');

      // Test with supported operations list
      expect(() => {
        ParameterValidators.validateOperation('get', ['get', 'post', 'put']);
      }).not.toThrow();

      expect(() => {
        ParameterValidators.validateOperation('delete', ['get', 'post', 'put']);
      }).toThrow('Unsupported operation: delete');
    });

    test('should validate entity types', () => {
      expect(() => {
        ParameterValidators.validateEntity('product');
      }).not.toThrow();

      expect(() => {
        ParameterValidators.validateEntity(null);
      }).toThrow('entity is required');

      // Test with supported entities list
      expect(() => {
        ParameterValidators.validateEntity('product', ['product', 'stock', 'shopping_list']);
      }).not.toThrow();

      expect(() => {
        ParameterValidators.validateEntity('invalid', ['product', 'stock', 'shopping_list']);
      }).toThrow('Unsupported entity: invalid');
    });
  });

  describe('TypeValidators Module', () => {
    test('should validate IDs with comprehensive checks', () => {
      // Valid IDs
      expect(() => TypeValidators.validateId(1)).not.toThrow();
      expect(() => TypeValidators.validateId('123')).not.toThrow();
      expect(() => TypeValidators.validateId(42.0)).not.toThrow();

      // Invalid IDs
      expect(() => TypeValidators.validateId(-1)).toThrow('id must be a positive number');
      expect(() => TypeValidators.validateId(0)).toThrow('id must be greater than 0');
      expect(() => TypeValidators.validateId('abc')).toThrow('id must be a valid number');
      expect(() => TypeValidators.validateId(null)).toThrow('id is required');
      expect(() => TypeValidators.validateId(undefined)).toThrow('id is required');
      expect(() => TypeValidators.validateId(3.14)).toThrow('id must be a whole number');

      // Test options
      expect(() => TypeValidators.validateId(0, 'id', { allowZero: true })).not.toThrow();
      expect(() => TypeValidators.validateId(1000, 'id', { maxValue: 100 })).toThrow('id must be less than or equal to 100');
      expect(() => TypeValidators.validateId(-5, 'id', { allowNegative: true })).not.toThrow();
    });

    test('should validate strings with advanced options', () => {
      // Basic string validation
      expect(() => TypeValidators.validateString('hello', 'test')).not.toThrow();
      expect(() => TypeValidators.validateString(null, 'test')).toThrow('test is required');
      expect(() => TypeValidators.validateString(123, 'test')).toThrow('test must be a string');

      // Length constraints
      expect(() => {
        TypeValidators.validateString('hi', 'test', { minLength: 3 });
      }).toThrow('test must be at least 3 characters');

      expect(() => {
        TypeValidators.validateString('toolongstring', 'test', { maxLength: 5 });
      }).toThrow('test cannot exceed 5 characters');

      // Pattern matching
      expect(() => {
        TypeValidators.validateString('test123', 'test', { pattern: /^[a-z0-9]+$/ });
      }).not.toThrow();

      expect(() => {
        TypeValidators.validateString('Test123!', 'test', { pattern: /^[a-z0-9]+$/ });
      }).toThrow('test does not match required format');

      // Unicode handling
      expect(() => {
        TypeValidators.validateString('café', 'test', { allowUnicode: false });
      }).toThrow('test contains non-ASCII characters');

      expect(() => {
        TypeValidators.validateString('café', 'test', { allowUnicode: true });
      }).not.toThrow();

      // Empty string handling
      expect(() => {
        TypeValidators.validateString('', 'test', { allowEmpty: false });
      }).toThrow('test cannot be empty');

      expect(() => {
        TypeValidators.validateString('', 'test', { allowEmpty: true });
      }).not.toThrow();
    });

    test('should validate numbers with range checks', () => {
      // Basic number validation
      expect(() => TypeValidators.validateNumber(42, 'test')).not.toThrow();
      expect(() => TypeValidators.validateNumber('123', 'test')).not.toThrow(); // String numbers should be converted
      expect(() => TypeValidators.validateNumber(null, 'test')).toThrow('test is required');
      expect(() => TypeValidators.validateNumber('abc', 'test')).toThrow('test must be a valid number');

      // Range validation
      expect(() => {
        TypeValidators.validateNumber(5, 'test', { min: 10 });
      }).toThrow('test must be at least 10');

      expect(() => {
        TypeValidators.validateNumber(15, 'test', { max: 10 });
      }).toThrow('test must be at most 10');

      expect(() => {
        TypeValidators.validateNumber(7.5, 'test', { min: 5, max: 10 });
      }).not.toThrow();

      // Integer validation
      expect(() => {
        TypeValidators.validateNumber(3.14, 'test', { integer: true });
      }).toThrow('test must be a whole number');

      expect(() => {
        TypeValidators.validateNumber(42, 'test', { integer: true });
      }).not.toThrow();

      // Positive/negative validation
      expect(() => {
        TypeValidators.validateNumber(-5, 'test', { positive: true });
      }).toThrow('test must be positive');

      expect(() => {
        TypeValidators.validateNumber(5, 'test', { negative: true });
      }).toThrow('test must be negative');
    });

    test('should validate dates with comprehensive options', () => {
      const now = new Date();
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      // Basic date validation
      expect(() => TypeValidators.validateDate(now, 'test')).not.toThrow();
      expect(() => TypeValidators.validateDate('2024-12-25', 'test')).not.toThrow();
      expect(() => TypeValidators.validateDate('invalid-date', 'test')).toThrow('test is not a valid date');
      expect(() => TypeValidators.validateDate(null, 'test')).toThrow('test is required');

      // Past/future constraints
      expect(() => {
        TypeValidators.validateDate(pastDate, 'test', { allowPast: false });
      }).toThrow('test cannot be in the past');

      expect(() => {
        TypeValidators.validateDate(futureDate, 'test', { allowFuture: false });
      }).toThrow('test cannot be in the future');

      // Date range validation
      const minDate = new Date('2020-01-01');
      const maxDate = new Date('2025-12-31');
      
      expect(() => {
        TypeValidators.validateDate('2019-01-01', 'test', { minDate });
      }).toThrow('test must be after 2020-01-01');

      expect(() => {
        TypeValidators.validateDate('2026-01-01', 'test', { maxDate });
      }).toThrow('test must be before 2025-12-31');
    });

    test('should validate arrays with element validation', () => {
      // Basic array validation
      expect(() => TypeValidators.validateArray([1, 2, 3], 'test')).not.toThrow();
      expect(() => TypeValidators.validateArray(null, 'test')).toThrow('test is required');
      expect(() => TypeValidators.validateArray('not-array', 'test')).toThrow('test must be an array');

      // Length constraints
      expect(() => {
        TypeValidators.validateArray([1], 'test', { minLength: 2 });
      }).toThrow('test must have at least 2 elements');

      expect(() => {
        TypeValidators.validateArray([1, 2, 3], 'test', { maxLength: 2 });
      }).toThrow('test cannot have more than 2 elements');

      // Element validation
      const numberValidator = (element) => {
        if (typeof element !== 'number') {
          throw new Error('Element must be a number');
        }
      };

      expect(() => {
        TypeValidators.validateArray([1, 2, 3], 'test', { elementValidator: numberValidator });
      }).not.toThrow();

      expect(() => {
        TypeValidators.validateArray([1, 'two', 3], 'test', { elementValidator: numberValidator });
      }).toThrow('Multiple validation errors');

      // Unique elements
      expect(() => {
        TypeValidators.validateArray([1, 2, 2, 3], 'test', { unique: true });
      }).toThrow('test contains duplicate elements');

      expect(() => {
        TypeValidators.validateArray([1, 2, 3], 'test', { unique: true });
      }).not.toThrow();
    });
  });

  describe('FormatValidators Module', () => {
    test('should validate URLs with security considerations', () => {
      // Valid URLs
      expect(() => FormatValidators.validateUrl('https://example.com')).not.toThrow();
      expect(() => FormatValidators.validateUrl('http://localhost:3000')).not.toThrow();

      // Invalid URLs
      expect(() => FormatValidators.validateUrl('not-a-url')).toThrow('Invalid URL format');
      expect(() => FormatValidators.validateUrl('ftp://example.com')).toThrow('URL must use HTTP or HTTPS protocol');
      expect(() => FormatValidators.validateUrl(null)).toThrow('URL is required');

      // HTTPS requirement
      expect(() => {
        FormatValidators.validateUrl('http://example.com', { requireHttps: true });
      }).toThrow('HTTPS is required for production use');

      // Localhost restrictions
      expect(() => {
        FormatValidators.validateUrl('https://localhost:3000', { allowLocalhost: false });
      }).toThrow('Localhost/private network URLs are not allowed in this context');

      // IP address handling
      expect(() => {
        FormatValidators.validateUrl('https://192.168.1.1', { allowPrivateIP: false });
      }).toThrow('Private IP addresses are not allowed');

      // Port validation
      expect(() => {
        FormatValidators.validateUrl('https://example.com:99999');
      }).toThrow('Port number must be between 1 and 65535');
    });

    test('should validate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.org',
        'test@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        expect(() => FormatValidators.validateEmail(email)).not.toThrow();
      });

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@@example.com',
        'user@example',
        null,
        undefined,
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => FormatValidators.validateEmail(email)).toThrow();
      });
    });

    test('should validate barcodes with format checks', () => {
      // Valid barcodes
      expect(() => FormatValidators.validateBarcode('123456789012')).not.toThrow(); // UPC-A
      expect(() => FormatValidators.validateBarcode('1234567890123')).not.toThrow(); // EAN-13

      // Invalid barcodes
      expect(() => FormatValidators.validateBarcode(null)).toThrow('Barcode is required');
      expect(() => FormatValidators.validateBarcode('')).toThrow('Barcode cannot be empty');
      expect(() => FormatValidators.validateBarcode('123')).toThrow('Barcode must be at least 8 characters');

      // Format-specific validation
      expect(() => {
        FormatValidators.validateBarcode('12345', { format: 'EAN-13' });
      }).toThrow('EAN-13 barcode must be exactly 13 digits');

      expect(() => {
        FormatValidators.validateBarcode('1234567890abc', { format: 'EAN-13' });
      }).toThrow('Barcode must contain only digits');

      // Allow custom patterns
      expect(() => {
        FormatValidators.validateBarcode('ABC-123', { allowAlphanumeric: true });
      }).not.toThrow();
    });

    test('should validate phone numbers', () => {
      const validPhones = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '5551234567',
        '+44 20 7946 0958'
      ];

      validPhones.forEach(phone => {
        expect(() => FormatValidators.validatePhoneNumber(phone)).not.toThrow();
      });

      const invalidPhones = [
        '123',
        'abc-def-ghij',
        null,
        ''
      ];

      invalidPhones.forEach(phone => {
        expect(() => FormatValidators.validatePhoneNumber(phone)).toThrow();
      });
    });
  });

  describe('ConfigValidators Module', () => {
    test('should validate configuration objects', () => {
      const validConfig = {
        apiUrl: 'https://grocy.example.com',
        credentials: {
          apiKey: 'test-key-123'
        }
      };

      expect(() => ConfigValidators.validateConfig(validConfig)).not.toThrow();

      // Missing required fields
      expect(() => ConfigValidators.validateConfig({})).toThrow('Missing required configuration');
      
      expect(() => {
        ConfigValidators.validateConfig({
          apiUrl: 'https://grocy.example.com',
          credentials: {}
        });
      }).toThrow('API key is required in credentials');

      // Invalid URL format
      expect(() => {
        ConfigValidators.validateConfig({
          apiUrl: 'invalid-url',
          credentials: { apiKey: 'key' }
        });
      }).toThrow('Invalid URL format');
    });

    test('should validate file parameters', () => {
      const validFileParams = {
        group: 'receipts',
        fileName: 'receipt_001.pdf'
      };

      expect(() => ConfigValidators.validateFileParams(validFileParams)).not.toThrow();

      // Missing required fields
      expect(() => ConfigValidators.validateFileParams({})).toThrow();
      expect(() => {
        ConfigValidators.validateFileParams({ group: 'receipts' });
      }).toThrow();

      // Invalid file names
      expect(() => {
        ConfigValidators.validateFileParams({
          group: 'receipts',
          fileName: '../../../etc/passwd'
        });
      }).toThrow('Invalid file name');

      expect(() => {
        ConfigValidators.validateFileParams({
          group: 'receipts',
          fileName: 'file<script>alert(1)</script>.pdf'
        });
      }).toThrow('Invalid file name');
    });

    test('should validate setting keys', () => {
      expect(() => ConfigValidators.validateSettingKey('FEATURE_FLAG_SHOPPING_LIST')).not.toThrow();
      expect(() => ConfigValidators.validateSettingKey(null)).toThrow('Setting key is required');
      expect(() => ConfigValidators.validateSettingKey('')).toThrow('Setting key cannot be empty');
      expect(() => ConfigValidators.validateSettingKey('invalid key')).toThrow('Setting key must be alphanumeric');
    });

    test('should validate data objects', () => {
      const validData = {
        name: 'Test Product',
        description: 'A test product',
        price: 9.99
      };

      expect(() => ConfigValidators.validateData(validData)).not.toThrow();
      expect(() => ConfigValidators.validateData(null)).toThrow('Data is required');
      expect(() => ConfigValidators.validateData([])).toThrow('Data must be an object');

      // With schema validation
      const schema = {
        name: { type: 'string', required: true },
        price: { type: 'number', required: true, min: 0 }
      };

      expect(() => {
        ConfigValidators.validateData(validData, schema);
      }).not.toThrow();

      expect(() => {
        ConfigValidators.validateData({ name: 'Test', price: -5 }, schema);
      }).toThrow();
    });

    test('should validate options with defaults', () => {
      const defaults = {
        timeout: 30000,
        retries: 3,
        debug: false
      };

      const options1 = ConfigValidators.validateOptions({}, defaults);
      expect(options1).toEqual(defaults);

      const options2 = ConfigValidators.validateOptions({ timeout: 5000 }, defaults);
      expect(options2).toEqual({ timeout: 5000, retries: 3, debug: false });

      const options3 = ConfigValidators.validateOptions({ timeout: 5000, extra: 'value' }, defaults);
      expect(options3).toEqual({ timeout: 5000, retries: 3, debug: false, extra: 'value' });
    });
  });

  describe('SchemaValidators Module', () => {
    test('should validate against simple schemas', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true, min: 0, max: 120 },
        email: { type: 'email', required: false }
      };

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      expect(() => {
        SchemaValidators.validateAgainstSchema(validData, schema);
      }).not.toThrow();

      // Missing required field
      expect(() => {
        SchemaValidators.validateAgainstSchema({ age: 30 }, schema);
      }).toThrow('Missing required field: name');

      // Invalid type
      expect(() => {
        SchemaValidators.validateAgainstSchema({ name: 'John', age: 'thirty' }, schema);
      }).toThrow('Field age must be of type number');

      // Out of range
      expect(() => {
        SchemaValidators.validateAgainstSchema({ name: 'John', age: 150 }, schema);
      }).toThrow('Field age must be at most 120');
    });

    test('should validate field types', () => {
      // String field
      expect(() => {
        SchemaValidators.validateFieldType('hello', { type: 'string' }, 'name');
      }).not.toThrow();

      expect(() => {
        SchemaValidators.validateFieldType(123, { type: 'string' }, 'name');
      }).toThrow('Field name must be of type string');

      // Number field with constraints
      expect(() => {
        SchemaValidators.validateFieldType(25, { type: 'number', min: 0, max: 100 }, 'age');
      }).not.toThrow();

      expect(() => {
        SchemaValidators.validateFieldType(-5, { type: 'number', min: 0 }, 'age');
      }).toThrow('Field age must be at least 0');

      // Array field
      expect(() => {
        SchemaValidators.validateFieldType([1, 2, 3], { type: 'array', minLength: 1 }, 'items');
      }).not.toThrow();

      expect(() => {
        SchemaValidators.validateFieldType([], { type: 'array', minLength: 1 }, 'items');
      }).toThrow('Field items must have at least 1 elements');

      // Boolean field
      expect(() => {
        SchemaValidators.validateFieldType(true, { type: 'boolean' }, 'active');
      }).not.toThrow();

      expect(() => {
        SchemaValidators.validateFieldType('true', { type: 'boolean' }, 'active');
      }).toThrow('Field active must be of type boolean');
    });
  });

  describe('ValidationUtils Module', () => {
    test('should collect errors without throwing', () => {
      const validators = [
        () => { throw new Error('Error 1'); },
        () => { return 'success'; },
        () => { throw new Error('Error 2'); },
        () => { throw new Error('Error 3'); }
      ];

      const errors = ValidationUtils.collectErrors(validators);
      
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Error 1');
      expect(errors).toContain('Error 2');
      expect(errors).toContain('Error 3');
    });

    test('should create reusable validators', () => {
      const context = { minLength: 5 };
      const validatorFn = (value, ctx) => {
        if (typeof value !== 'string' || value.length < ctx.minLength) {
          throw new Error(`Value must be a string with at least ${ctx.minLength} characters`);
        }
      };

      const validator = ValidationUtils.createValidator(validatorFn, context);

      expect(() => validator('hello world')).not.toThrow();
      expect(() => validator('hi')).toThrow('Value must be a string with at least 5 characters');
    });

    test('should handle validator creation edge cases', () => {
      expect(() => {
        ValidationUtils.createValidator(null);
      }).toThrow('Validator function is required');

      const validator = ValidationUtils.createValidator(() => {}, {});
      expect(typeof validator).toBe('function');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with existing validation calls', () => {
      // Test that unified interface methods delegate correctly to specialized modules
      const payload = { field1: 'value1', field2: 'value2' };
      
      expect(() => {
        Validators.validateRequired(payload, ['field1', 'field2']);
      }).not.toThrow();

      expect(() => {
        Validators.validateId(123);
      }).not.toThrow();

      expect(() => {
        Validators.validateString('test string');
      }).not.toThrow();

      expect(() => {
        Validators.validateUrl('https://example.com');
      }).not.toThrow();
    });

    test('should maintain same error message format', () => {
      // Test that error messages are consistent between unified and modular interfaces
      try {
        Validators.validateRequired({}, ['field1']);
      } catch (unifiedError) {
        try {
          ParameterValidators.validateRequired({}, ['field1']);
        } catch (modularError) {
          expect(unifiedError.message).toBe(modularError.message);
        }
      }

      try {
        Validators.validateId(-1);
      } catch (unifiedError) {
        try {
          TypeValidators.validateId(-1);
        } catch (modularError) {
          expect(unifiedError.message).toBe(modularError.message);
        }
      }
    });

    test('should maintain configuration validation behavior', () => {
      const config = {
        apiUrl: 'https://grocy.example.com',
        credentials: { apiKey: 'test-key' }
      };

      // Both should work the same way
      expect(() => Validators.validateConfig(config)).not.toThrow();
      expect(() => ConfigValidators.validateConfig(config)).not.toThrow();

      // Both should fail the same way
      expect(() => Validators.validateConfig({})).toThrow();
      expect(() => ConfigValidators.validateConfig({})).toThrow();
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(() => ValidationUtils.collectErrors(null)).not.toThrow();
      expect(() => ValidationUtils.collectErrors(undefined)).not.toThrow();
      expect(() => ValidationUtils.collectErrors([])).not.toThrow();

      const errors = ValidationUtils.collectErrors([]);
      expect(errors).toEqual([]);
    });

    test('should handle complex nested validation scenarios', () => {
      const complexData = {
        user: {
          profile: {
            name: 'John',
            contacts: [
              { type: 'email', value: 'john@example.com' },
              { type: 'phone', value: '+1-555-1234' }
            ]
          }
        },
        settings: {
          notifications: true,
          theme: 'dark'
        }
      };

      // Should handle deep object validation without throwing
      expect(() => {
        ConfigValidators.validateData(complexData);
      }).not.toThrow();
    });

    test('should handle circular references in objects', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      // Should not crash on circular references
      expect(() => {
        ConfigValidators.validateData(circular);
      }).not.toThrow();
    });

    test('should handle very large arrays efficiently', () => {
      const largeArray = new Array(10000).fill().map((_, i) => i);

      expect(() => {
        TypeValidators.validateArray(largeArray, 'large', { maxLength: 20000 });
      }).not.toThrow();

      expect(() => {
        TypeValidators.validateArray(largeArray, 'large', { maxLength: 5000 });
      }).toThrow();
    });

    test('should handle unicode and special characters in validation', () => {
      const unicodeString = '你好世界 🌍 café naïve résumé';
      
      expect(() => {
        TypeValidators.validateString(unicodeString, 'unicode', { allowUnicode: true });
      }).not.toThrow();

      expect(() => {
        TypeValidators.validateString(unicodeString, 'unicode', { allowUnicode: false });
      }).toThrow();
    });
  });
});