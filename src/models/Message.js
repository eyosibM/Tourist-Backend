const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  
  // File attachments
  attachments: [{
    file_name: String,
    file_url: String,
    file_size: Number,
    file_type: String,
    thumbnail_url: String
  }],
  
  // Location sharing
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    place_name: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Timestamps
  sent_at: {
    type: Date,
    default: Date.now
  },
  delivered_at: Date,
  read_at: Date,
  
  // Message context
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour'
  },
  
  // Message threading
  reply_to_message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message reactions
  reactions: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Moderation
  is_flagged: {
    type: Boolean,
    default: false
  },
  flagged_reason: String,
  moderated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Denormalized fields for performance
  sender_name: String,
  sender_profile_picture: String,
  recipient_name: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Generate conversation ID for two users
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Indexes
messageSchema.index({ conversation_id: 1, sent_at: -1 });
messageSchema.index({ sender_id: 1, sent_at: -1 });
messageSchema.index({ recipient_id: 1, status: 1 });
messageSchema.index({ custom_tour_id: 1, sent_at: -1 });

module.exports = mongoose.model('Message', messageSchema);