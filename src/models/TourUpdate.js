const mongoose = require('mongoose');

const tourUpdateSchema = new mongoose.Schema({
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour',
    required: true
  },
  update_title: {
    type: String,
    required: true,
    trim: true
  },
  update_content: {
    type: String,
    required: true
  },
  update_type: {
    type: String,
    enum: ['itinerary_change', 'announcement', 'document_upload', 'calendar_entry', 'general'],
    required: true,
    default: 'general'
  },
  is_published: {
    type: Boolean,
    default: false
  },
  published_date: {
    type: Date
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy field for backward compatibility
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Legacy field for backward compatibility
  update_summary: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Index for efficient queries
tourUpdateSchema.index({ custom_tour_id: 1, is_published: 1 });
tourUpdateSchema.index({ created_by: 1 });
tourUpdateSchema.index({ update_type: 1 });
tourUpdateSchema.index({ published_date: -1 });

// Virtual for backward compatibility
tourUpdateSchema.virtual('title').get(function() {
  return this.update_title;
});

tourUpdateSchema.virtual('content').get(function() {
  return this.update_content;
});

tourUpdateSchema.virtual('type').get(function() {
  return this.update_type;
});

tourUpdateSchema.virtual('published').get(function() {
  return this.is_published;
});

// Ensure virtual fields are serialized
tourUpdateSchema.set('toJSON', { virtuals: true });
tourUpdateSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set published_date when publishing
tourUpdateSchema.pre('save', function(next) {
  if (this.isModified('is_published') && this.is_published && !this.published_date) {
    this.published_date = new Date();
  }
  next();
});

module.exports = mongoose.model('TourUpdate', tourUpdateSchema);