const mongoose = require('mongoose');

const defaultActivitySchema = new mongoose.Schema({
  activity_name: {
    type: String,
    required: true
  },
  description: String,
  typical_duration_hours: Number,
  category: {
    type: String,
    enum: [
      'sightseeing', 'cultural', 'adventure', 'dining', 
      'transportation', 'accommodation', 'entertainment', 
      'shopping', 'educational', 'religious', 'nature', 'other'
    ],
    required: true
  },
  features_media: {
    url: {
      type: String, // URL to the media (S3 for all media files)
      default: null
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    video_id: {
      type: String, // Legacy field - no longer used (videos stored in S3)
      default: null
    },
    duration: {
      type: Number, // Video duration in seconds (only for videos)
      default: null
    },
    embed_url: {
      type: String, // Legacy field - no longer used (videos stored in S3)
      default: null
    }
  },
  // Keep the old field for backward compatibility
  features_image: {
    type: String, // URL to the main features image (deprecated - use features_media)
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

module.exports = mongoose.model('DefaultActivity', defaultActivitySchema);