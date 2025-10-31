const bcrypt = require('bcryptjs');

/**
 * Password Security Utilities
 * Provides password validation, hashing, and comparison functions
 */
class PasswordUtils {
  /**
   * Validate password strength according to security requirements
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid boolean and errors array
   */
  static validatePasswordStrength(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Minimum length requirement
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Maximum length for security (prevent DoS attacks)
    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long');
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Must contain at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Three or more consecutive identical characters
      /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is too weak');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Hash password securely using bcrypt with 12 salt rounds
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    if (!password) {
      throw new Error('Password is required for hashing');
    }

    try {
      const salt = await bcrypt.genSalt(12);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Compare plain text password with hashed password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} - True if passwords match
   */
  static async comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      // Log error but don't throw to prevent information leakage
      console.error('Password comparison error:', error.message);
      return false;
    }
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default: 12)
   * @returns {string} - Generated password
   */
  static generateSecurePassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password needs rehashing (if bcrypt cost has changed)
   * @param {string} hashedPassword - Current hashed password
   * @param {number} targetRounds - Target salt rounds (default: 12)
   * @returns {boolean} - True if password needs rehashing
   */
  static needsRehashing(hashedPassword, targetRounds = 12) {
    if (!hashedPassword) {
      return false;
    }

    try {
      const currentRounds = bcrypt.getRounds(hashedPassword);
      return currentRounds < targetRounds;
    } catch (error) {
      // If we can't determine rounds, assume it needs rehashing
      return true;
    }
  }

  /**
   * Validate password against common security rules
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @returns {Object} - Validation result
   */
  static validatePassword(password, options = {}) {
    const {
      minLength = 8,
      maxLength = 128,
      requireLowercase = true,
      requireUppercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      checkCommonPatterns = true
    } = options;

    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (checkCommonPatterns) {
      const commonPatterns = [
        /(.)\1{2,}/, // Three or more consecutive identical characters
        /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
      ];

      for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
          errors.push('Password contains common patterns and is too weak');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PasswordUtils;