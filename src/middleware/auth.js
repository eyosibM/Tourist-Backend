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
    console.log('🔍 AUTHENTICATE DEBUG - Starting authentication check:', {
      endpoint: req.path,
      method: req.method,
      hasAuthHeader: !!req.header('Authorization'),
      authHeaderStart: req.header('Authorization')?.substring(0, 20) + '...'
    });

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ AUTHENTICATE DEBUG - No token provided');
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
    console.log('🔍 AUTHENTICATE DEBUG - Token decoded:', {
      userId: decoded.userId,
      tokenExp: new Date(decoded.exp * 1000),
      currentTime: new Date()
    });

    const user = await User.findById(decoded.userId).populate('provider_id');
    
    if (!user || !user.is_active) {
      console.log('❌ AUTHENTICATE DEBUG - User not found or inactive:', {
        userId: decoded.userId,
        userExists: !!user,
        isActive: user?.is_active
      });
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
      console.log('❌ AUTHENTICATE DEBUG - Email not verified:', {
        userId: user._id,
        email: user.email,
        hasGoogleId: !!user.google_id,
        emailVerified: user.email_verified
      });
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

    console.log('✅ AUTHENTICATE DEBUG - User authenticated successfully:', {
      userId: user._id,
      userType: user.user_type,
      hasProviderId: !!user.provider_id,
      providerIdType: typeof user.provider_id,
      providerIdValue: user.provider_id?._id?.toString() || user.provider_id?.toString(),
      isActive: user.is_active,
      emailVerified: user.email_verified
    });

    // Log successful authentication
    await logSecurityEvent(req, user._id, 'authentication_success', {
      endpoint: req.path,
      user_type: user.user_type
    });

    req.user = user;
    console.log('✅ AUTHENTICATE DEBUG - Authentication complete, calling next()');
    next();
  } catch (error) {
    console.log('❌ AUTHENTICATE DEBUG - Error:', error.message);
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
    console.log('🔍 AUTHORIZE DEBUG - Starting authorization check:', {
      endpoint: req.path,
      method: req.method,
      requiredRoles: roles,
      userExists: !!req.user,
      userType: req.user?.user_type,
      userId: req.user?._id
    });

    if (!req.user) {
      console.log('❌ AUTHORIZE DEBUG - User not authenticated');
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
      console.log('❌ AUTHORIZE DEBUG - Insufficient permissions:', {
        userRole: req.user.user_type,
        requiredRoles: roles,
        roleMatch: roles.includes(req.user.user_type)
      });
      
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

    console.log('✅ AUTHORIZE DEBUG - Authorization passed, calling next()');
    next();
  };
};

// Middleware to check if user profile is complete
const requireCompleteProfile = async (req, res, next) => {
  const user = req.user;
  
  // Only first_name and last_name are required
  const isProfileComplete = !!(user.first_name && user.last_name);
  
  if (!isProfileComplete) {
    const missingFields = [];
    if (!user.first_name) missingFields.push('first_name');
    if (!user.last_name) missingFields.push('last_name');
    
    await logSecurityEvent(req, user._id, 'profile_access_denied', {
      reason: 'incomplete_profile',
      missing_fields: missingFields,
      endpoint: req.path
    });
    
    return res.status(400).json({ 
      error: 'Profile incomplete. Please complete your first and last name.',
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
    console.log('🔍 CHECKPROVIDEROWNERSHIP DEBUG - Starting provider ownership check:', {
      endpoint: req.path,
      method: req.method,
      userType: req.user?.user_type,
      userId: req.user?._id
    });

    if (req.user.user_type === 'system_admin') {
      console.log('✅ CHECKPROVIDEROWNERSHIP DEBUG - System admin access granted');
      return next(); // System admins can access everything
    }

    if (req.user.user_type === 'provider_admin') {
      // Check if the resource belongs to the user's provider
      const providerId = req.params.providerId || req.params.id || req.body.provider_id;
      const userProviderId = req.user.provider_id?._id?.toString() || req.user.provider_id?.toString();
      
      console.log('🔍 DEBUG - Provider ownership check:', {
        requestedProviderId: providerId,
        userProviderId: userProviderId,
        userType: req.user.user_type,
        endpoint: req.path,
        method: req.method,
        providerIdType: typeof req.user.provider_id,
        providerIdStructure: req.user.provider_id
      });

      if (providerId && providerId !== userProviderId) {
        console.log('❌ CHECKPROVIDEROWNERSHIP DEBUG - Access denied - different provider:', {
          requestedProviderId: providerId,
          userProviderId: userProviderId
        });
        
        await logSecurityEvent(req, req.user._id, 'provider_access_denied', {
          reason: 'different_provider',
          requested_provider: providerId,
          user_provider: userProviderId,
          endpoint: req.path
        });
        
        return res.status(403).json({ 
          error: 'Access denied. Resource belongs to different provider.',
          code: 'AUTH_009',
          details: ['You can only access resources belonging to your provider']
        });
      }
      
      console.log('✅ CHECKPROVIDEROWNERSHIP DEBUG - Provider ownership check passed');
    }

    console.log('✅ CHECKPROVIDEROWNERSHIP DEBUG - Calling next()');
    next();
  } catch (error) {
    console.log('❌ CHECKPROVIDEROWNERSHIP DEBUG - Error:', error.message);
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