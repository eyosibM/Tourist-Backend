const mongoose = require('mongoose');

const webLinkSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 24
  }
}, { _id: false });

const customTourSchema = new mongoose.Schema({
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate',
    required: false, // Allow null for blank templates
    default: null
  },
  tour_name: {
    type: String,
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft'
  },
  viewAccessibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  join_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 10
  },
  max_tourists: {
    type: Number,
    default: 5
  },
  remaining_tourists: {
    type: Number,
    default: 5
  },
  group_chat_link: String,
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
  teaser_images: [{
    type: String // Array of URLs for teaser images
  }],
  qr_code_url: {
    type: String, // URL to QR code image in S3
    default: null
  },
  qr_code_generated_at: {
    type: Date,
    default: null
  },
  join_qr_code_url: {
    type: String, // URL to join QR code image in S3
    default: null
  },
  web_links: [webLinkSchema],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Auto-generate join code
customTourSchema.pre('save', function (next) {
  if (!this.join_code) {
    this.join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Update remaining_tourists when max_tourists changes
  if (this.isModified('max_tourists') && !this.isNew) {
    // This will be handled in the route logic to account for existing registrations
  }

  next();
});

module.exports = mongoose.model('CustomTour', customTourSchema);