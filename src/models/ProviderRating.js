const mongoose = require('mongoose');

const providerRatingSchema = new mongoose.Schema({
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  // Overall metrics
  total_reviews: {
    type: Number,
    default: 0
  },
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Detailed averages
  average_organization: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  average_communication: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  average_value: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  average_experience: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Rating distribution
  rating_distribution: {
    five_star: { type: Number, default: 0 },
    four_star: { type: Number, default: 0 },
    three_star: { type: Number, default: 0 },
    two_star: { type: Number, default: 0 },
    one_star: { type: Number, default: 0 }
  },
  
  // Performance metrics
  total_tours_completed: {
    type: Number,
    default: 0
  },
  total_tourists_served: {
    type: Number,
    default: 0
  },
  response_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1 // Percentage as decimal
  },
  average_response_time_hours: {
    type: Number,
    default: 0
  },
  
  // Quality indicators
  recommendation_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1 // Percentage of tourists who would recommend
  },
  repeat_customer_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1 // Percentage of repeat customers
  },
  
  // Recent performance (last 30 days)
  recent_reviews: {
    type: Number,
    default: 0
  },
  recent_average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Badges and achievements
  badges: [{
    type: String,
    enum: [
      'top_rated', 'super_host', 'quick_responder', 
      'excellent_communication', 'great_value', 
      'outstanding_experience', 'verified_provider'
    ]
  }],
  
  // Last calculation date
  last_calculated: {
    type: Date,
    default: Date.now
  },
  
  // Denormalized provider info
  provider_name: String,
  provider_country: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Method to recalculate ratings
providerRatingSchema.methods.recalculateRatings = async function() {
  const TourReview = mongoose.model('TourReview');
  
  // Get all approved reviews for this provider
  const reviews = await TourReview.find({
    provider_id: this.provider_id,
    status: 'approved'
  });
  
  if (reviews.length === 0) {
    this.total_reviews = 0;
    this.average_rating = 0;
    this.average_organization = 0;
    this.average_communication = 0;
    this.average_value = 0;
    this.average_experience = 0;
    this.rating_distribution = {
      five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0
    };
    this.last_calculated = new Date();
    return this.save();
  }
  
  // Calculate averages
  this.total_reviews = reviews.length;
  this.average_rating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;
  
  // Calculate detailed averages (only for reviews that have these ratings)
  const orgReviews = reviews.filter(r => r.organization_rating);
  this.average_organization = orgReviews.length > 0 
    ? orgReviews.reduce((sum, r) => sum + r.organization_rating, 0) / orgReviews.length 
    : 0;
    
  const commReviews = reviews.filter(r => r.communication_rating);
  this.average_communication = commReviews.length > 0
    ? commReviews.reduce((sum, r) => sum + r.communication_rating, 0) / commReviews.length
    : 0;
    
  const valueReviews = reviews.filter(r => r.value_rating);
  this.average_value = valueReviews.length > 0
    ? valueReviews.reduce((sum, r) => sum + r.value_rating, 0) / valueReviews.length
    : 0;
    
  const expReviews = reviews.filter(r => r.experience_rating);
  this.average_experience = expReviews.length > 0
    ? expReviews.reduce((sum, r) => sum + r.experience_rating, 0) / expReviews.length
    : 0;
  
  // Calculate rating distribution
  this.rating_distribution = {
    five_star: reviews.filter(r => r.overall_rating === 5).length,
    four_star: reviews.filter(r => r.overall_rating === 4).length,
    three_star: reviews.filter(r => r.overall_rating === 3).length,
    two_star: reviews.filter(r => r.overall_rating === 2).length,
    one_star: reviews.filter(r => r.overall_rating === 1).length
  };
  
  // Calculate recent performance (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentReviews = reviews.filter(r => r.created_date >= thirtyDaysAgo);
  this.recent_reviews = recentReviews.length;
  this.recent_average_rating = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + r.overall_rating, 0) / recentReviews.length
    : 0;
  
  this.last_calculated = new Date();
  return this.save();
};

// Indexes
providerRatingSchema.index({ average_rating: -1 });
providerRatingSchema.index({ total_reviews: -1 });
providerRatingSchema.index({ last_calculated: 1 });

module.exports = mongoose.model('ProviderRating', providerRatingSchema);