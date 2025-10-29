const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  chat_room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'system', 'announcement'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  
  // Rich content
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
  
  // Message threading
  reply_to_message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  thread_messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }],
  
  // Message interactions
  reactions: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down']
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Read receipts
  read_by: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message status
  is_edited: {
    type: Boolean,
    default: false
  },
  edited_at: Date,
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: Date,
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Moderation
  is_flagged: {
    type: Boolean,
    default: false
  },
  flagged_by: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    flagged_at: {
      type: Date,
      default: Date.now
    }
  }],
  moderated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderation_action: {
    type: String,
    enum: ['none', 'warning', 'hidden', 'deleted']
  },
  
  // Timestamps
  sent_at: {
    type: Date,
    default: Date.now
  },
  
  // Denormalized fields
  sender_name: String,
  sender_profile_picture: String,
  room_name: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Methods
chatMessageSchema.methods.addReaction = function(userId, reaction) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user_id.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user_id: userId,
    reaction: reaction
  });
  
  return this.save();
};

chatMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user_id.toString() !== userId.toString());
  return this.save();
};

chatMessageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.read_by.find(r => r.user_id.toString() === userId.toString());
  if (!existingRead) {
    this.read_by.push({
      user_id: userId,
      read_at: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Indexes
chatMessageSchema.index({ chat_room_id: 1, sent_at: -1 });
chatMessageSchema.index({ sender_id: 1, sent_at: -1 });
chatMessageSchema.index({ reply_to_message_id: 1 });
chatMessageSchema.index({ is_deleted: 1, sent_at: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);