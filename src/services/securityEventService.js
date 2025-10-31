const SecurityEvent = require('../models/SecurityEvent');

/**
 * Security Event Service for logging authentication and security events
 * Provides centralized logging for audit trails and security monitoring
 */
class SecurityEventService {
  /**
   * Log a security event
   * @param {Object} eventData - Event data
   * @param {string} eventData.user_id - User ID (optional for some events)
   * @param {string} eventData.event_type - Type of security event
   * @param {string} eventData.ip_address - Client IP address
   * @param {string} eventData.user_agent - Client user agent
   * @param {Object} eventData.metadata - Additional event metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logEvent({ user_id, event_type, ip_address, user_agent, metadata = {} }) {
    try {
      const securityEvent = new SecurityEvent({
        user_id,
        event_type,
        ip_address,
        user_agent,
        metadata
      });

      await securityEvent.save();
      return securityEvent;
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to prevent breaking the main flow
      return null;
    }
  }

  /**
   * Log successful login event
   * @param {string} user_id - User ID
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logLoginSuccess(user_id, ip_address, user_agent, metadata = {}) {
    return this.logEvent({
      user_id,
      event_type: 'login_success',
      ip_address,
      user_agent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log failed login attempt
   * @param {string} email - Email used in login attempt
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {string} reason - Reason for failure
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logLoginFailed(email, ip_address, user_agent, reason, metadata = {}) {
    return this.logEvent({
      event_type: 'login_failed',
      ip_address,
      user_agent,
      metadata: {
        email,
        reason,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log password reset request
   * @param {string} email - Email requesting password reset
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logPasswordResetRequested(email, ip_address, user_agent, metadata = {}) {
    return this.logEvent({
      event_type: 'password_reset_requested',
      ip_address,
      user_agent,
      metadata: {
        email,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log password reset completion
   * @param {string} user_id - User ID
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logPasswordResetCompleted(user_id, ip_address, user_agent, metadata = {}) {
    return this.logEvent({
      user_id,
      event_type: 'password_reset_completed',
      ip_address,
      user_agent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log email verification event
   * @param {string} user_id - User ID
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logEmailVerified(user_id, ip_address, user_agent, metadata = {}) {
    return this.logEvent({
      user_id,
      event_type: 'email_verified',
      ip_address,
      user_agent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log account locked event
   * @param {string} user_id - User ID
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {string} reason - Reason for account lock
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logAccountLocked(user_id, ip_address, user_agent, reason, metadata = {}) {
    return this.logEvent({
      user_id,
      event_type: 'account_locked',
      ip_address,
      user_agent,
      metadata: {
        reason,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log registration attempt
   * @param {string} email - Email used in registration
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {boolean} success - Whether registration was successful
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logRegistrationAttempt(email, ip_address, user_agent, success, metadata = {}) {
    return this.logEvent({
      event_type: 'registration_attempt',
      ip_address,
      user_agent,
      metadata: {
        email,
        success,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log email verification request
   * @param {string} user_id - User ID
   * @param {string} ip_address - Client IP address
   * @param {string} user_agent - Client user agent
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<SecurityEvent>} - Created security event
   */
  static async logEmailVerificationRequested(user_id, ip_address, user_agent, metadata = {}) {
    return this.logEvent({
      user_id,
      event_type: 'email_verification_requested',
      ip_address,
      user_agent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get security events for a user
   * @param {string} user_id - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of events to return
   * @param {number} options.skip - Number of events to skip
   * @param {string} options.event_type - Filter by event type
   * @param {Date} options.from_date - Filter events from this date
   * @param {Date} options.to_date - Filter events to this date
   * @returns {Promise<Array>} - Array of security events
   */
  static async getUserEvents(user_id, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        event_type,
        from_date,
        to_date
      } = options;

      const query = { user_id };

      if (event_type) {
        query.event_type = event_type;
      }

      if (from_date || to_date) {
        query.created_at = {};
        if (from_date) query.created_at.$gte = from_date;
        if (to_date) query.created_at.$lte = to_date;
      }

      return await SecurityEvent.find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      console.error('Failed to get user security events:', error);
      return [];
    }
  }

  /**
   * Get security events by IP address
   * @param {string} ip_address - IP address
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of events to return
   * @param {Date} options.from_date - Filter events from this date
   * @param {Date} options.to_date - Filter events to this date
   * @returns {Promise<Array>} - Array of security events
   */
  static async getEventsByIP(ip_address, options = {}) {
    try {
      const {
        limit = 50,
        from_date,
        to_date
      } = options;

      const query = { ip_address };

      if (from_date || to_date) {
        query.created_at = {};
        if (from_date) query.created_at.$gte = from_date;
        if (to_date) query.created_at.$lte = to_date;
      }

      return await SecurityEvent.find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Failed to get security events by IP:', error);
      return [];
    }
  }

  /**
   * Get failed login attempts for an IP in a time window
   * @param {string} ip_address - IP address
   * @param {number} minutes - Time window in minutes
   * @returns {Promise<number>} - Number of failed attempts
   */
  static async getFailedLoginAttempts(ip_address, minutes = 15) {
    try {
      const since = new Date();
      since.setMinutes(since.getMinutes() - minutes);

      const count = await SecurityEvent.countDocuments({
        ip_address,
        event_type: 'login_failed',
        created_at: { $gte: since }
      });

      return count;
    } catch (error) {
      console.error('Failed to get failed login attempts:', error);
      return 0;
    }
  }

  /**
   * Get registration attempts for an IP in a time window
   * @param {string} ip_address - IP address
   * @param {number} hours - Time window in hours
   * @returns {Promise<number>} - Number of registration attempts
   */
  static async getRegistrationAttempts(ip_address, hours = 1) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const count = await SecurityEvent.countDocuments({
        ip_address,
        event_type: 'registration_attempt',
        created_at: { $gte: since }
      });

      return count;
    } catch (error) {
      console.error('Failed to get registration attempts:', error);
      return 0;
    }
  }

  /**
   * Get password reset requests for an email in a time window
   * @param {string} email - Email address
   * @param {number} hours - Time window in hours
   * @returns {Promise<number>} - Number of password reset requests
   */
  static async getPasswordResetRequests(email, hours = 1) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const count = await SecurityEvent.countDocuments({
        event_type: 'password_reset_requested',
        'metadata.email': email,
        created_at: { $gte: since }
      });

      return count;
    } catch (error) {
      console.error('Failed to get password reset requests:', error);
      return 0;
    }
  }
}

module.exports = SecurityEventService;