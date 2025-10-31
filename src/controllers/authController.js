const User = require('../models/User');
const SecurityEventService = require('../services/securityEventService');
const { generateToken, sanitizeUser } = require('../utils/helpers');
const { authEmailService } = require('../utils/email');
const PasswordUtils = require('../utils/passwordUtils');
const TokenService = require('../services/tokenService');

// Helper function to check if profile picture is from Google
const isGoogleProfilePicture = (url) => {
  if (!url) return false;
  return url.includes('googleusercontent.com') || url.includes('google.com');
};

// Google OAuth login/register
const googleAuth = async (req, res) => {
  try {
    const { google_id, email, first_name, last_name, picture } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Check if user exists
    let user = await User.findOne({
      $or: [{ google_id }, { email }]
    }).populate('provider_id');

    let isNewUser = false;

    if (user) {
      // Update Google ID and profile picture if not set or if Google picture is provided
      let needsUpdate = false;

      if (!user.google_id && google_id) {
        user.google_id = google_id;
        needsUpdate = true;
      }

      // Set email_verified to true for Google users (mixed authentication scenario)
      if (!user.email_verified) {
        user.email_verified = true;
        needsUpdate = true;
      }

      // Update profile picture from Google if:
      // 1. User doesn't have a profile picture, OR
      // 2. User has an existing Google profile picture (allow Google to update it)
      // Note: We don't overwrite custom profile pictures with Google pictures
      if (picture && (!user.profile_picture || isGoogleProfilePicture(user.profile_picture))) {
        user.profile_picture = picture;
        needsUpdate = true;
      }

      // Clear any existing email verification tokens since Google OAuth verifies the email
      if (user.email_verification_token || user.email_verification_expires) {
        user.email_verification_token = undefined;
        user.email_verification_expires = undefined;
        needsUpdate = true;
      }

      // Reset login attempts and unlock account if locked (Google OAuth bypasses these restrictions)
      if (user.login_attempts > 0 || user.account_locked_until) {
        user.login_attempts = 0;
        user.account_locked_until = undefined;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
      }
    } else {
      // Create new user with Google profile picture
      isNewUser = true;
      user = new User({
        google_id,
        email,
        first_name,
        last_name,
        profile_picture: picture || null, // Set Google profile picture if provided
        user_type: 'tourist',
        email_verified: true // Google OAuth users are considered email verified
      });
      await user.save();
    }

    // Update last login time
    user.last_login = new Date();
    await user.save();

    // Log security event for Google OAuth authentication
    await SecurityEventService.logLoginSuccess(
      user._id, 
      ip_address, 
      user_agent,
      { 
        email,
        auth_method: 'google_oauth',
        is_new_user: isNewUser,
        mixed_auth_user: !isNewUser && user.password // User has both Google and password auth
      }
    );

    const token = generateToken(user._id);

    res.json({
      message: 'Authentication successful',
      token,
      user: sanitizeUser(user),
      redirect: getRedirectUrl(user)
    });
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Log failed Google OAuth attempt
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';
    
    await SecurityEventService.logLoginFailed(
      req.body.email || 'unknown', 
      ip_address, 
      user_agent, 
      'google_oauth_error',
      { error: error.message }
    );
    
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('provider_id');
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.email; // Email cannot be updated
    delete updates.google_id; // Google ID cannot be updated

    // Clean up empty strings to avoid validation errors
    Object.keys(updates).forEach(key => {
      if (updates[key] === '' || updates[key] === null) {
        delete updates[key];
      }
    });

    console.log('Updating profile for user:', req.user._id, 'with data:', updates); // Debug log

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('provider_id');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated successfully for user:', user._id); // Debug log

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Profile update error:', error); // Debug log
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Helper function to determine redirect URL based on user type
const getRedirectUrl = (user) => {
  // Check if profile is incomplete (additional fields beyond Google-provided data)
  const isProfileComplete = !!(
    user.first_name && 
    user.last_name && 
    user.country && 
    user.date_of_birth && 
    user.gender && 
    user.phone_number
  );
  
  if (!isProfileComplete) {
    console.log('Profile incomplete, redirecting to /profile'); // Debug log
    console.log('Missing fields:', {
      first_name: !!user.first_name,
      last_name: !!user.last_name,
      country: !!user.country,
      date_of_birth: !!user.date_of_birth,
      gender: !!user.gender,
      phone_number: !!user.phone_number
    });
    return '/profile';
  }

  console.log('Profile complete, redirecting based on user type:', user.user_type); // Debug log
  
  switch (user.user_type) {
    case 'system_admin':
      return '/admin/dashboard';
    case 'provider_admin':
      return '/provider/dashboard';
    case 'tourist':
    default:
      return '/mytours';
  }
};

// Reset profile picture to Google picture
const resetToGooglePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.google_id) {
      return res.status(400).json({ error: 'User is not linked to Google account' });
    }

    // For now, we'll need the frontend to provide the Google picture URL
    // In a real implementation, you might fetch this from Google's API
    const { google_picture_url } = req.body;

    if (!google_picture_url) {
      return res.status(400).json({ error: 'Google picture URL is required' });
    }

    if (!isGoogleProfilePicture(google_picture_url)) {
      return res.status(400).json({ error: 'Invalid Google picture URL' });
    }

    user.profile_picture = google_picture_url;
    await user.save();

    const updatedUser = await User.findById(user._id).populate('provider_id');

    res.json({
      message: 'Profile picture reset to Google picture successfully',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Reset to Google picture error:', error);
    res.status(500).json({ error: 'Failed to reset profile picture' });
  }
};

// User registration with email and password
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Log failed registration attempt
      await SecurityEventService.logRegistrationAttempt(
        email, 
        ip_address, 
        user_agent, 
        false,
        { reason: 'email_already_exists' }
      );

      return res.status(400).json({
        error: 'Email already registered',
        code: 'AUTH_005',
        details: ['An account with this email address already exists']
      });
    }

    // Validate password strength (additional validation beyond Joi)
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      // Log failed registration attempt
      await SecurityEventService.logRegistrationAttempt(
        email, 
        ip_address, 
        user_agent, 
        false,
        { reason: 'password_validation_failed', errors: passwordValidation.errors }
      );

      return res.status(400).json({
        error: 'Password does not meet security requirements',
        code: 'AUTH_006',
        details: passwordValidation.errors
      });
    }

    // Generate email verification token
    const { token: verificationToken, expires: verificationExpires } = 
      TokenService.generateEmailVerificationToken();

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      first_name,
      last_name,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
      user_type: 'tourist'
    });

    await user.save();

    // Send verification email
    const emailSent = await authEmailService.sendEmailVerification(
      user.email,
      user.first_name,
      verificationToken
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
      // Don't fail registration if email fails, but log it
    }

    // Log successful registration attempt
    await SecurityEventService.logRegistrationAttempt(
      email, 
      ip_address, 
      user_agent, 
      true,
      { user_id: user._id.toString() }
    );

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: sanitizeUser(user),
      email_verification_required: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';
    
    // Log failed registration attempt
    await SecurityEventService.logRegistrationAttempt(
      req.body.email || 'unknown', 
      ip_address, 
      user_agent, 
      false,
      { error: error.message }
    );
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Email already registered',
        code: 'AUTH_005',
        details: ['An account with this email address already exists']
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred during registration']
    });
  }
};

