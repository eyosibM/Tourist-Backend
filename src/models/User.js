const mongoose = require('mongoose');
const PasswordUtils = require('../utils/passwordUtils');

const userSchema = new mongoose.Schema({
  // Built-in fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  // Custom fields from spec
  user_type: {
    type: String,
    enum: ['system_admin', 'provider_admin', 'tourist'],
    default: 'tourist'
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  country: String,
  passport_number: String,
  date_of_birth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  phone_number: String,
  profile_picture: {
    type: String, // URL to the profile picture
    default: null
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  is_active: {
    type: Boolean,
    default: true
  },

  // Authentication fields
  google_id: String,
  password: {
    type: String,
    required: function() {
      return !this.google_id; // Required if not Google user
    }
  },

  // Email verification fields
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: String,
  email_verification_expires: Date,

  // Password reset fields
  password_reset_token: String,
  password_reset_expires: Date,

  // Security tracking fields
  login_attempts: {
    type: Number,
    default: 0
  },
  account_locked_until: Date,
  last_login: Date

}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Skip hashing if password is empty (for Google users)
  if (!this.password) return next();
  
  try {
    // Hash password using centralized password utilities
    this.password = await PasswordUtils.hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return PasswordUtils.comparePassword(candidatePassword, this.password);
};

// Method to validate password strength
userSchema.methods.validatePasswordStrength = function(password) {
  return PasswordUtils.validatePasswordStrength(password);
};

// Method to check if password needs rehashing
userSchema.methods.needsPasswordRehashing = function() {
  return PasswordUtils.needsRehashing(this.password);
};

// Virtual for full name
userSchema.virtual('full_name').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);