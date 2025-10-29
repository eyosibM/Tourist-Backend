const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: [
      'city', 'landmark', 'attraction', 'restaurant', 'hotel', 
      'airport', 'station', 'museum', 'park', 'beach', 
      'mountain', 'building', 'neighborhood', 'other'
    ],
    required: true
  },
  
  // Geographic coordinates
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  
  // Address information
  address: {
    street_address: String,
    city: String,
    state_province: String,
    postal_code: String,
    country: {
      type: String,
      required: true
    },
    formatted_address: String
  },
  
  // Contact information
  contact: {
    phone: String,
    email: String,
    website: String,
    social_media: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  
  // Operating information
  operating_hours: [{
    day_of_week: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open_time: String, // HH:MM format
    close_time: String, // HH:MM format
    is_closed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Pricing information
  pricing: {
    entry_fee: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    pricing_notes: String
  },
  
  // Media
  images: [String], // Array of image URLs
  featured_image: String,
  
  // Ratings and reviews
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  total_reviews: {
    type: Number,
    default: 0
  },
  
  // Accessibility information
  accessibility: {
    wheelchair_accessible: Boolean,
    parking_available: Boolean,
    public_transport_nearby: Boolean,
    accessibility_notes: String
  },
  
  // Categories and tags
  categories: [String], // e.g., ['historical', 'cultural', 'outdoor']
  tags: [String], // e.g., ['family-friendly', 'romantic', 'adventure']
  
  // Popularity metrics
  popularity_score: {
    type: Number,
    default: 0
  },
  visit_count: {
    type: Number,
    default: 0
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  
  // External IDs for integration
  google_place_id: String,
  foursquare_id: String,
  tripadvisor_id: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Geospatial index for location-based queries
locationSchema.index({ 
  'coordinates.latitude': 1, 
  'coordinates.longitude': 1 
});

// Text index for search
locationSchema.index({
  name: 'text',
  description: 'text',
  'address.city': 'text',
  'address.country': 'text',
  categories: 'text',
  tags: 'text'
});

// Other indexes
locationSchema.index({ type: 1, 'address.country': 1 });
locationSchema.index({ average_rating: -1 });
locationSchema.index({ popularity_score: -1 });
locationSchema.index({ is_active: 1, is_verified: 1 });

// Method to calculate distance to another location
locationSchema.methods.distanceTo = function(otherLocation) {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = this.coordinates.latitude * Math.PI / 180;
  const lat2 = otherLocation.coordinates.latitude * Math.PI / 180;
  const deltaLat = (otherLocation.coordinates.latitude - this.coordinates.latitude) * Math.PI / 180;
  const deltaLon = (otherLocation.coordinates.longitude - this.coordinates.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in kilometers
};

module.exports = mongoose.model('Location', locationSchema);