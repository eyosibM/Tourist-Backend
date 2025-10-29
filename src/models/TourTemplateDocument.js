const mongoose = require('mongoose');

const tourTemplateDocumentSchema = new mongoose.Schema({
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate',
    required: true,
    index: true
  },
  document_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  document_url: {
    type: String,
    required: true
  },
  document_type: {
    type: String,
    enum: ['general', 'itinerary', 'requirements', 'safety', 'booking', 'other'],
    default: 'general'
  },
  file_name: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  file_type: {
    type: String,
    required: true
  },
  is_public: {
    type: Boolean,
    default: true,
    index: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  upload_date: {
    type: Date,
    default: Date.now
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  updated_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Indexes for better query performance
tourTemplateDocumentSchema.index({ tour_template_id: 1, is_public: 1 });
tourTemplateDocumentSchema.index({ uploaded_by: 1, created_date: -1 });
tourTemplateDocumentSchema.index({ document_type: 1, is_public: 1 });

// Virtual for populated template info
tourTemplateDocumentSchema.virtual('template', {
  ref: 'TourTemplate',
  localField: 'tour_template_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated uploader info
tourTemplateDocumentSchema.virtual('uploader', {
  ref: 'User',
  localField: 'uploaded_by',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
tourTemplateDocumentSchema.set('toJSON', { virtuals: true });
tourTemplateDocumentSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update the updated_date
tourTemplateDocumentSchema.pre('save', function(next) {
  this.updated_date = new Date();
  next();
});

// Static method to find documents by template
tourTemplateDocumentSchema.statics.findByTemplate = function(templateId, options = {}) {
  const query = { tour_template_id: templateId };
  
  if (options.is_public !== undefined) {
    query.is_public = options.is_public;
  }
  
  if (options.document_type) {
    query.document_type = options.document_type;
  }
  
  let queryBuilder = this.find(query);
  
  if (options.populate) {
    if (options.populate.includes('template')) {
      queryBuilder = queryBuilder.populate('template', 'template_name description');
    }
    if (options.populate.includes('uploader')) {
      queryBuilder = queryBuilder.populate('uploader', 'email first_name last_name user_type');
    }
  }
  
  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  } else {
    queryBuilder = queryBuilder.sort({ created_date: -1 });
  }
  
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  if (options.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  
  return queryBuilder;
};

// Static method to find public documents
tourTemplateDocumentSchema.statics.findPublic = function(options = {}) {
  return this.find({ is_public: true, ...options }).sort({ created_date: -1 });
};

// Instance method to check if user can access document
tourTemplateDocumentSchema.methods.canAccess = function(user) {
  if (this.is_public) return true;
  if (!user) return false;
  
  // Owner can always access
  if (this.uploaded_by.toString() === user._id.toString()) return true;
  
  // System admin can access all
  if (user.user_type === 'system_admin') return true;
  
  // Provider admin can access documents from their templates
  // This would need additional logic to check template ownership
  return false;
};

const TourTemplateDocument = mongoose.model('TourTemplateDocument', tourTemplateDocumentSchema);

module.exports = TourTemplateDocument;