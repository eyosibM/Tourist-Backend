const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification content
  type: {
    type: String,
    enum: [
      'tour_registration', 'registration_approved', 'registration_rejected',
      'tour_update', 'tour_cancelled', 'tour_reminder',
      'payment_received', 'payment_failed', 'invoice_generated',
      'message_received', 'chat_mention', 'broadcast_message',
      'review_received', 'review_response',
      'role_change_approved', 'role_change_rejected',
      'document_uploaded', 'document_approved', 'document_rejected',
      'system_announcement', 'maintenance_notice',
      'location_update', 'itinerary_change',
      'weather_alert', 'emergency_alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Rich content
  action_url: String, // Deep link or URL to relevant page
  action_text: String, // Text for action button (e.g., "View Tour", "Pay Now")
  
  image_url: String,
  icon: String, // Icon identifier for the notification type
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Delivery channels
  channels: {
    push: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    in_app: {
      type: Boolean,
      default: true
    }
  },
  
  // Delivery status
  delivery_status: {
    push: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sent_at: Date,
      delivered_at: Date,
      error_message: String
    },
    email: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sent_at: Date,
      delivered_at: Date,
      opened_at: Date,
      error_message: String
    },
    sms: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sent_at: Date,
      delivered_at: Date,
      error_message: String
    }
  },
  
  // User interaction
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: Date,
  is_clicked: {
    type: Boolean,
    default: false
  },
  clicked_at: Date,
  
  // Scheduling
  scheduled_for: Date, // For scheduled notifications
  expires_at: Date, // When notification becomes irrelevant
  
  // Related entities
  related_entities: {
    custom_tour_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomTour'
    },
    registration_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration'
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    review_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourReview'
    },
    chat_room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom'
    }
  },
  
  // Grouping and batching
  group_key: String, // For grouping similar notifications
  batch_id: String, // For batch processing
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Denormalized fields
  sender_name: String,
  sender_profile_picture: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Methods
notificationSchema.methods.markAsRead = function() {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

notificationSchema.methods.markAsClicked = function() {
  this.is_clicked = true;
  this.clicked_at = new Date();
  if (!this.is_read) {
    this.is_read = true;
    this.read_at = new Date();
  }
  return this.save();
};

// Indexes
notificationSchema.index({ recipient_id: 1, created_date: -1 });
notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ type: 1, created_date: -1 });
notificationSchema.index({ scheduled_for: 1 });
notificationSchema.index({ expires_at: 1 });
notificationSchema.index({ group_key: 1 });
notificationSchema.index({ 'related_entities.custom_tour_id': 1 });

module.exports = mongoose.model('Notification', notificationSchema);