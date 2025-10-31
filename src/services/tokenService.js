const crypto = require('crypto');

/**
 * Token Service for handling email verification and password reset tokens
 * Provides cryptographically secure token generation and validation
 */
class TokenService {
  /**
   * Generate a cryptographically secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} - Hex encoded token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate email verification token with expiration
   * @returns {Object} - Token and expiration date
   */
  static generateEmailVerificationToken() {
    const token = this.generateSecureToken(32);
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiration
    
    return {
      token,
      expires
    };
  }

  /**
   * Generate password reset token with expiration
   * @returns {Object} - Token and expiration date
   */
  static generatePasswordResetToken() {
    const token = this.generateSecureToken(32);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration
    
    return {
      token,
      expires
    };
  }

  /**
   * Validate if a token is still valid (not expired)
   * @param {Date} expirationDate - Token expiration date
   * @returns {boolean} - True if token is still valid
   */
  static isTokenValid(expirationDate) {
    if (!expirationDate) {
      return false;
    }
    
    return new Date() < new Date(expirationDate);
  }

  /**
   * Validate email verification token
   * @param {string} providedToken - Token provided by user
   * @param {string} storedToken - Token stored in database
   * @param {Date} expirationDate - Token expiration date
   * @returns {boolean} - True if token is valid and not expired
   */
  static validateEmailVerificationToken(providedToken, storedToken, expirationDate) {
    if (!providedToken || !storedToken || !expirationDate) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    const providedBuffer = Buffer.from(providedToken, 'hex');
    const storedBuffer = Buffer.from(storedToken, 'hex');
    
    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    const tokensMatch = crypto.timingSafeEqual(providedBuffer, storedBuffer);
    const tokenNotExpired = this.isTokenValid(expirationDate);
    
    return tokensMatch && tokenNotExpired;
  }

  /**
   * Validate password reset token
   * @param {string} providedToken - Token provided by user
   * @param {string} storedToken - Token stored in database
   * @param {Date} expirationDate - Token expiration date
   * @returns {boolean} - True if token is valid and not expired
   */
  static validatePasswordResetToken(providedToken, storedToken, expirationDate) {
    if (!providedToken || !storedToken || !expirationDate) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    const providedBuffer = Buffer.from(providedToken, 'hex');
    const storedBuffer = Buffer.from(storedToken, 'hex');
    
    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    const tokensMatch = crypto.timingSafeEqual(providedBuffer, storedBuffer);
    const tokenNotExpired = this.isTokenValid(expirationDate);
    
    return tokensMatch && tokenNotExpired;
  }

  /**
   * Generate token expiration times for different token types
   * @param {string} tokenType - 'email_verification' or 'password_reset'
   * @returns {Date} - Expiration date
   */
  static getTokenExpiration(tokenType) {
    const now = new Date();
    
    switch (tokenType) {
      case 'email_verification':
        now.setHours(now.getHours() + 24);
        break;
      case 'password_reset':
        now.setHours(now.getHours() + 1);
        break;
      default:
        throw new Error(`Invalid token type: ${tokenType}`);
    }
    
    return now;
  }
}

module.exports = TokenService;