// User login with email and password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate('provider_id');
    
    // Check if user exists and has a password (not Google-only user)
    if (!user || !user.password) {
      // Log failed login attempt
      if (user) {
        await SecurityEventService.logLoginFailed(
          email, 
          ip_address, 
          user_agent, 
          'invalid_credentials'
        );
      }
      
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_001',
        details: ['Email or password is incorrect']
      });
    }

    // Check if account is locked
    if (user.account_locked_until && user.account_locked_until > new Date()) {
      await SecurityEventService.logLoginFailed(
        email, 
        ip_address, 
        user_agent, 
        'account_locked'
      );

      return res.status(423).json({
        error: 'Account temporarily locked',
        code: 'AUTH_003',
        details: ['Account is locked due to multiple failed login attempts. Please try again later.']
      });
    }

    // Check if account is active
    if (!user.is_active) {
      await SecurityEventService.logLoginFailed(
        email, 
        ip_address, 
        user_agent, 
        'account_inactive'
      );

      return res.status(403).json({
        error: 'Account inactive',
        code: 'AUTH_001',
        details: ['Your account has been deactivated']
      });
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      user.login_attempts = (user.login_attempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.login_attempts >= 5) {
        user.account_locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        
        // Send account locked email
        await authEmailService.sendAccountLocked(user.email, user.first_name);
        
        // Log account locked event
        await SecurityEventService.logAccountLocked(
          user._id, 
          ip_address, 
          user_agent, 
          'multiple_failed_attempts'
        );
      }
      
      await user.save();

      await SecurityEventService.logLoginFailed(
        email, 
        ip_address, 
        user_agent, 
        'invalid_password',
        { login_attempts: user.login_attempts }
      );

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_001',
        details: ['Email or password is incorrect']
      });
    }

    // Check email verification status for email/password users
    if (!user.email_verified && !user.google_id) {
      await SecurityEventService.logLoginFailed(
        email, 
        ip_address, 
        user_agent, 
        'email_not_verified'
      );

      return res.status(403).json({
        error: 'Email verification required',
        code: 'AUTH_002',
        details: ['Please verify your email address before logging in'],
        email_verification_required: true
      });
    }

    // Successful login - reset login attempts and update last login
    user.login_attempts = 0;
    user.account_locked_until = undefined;
    user.last_login = new Date();
    await user.save();

    // Log successful login
    await SecurityEventService.logLoginSuccess(
      user._id, 
      ip_address, 
      user_agent,
      { email }
    );

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
      redirect: getRedirectUrl(user)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred during login']
    });
  }
};

