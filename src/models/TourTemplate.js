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

const tourTemplateSchema = new mongoose.Schema({
  template_name: {
    type: String,
    required: true
  },
  start_date: {
    type: String, // Store as YYYY-MM-DD string to avoid timezone issues
    required: true
  },
  end_date: {
    type: String, // Store as YYYY-MM-DD string to avoid timezone issues
    required: true
  },
  description: String,
  visibility: {
    type: String,
    enum: ['public', 'private', 'Public', 'Private'], // Accept both cases for backward compatibility
    default: 'public',
    set: function(value) {
      // Automatically convert to lowercase
      return value ? value.toLowerCase() : 'public';
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  duration_days: Number,
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
  web_links: [webLinkSchema],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Calculate duration_days automatically
tourTemplateSchema.pre('save', function (next) {
  if (this.start_date && this.end_date) {
    // Parse string dates (YYYY-MM-DD format)
    const start = new Date(this.start_date + 'T00:00:00');
    const end = new Date(this.end_date + 'T00:00:00');
    const diffTime = Math.abs(end - start);
    this.duration_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('TourTemplate', tourTemplateSchema);