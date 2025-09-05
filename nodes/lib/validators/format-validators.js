const ErrorHandler = require('../error-handler');

/**
 * Format validation utilities
 * Handles validation of barcodes, URLs, emails and other format-specific data
 */
class FormatValidators {
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
      allowInsecureHttp = false,  // Must explicitly opt-in to HTTP
      allowPrivateIP = true  // Allow private IP addresses by default
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
    const isLocalHostname = (parsedUrl.hostname === 'localhost' || 
       parsedUrl.hostname === '127.0.0.1' ||
       parsedUrl.hostname.startsWith('192.168.') ||
       parsedUrl.hostname.startsWith('10.') ||
       parsedUrl.hostname.startsWith('172.'));
    const isLocalDev = allowLocalhost && isLocalHostname;

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
    if (!allowLocalhost && isLocalHostname) {
      throw ErrorHandler.validationError('Localhost/private network URLs are not allowed in this context');
    }

    // Private IP address validation
    if (!allowPrivateIP && isLocalHostname) {
      throw ErrorHandler.validationError('Private IP addresses are not allowed');
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
   * Validate phone number format
   * @param {string} phone - The phone number to validate
   * @param {Object} options - Validation options
   * @throws {Error} If phone number is invalid
   */
  static validatePhoneNumber(phone, options = {}) {
    const { allowInternational = true, minLength = 10, maxLength = 15 } = options;
    
    if (!phone || typeof phone !== 'string') {
      throw ErrorHandler.validationError('Phone number must be a string');
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone === '') {
      throw ErrorHandler.validationError('Phone number cannot be empty');
    }

    // Remove common formatting characters
    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\+\.]/g, '');
    
    // Basic phone number validation
    if (!/^\d+$/.test(cleanPhone)) {
      throw ErrorHandler.validationError('Phone number can only contain digits and formatting characters');
    }

    if (cleanPhone.length < minLength) {
      throw ErrorHandler.validationError(`Phone number must be at least ${minLength} digits`);
    }

    if (cleanPhone.length > maxLength) {
      throw ErrorHandler.validationError(`Phone number cannot exceed ${maxLength} digits`);
    }

    // Check for international format if required
    if (allowInternational && trimmedPhone.startsWith('+')) {
      const internationalPhone = trimmedPhone.substring(1).replace(/[\s\-\(\)\.]/g, '');
      if (!/^\d+$/.test(internationalPhone) || internationalPhone.length < 7) {
        throw ErrorHandler.validationError('Invalid international phone number format');
      }
    }
  }
}

module.exports = FormatValidators;