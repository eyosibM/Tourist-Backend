const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  room_name: {
    type: String,
    required: true
  },
  room_type: {
    type: String,
    enum: ['tour_group', 'provider_team', 'support', 'general'],
    required: true
  },
  
  // Associated tour (for tour group chats)
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour'
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  
  // Room settings
  description: String,
  is_private: {
    type: Boolean,
    default: false
  },
  max_members: {
    type: Number,
    default: 50
  },
  
  // Members
  members: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joined_at: {
      type: Date,
      default: Date.now
    },
    last_seen: Date,
    is_muted: {
      type: Boolean,
      default: false
    },
    // Denormalized user info
    user_name: String,
    user_profile_picture: String
  }],
  
  // Room statistics
  total_messages: {
    type: Number,
    default: 0
  },
  last_message: {
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage'
    },
    content: String,
    sender_name: String,
    sent_at: Date
  },
  
  // Room status
  is_active: {
    type: Boolean,
    default: true
  },
  is_archived: {
    type: Boolean,
    default: false
  },
  archived_at: Date,
  
  // Room settings
  settings: {
    allow_file_sharing: {
      type: Boolean,
      default: true
    },
    allow_location_sharing: {
      type: Boolean,
      default: true
    },
    message_retention_days: {
      type: Number,
      default: 365
    },
    require_approval_for_new_members: {
      type: Boolean,
      default: false
    }
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Methods
chatRoomSchema.methods.addMember = function(userId, userInfo, role = 'member') {
  const existingMember = this.members.find(m => m.user_id.toString() === userId.toString());
  if (existingMember) {
    return false; // Member already exists
  }
  
  this.members.push({
    user_id: userId,
    role: role,
    user_name: userInfo.name,
    user_profile_picture: userInfo.profile_picture
  });
  
  return this.save();
};

chatRoomSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user_id.toString() !== userId.toString());
  return this.save();
};

chatRoomSchema.methods.updateLastMessage = function(messageInfo) {
  this.last_message = {
    message_id: messageInfo._id,
    content: messageInfo.content.substring(0, 100), // Truncate for preview
    sender_name: messageInfo.sender_name,
    sent_at: messageInfo.sent_at
  };
  this.total_messages += 1;
  return this.save();
};

// Indexes
chatRoomSchema.index({ custom_tour_id: 1 });
chatRoomSchema.index({ provider_id: 1 });
chatRoomSchema.index({ room_type: 1, is_active: 1 });
chatRoomSchema.index({ 'members.user_id': 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);