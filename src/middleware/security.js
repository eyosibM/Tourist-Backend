const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Rate limiting configurations based on environment variables
const getRateLimitConfig = (type) => {
  const configs = {
    login: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) * 1000 || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5, // 5 attempts per window
      message: {
        error: 'Too many login attempts from this IP',
        code: 'AUTH_007',
        details: ['Please try again later'],
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 900) / 60) + ' minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
      keyGenerator: (req) => req.ip // Rate limit by IP
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts per hour
      message: {
        error: 'Too many registration attempts from this IP',
        code: 'AUTH_007',
        details: ['Please try again later'],
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts per hour per email
      message: {
        error: 'Too many password reset requests',
        code: 'AUTH_007',
        details: ['Please try again later'],
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by email for password reset
        return req.body.email || req.ip;
      }
    },
    emailVerification: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 attempts per hour per IP
      message: {
        error: 'Too many email verification requests',
        code: 'AUTH_007',
        details: ['Please try again later'],
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    }
  };

  return configs[type] || configs.login;
};

// Rate limiting middleware for different authentication endpoints
const rateLimitLogin = rateLimit(getRateLimitConfig('login'));
const rateLimitRegistration = rateLimit(getRateLimitConfig('registration'));
const rateLimitPasswordReset = rateLimit(getRateLimitConfig('passwordReset'));
const rateLimitEmailVerification = rateLimit(getRateLimitConfig('emailVerification'));

// Account security middleware to check if account is locked
const checkAccountLocked = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user && user.account_locked_until && user.account_locked_until > new Date()) {
      const lockTimeRemaining = Math.ceil((user.account_locked_until - new Date()) / (1000 * 60));
      
      return res.status(423).json({
        error: 'Account temporarily locked due to multiple failed login attempts',
        code: 'AUTH_003',
        details: [`Account will be unlocked in ${lockTimeRemaining} minutes`],
        lockedUntil: user.account_locked_until
      });
    }

    next();
  } catch (error) {
    console.error('Account lock check error:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

// Middleware to require email verification for protected routes
const requireEmailVerified = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_001'
      });
    }

    // Skip email verification check for Google OAuth users
    if (user.google_id) {
      return next();
    }

    // Check if email is verified for email/password users
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email verification required',
        code: 'AUTH_002',
        details: ['Please verify your email address before accessing this resource'],
        action: 'verify_email'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({
      error: 'Server error during email verification check',
      code: 'SERVER_ERROR'
    });
  }
};

// Security event logging middleware
const logSecurityEvent = (eventType) => {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Log security event after response
        setImmediate(async () => {
          try {
            const SecurityEvent = require('../models/SecurityEvent');
            
            const eventData = {
              event_type: eventType,
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent'),
              metadata: {
                endpoint: req.path,
                method: req.method,
                success: res.statusCode < 400,
                status_code: res.statusCode,
                timestamp: new Date()
              }
            };

            // Add user ID if available
            if (req.user && req.user._id) {
              eventData.user_id = req.user._id;
            }

            // Add email from request body for login/registration events
            if (req.body && req.body.email) {
              eventData.metadata.email = req.body.email;
            }

            // Add additional context based on event type
            if (eventType === 'login_failed' && data && data.error) {
              eventData.metadata.error_code = data.code;
              eventData.metadata.error_message = data.error;
            }

            await SecurityEvent.create(eventData);
          } catch (error) {
            console.error('Security event logging error:', error);
            // Don't fail the request if logging fails
          }
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Security logging middleware error:', error);
      next(); // Continue on error
    }
  };
};

// Middleware to handle failed login attempts and account locking
const handleFailedLogin = async (req, res, next) => {
  try {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Handle failed login after response
      if (res.statusCode === 401 && req.body.email) {
        setImmediate(async () => {
          try {
            const user = await User.findOne({ email: req.body.email.toLowerCase() });
            
            if (user) {
              user.login_attempts = (user.login_attempts || 0) + 1;
              
              // Lock account after 5 failed attempts
              if (user.login_attempts >= 5) {
                user.account_locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                console.log(`Account locked for user ${user.email} due to ${user.login_attempts} failed attempts`);
              }
              
              await user.save();
            }
          } catch (error) {
            console.error('Failed login handling error:', error);
          }
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Failed login middleware error:', error);
    next();
  }
};

// Middleware to reset login attempts on successful login
const resetLoginAttempts = async (req, res, next) => {
  try {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Reset login attempts on successful login
      if (res.statusCode === 200 && req.user) {
        setImmediate(async () => {
          try {
            await User.findByIdAndUpdate(req.user._id, {
              $unset: {
                login_attempts: 1,
                account_locked_until: 1
              },
              last_login: new Date()
            });
          } catch (error) {
            console.error('Reset login attempts error:', error);
          }
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Reset login attempts middleware error:', error);
    next();
  }
};

module.exports = {
  // Rate limiting middleware
  rateLimitLogin,
  rateLimitRegistration,
  rateLimitPasswordReset,
  rateLimitEmailVerification,
  
  // Account security middleware
  checkAccountLocked,
  requireEmailVerified,
  
  // Security event logging
  logSecurityEvent,
  
  // Login attempt handling
  handleFailedLogin,
  resetLoginAttempts
};