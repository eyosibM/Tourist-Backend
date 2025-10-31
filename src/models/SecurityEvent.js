const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'login_success', 
      'login_failed', 
      'password_reset_requested', 
      'password_reset_completed', 
      'email_verified', 
      'account_locked',
      'registration_attempt',
      'email_verification_requested',
      'authentication_success',
      'authentication_failed',
      'authorization_failed',
      'email_verification_required',
      'profile_access_denied',
      'provider_access_denied',
      'provider_check_error',
      'email_verification_check_error'
    ],
    required: true,
    index: true
  },
  ip_address: {
    type: String,
    required: true,
    index: true
  },
  user_agent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: { 
    type: Date, 
    default: Date.now,
    index: true
  }
});

// Index for efficient querying by user and event type
securityEventSchema.index({ user_id: 1, event_type: 1, created_at: -1 });

// Index for IP-based queries
securityEventSchema.index({ ip_address: 1, created_at: -1 });

// TTL index to automatically delete old security events after 90 days
securityEventSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);