// Password reset request
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Always return the same response regardless of whether email exists
    const standardResponse = {
      message: 'If an account with that email exists, we have sent a password reset link.',
      code: 'PASSWORD_RESET_SENT'
    };

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Generate password reset token
      const { token: resetToken, expires: resetExpires } = 
        TokenService.generatePasswordResetToken();

      // Update user with reset token
      user.password_reset_token = resetToken;
      user.password_reset_expires = resetExpires;
      await user.save();

      // Send password reset email
      const emailSent = await authEmailService.sendPasswordReset(
        user.email,
        user.first_name,
        resetToken
      );

      if (!emailSent) {
        console.error('Failed to send password reset email to:', user.email);
      }

      // Log security event
      await SecurityEventService.logPasswordResetRequested(
        email, 
        ip_address, 
        user_agent
      );
    }

    // Always return success response (don't reveal if email exists)
    res.json(standardResponse);

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred while processing your request']
    });
  }
};

// Password reset completion
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Find user by reset token
    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'AUTH_004',
        details: ['The password reset link is invalid or has expired']
      });
    }

    // Validate new password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(new_password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        code: 'AUTH_006',
        details: passwordValidation.errors
      });
    }

    // Update password and clear reset token
    user.password = new_password; // Will be hashed by pre-save middleware
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    user.login_attempts = 0; // Reset login attempts
    user.account_locked_until = undefined; // Unlock account if locked
    await user.save();

    // Send password reset confirmation email
    const emailSent = await authEmailService.sendPasswordResetConfirmation(
      user.email,
      user.first_name
    );

    if (!emailSent) {
      console.error('Failed to send password reset confirmation email to:', user.email);
    }

    // Log security event
    await SecurityEventService.logPasswordResetCompleted(
      user._id, 
      ip_address, 
      user_agent
    );

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
      code: 'PASSWORD_RESET_SUCCESS'
    });

  } catch (error) {
    console.error('Password reset completion error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    res.status(500).json({
      error: 'Password reset failed',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred while resetting your password']
    });
  }
};

// Email verification
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Find user by verification token
    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'AUTH_004',
        details: ['The email verification link is invalid or has expired']
      });
    }

    // Update user verification status
    user.email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    await user.save();

    // Log security event
    await SecurityEventService.logEmailVerified(
      user._id, 
      ip_address, 
      user_agent
    );

    res.json({
      message: 'Email verified successfully. You can now log in to your account.',
      code: 'EMAIL_VERIFIED_SUCCESS',
      email_verified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred while verifying your email']
    });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
    const user_agent = req.get('User-Agent') || 'unknown';

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'AUTH_001',
        details: ['No account found with this email address']
      });
    }

    // Check if email is already verified
    if (user.email_verified) {
      return res.status(400).json({
        error: 'Email already verified',
        code: 'EMAIL_ALREADY_VERIFIED',
        details: ['This email address has already been verified']
      });
    }

    // Generate new verification token
    const { token: verificationToken, expires: verificationExpires } = 
      TokenService.generateEmailVerificationToken();

    // Update user with new token (invalidates previous ones)
    user.email_verification_token = verificationToken;
    user.email_verification_expires = verificationExpires;
    await user.save();

    // Send verification email
    const emailSent = await authEmailService.sendEmailVerification(
      user.email,
      user.first_name,
      verificationToken
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
      return res.status(500).json({
        error: 'Failed to send verification email',
        code: 'EMAIL_SEND_FAILED',
        details: ['Unable to send verification email. Please try again later.']
      });
    }

    // Log security event
    await SecurityEventService.logEmailVerificationRequested(
      user._id, 
      ip_address, 
      user_agent,
      { email: user.email }
    );

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.',
      code: 'VERIFICATION_EMAIL_SENT'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to resend verification email',
      code: 'SERVER_ERROR',
      details: ['An unexpected error occurred while sending verification email']
    });
  }
};

// Logout (client-side token removal)
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  googleAuth,
  getProfile,
  updateProfile,
  resetToGooglePicture,
  logout,
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};