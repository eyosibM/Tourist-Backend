const mongoose = require('mongoose');

const tourReviewSchema = new mongoose.Schema({
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour',
    required: true
  },
  registration_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  tourist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  overall_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Detailed ratings
  organization_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  communication_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  value_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  experience_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  review_text: {
    type: String,
    required: true,
    maxlength: 2000
  },
  pros: [String], // Array of positive aspects
  cons: [String], // Array of negative aspects
  
  // Review status and moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderation_notes: String,
  moderated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderated_at: Date,
  
  // Interaction tracking
  helpful_votes: {
    type: Number,
    default: 0
  },
  not_helpful_votes: {
    type: Number,
    default: 0
  },
  
  // Provider response
  provider_response: {
    response_text: String,
    responded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responded_at: Date
  },
  
  // Verification
  is_verified_purchase: {
    type: Boolean,
    default: true
  },
  
  // Denormalized fields for display
  tourist_name: String,
  tourist_profile_picture: String,
  tour_name: String,
  provider_name: String,
  tour_start_date: Date,
  tour_end_date: Date,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Compound index to prevent duplicate reviews
tourReviewSchema.index({ custom_tour_id: 1, tourist_id: 1 }, { unique: true });

// Other indexes
tourReviewSchema.index({ provider_id: 1, status: 1 });
tourReviewSchema.index({ overall_rating: -1 });
tourReviewSchema.index({ created_date: -1 });
tourReviewSchema.index({ status: 1 });

module.exports = mongoose.model('TourReview', tourReviewSchema);