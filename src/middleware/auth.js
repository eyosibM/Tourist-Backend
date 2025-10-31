const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityEvent = require('../models/SecurityEvent');

// Helper function to log security events
const logSecurityEvent = async (req, userId, eventType, metadata = {}) => {
  try {
    const eventData = {
      event_type: eventType,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      metadata: {
        ...metadata,
        timestamp: new Date()
      }
    };

    if (userId) {
      eventData.user_id = userId;
    }

    await SecurityEvent.create(eventData);
  } catch (error) {
    console.error('Security event logging error:', error);
    // Don't fail the request if logging fails
  }
};

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Log security event for missing token
      await logSecurityEvent(req, null, 'authentication_failed', {
        reason: 'missing_token',
        endpoint: req.path
      });
      
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'AUTH_001'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('provider_id');
    
    if (!user || !user.is_active) {
      // Log security event for invalid token
      await logSecurityEvent(req, decoded.userId, 'authentication_failed', {
        reason: user ? 'inactive_user' : 'invalid_user',
        endpoint: req.path
      });
      
      return res.status(401).json({ 
        error: 'Invalid token or inactive user.',
        code: 'AUTH_001'
      });
    }

    // Check email verification for email/password users
    if (!user.google_id && !user.email_verified) {
      // Log security event for unverified email
      await logSecurityEvent(req, user._id, 'authentication_failed', {
        reason: 'email_not_verified',
        endpoint: req.path,
        email: user.email
      });
      
      return res.status(403).json({
        error: 'Email verification required',
        code: 'AUTH_002',
        details: ['Please verify your email address before accessing this resource'],
        action: 'verify_email'
      });
    }

    // Log successful authentication
    await logSecurityEvent(req, user._id, 'authentication_success', {
      endpoint: req.path,
      user_type: user.user_type
    });

    req.user = user;
    next();
  } catch (error) {
    // Log security event for token verification error
    await logSecurityEvent(req, null, 'authentication_failed', {
      reason: 'invalid_token',
      endpoint: req.path,
      error: error.message
    });
    
    res.status(401).json({ 
      error: 'Invalid token.',
      code: 'AUTH_001'
    });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      await logSecurityEvent(req, null, 'authorization_failed', {
        reason: 'user_not_authenticated',
        endpoint: req.path,
        required_roles: roles
      });
      
      return res.status(401).json({ 
        error: 'Access denied. User not authenticated.',
        code: 'AUTH_001'
      });
    }

    if (!roles.includes(req.user.user_type)) {
      await logSecurityEvent(req, req.user._id, 'authorization_failed', {
        reason: 'insufficient_permissions',
        endpoint: req.path,
        user_role: req.user.user_type,
        required_roles: roles
      });
      
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        code: 'AUTH_008',
        details: [`Required role: ${roles.join(' or ')}, Current role: ${req.user.user_type}`]
      });
    }

    next();
  };
};

// Middleware to check if user profile is complete
const requireCompleteProfile = async (req, res, next) => {
  const user = req.user;
  const isProfileComplete = !!(
    user.first_name && 
    user.last_name && 
    user.country && 
    user.date_of_birth && 
    user.gender && 
    user.phone_number
  );
  
  if (!isProfileComplete) {
    const missingFields = [];
    if (!user.first_name) missingFields.push('first_name');
    if (!user.last_name) missingFields.push('last_name');
    if (!user.country) missingFields.push('country');
    if (!user.date_of_birth) missingFields.push('date_of_birth');
    if (!user.gender) missingFields.push('gender');
    if (!user.phone_number) missingFields.push('phone_number');
    
    await logSecurityEvent(req, user._id, 'profile_access_denied', {
      reason: 'incomplete_profile',
      missing_fields: missingFields,
      endpoint: req.path
    });
    
    return res.status(400).json({ 
      error: 'Profile incomplete. Please complete all required profile fields.',
      code: 'PROFILE_001',
      details: [`Missing fields: ${missingFields.join(', ')}`],
      missing_fields: missingFields,
      redirect: '/profile'
    });
  }
  next();
};

// Middleware to check provider ownership
const checkProviderOwnership = async (req, res, next) => {
  try {
    if (req.user.user_type === 'system_admin') {
      return next(); // System admins can access everything
    }

    if (req.user.user_type === 'provider_admin') {
      // Check if the resource belongs to the user's provider
      const providerId = req.params.providerId || req.body.provider_id;
      if (providerId && providerId !== req.user.provider_id?.toString()) {
        await logSecurityEvent(req, req.user._id, 'provider_access_denied', {
          reason: 'different_provider',
          requested_provider: providerId,
          user_provider: req.user.provider_id?.toString(),
          endpoint: req.path
        });
        
        return res.status(403).json({ 
          error: 'Access denied. Resource belongs to different provider.',
          code: 'AUTH_009',
          details: ['You can only access resources belonging to your provider']
        });
      }
    }

    next();
  } catch (error) {
    await logSecurityEvent(req, req.user?._id, 'provider_check_error', {
      error: error.message,
      endpoint: req.path
    });
    
    res.status(500).json({ 
      error: 'Server error during authorization check.',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware to require email verification for email/password users
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
      await logSecurityEvent(req, user._id, 'email_verification_required', {
        endpoint: req.path,
        email: user.email
      });
      
      return res.status(403).json({
        error: 'Email verification required',
        code: 'AUTH_002',
        details: ['Please verify your email address before accessing this resource'],
        action: 'verify_email'
      });
    }

    next();
  } catch (error) {
    await logSecurityEvent(req, req.user?._id, 'email_verification_check_error', {
      error: error.message,
      endpoint: req.path
    });
    
    res.status(500).json({
      error: 'Server error during email verification check',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requireCompleteProfile,
  checkProviderOwnership,
  requireEmailVerified,
  logSecurityEvent
};