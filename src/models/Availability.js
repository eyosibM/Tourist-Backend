const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start_time: {
    type: String, // HH:MM format
    required: true
  },
  end_time: {
    type: String, // HH:MM format
    required: true
  },
  max_capacity: {
    type: Number,
    required: true,
    min: 1
  },
  current_bookings: {
    type: Number,
    default: 0,
    min: 0
  },
  price_per_person: {
    type: Number,
    required: true,
    min: 0
  },
  is_available: {
    type: Boolean,
    default: true
  },
  notes: String
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate',
    required: true
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  
  // Date and time information
  date: {
    type: Date,
    required: true
  },
  day_of_week: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  
  // Availability status
  is_available: {
    type: Boolean,
    default: true
  },
  availability_type: {
    type: String,
    enum: ['regular', 'special', 'blocked', 'maintenance'],
    default: 'regular'
  },
  
  // Capacity management
  total_capacity: {
    type: Number,
    required: true,
    min: 1
  },
  available_spots: {
    type: Number,
    required: true,
    min: 0
  },
  reserved_spots: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Time slots (for tours with multiple time options)
  time_slots: [timeSlotSchema],
  
  // Pricing
  base_price_per_person: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Special pricing rules
  pricing_rules: [{
    rule_type: {
      type: String,
      enum: ['early_bird', 'last_minute', 'group_discount', 'seasonal', 'promotional']
    },
    discount_percentage: Number,
    discount_amount: Number,
    min_participants: Number,
    max_participants: Number,
    valid_from: Date,
    valid_until: Date,
    description: String
  }],
  
  // Requirements and restrictions
  minimum_participants: {
    type: Number,
    default: 1
  },
  maximum_participants: Number,
  age_restrictions: {
    min_age: Number,
    max_age: Number,
    requires_adult_supervision: Boolean
  },
  
  // Booking rules
  advance_booking_required_hours: {
    type: Number,
    default: 24
  },
  cancellation_policy: {
    free_cancellation_hours: Number,
    partial_refund_hours: Number,
    no_refund_hours: Number,
    cancellation_fee_percentage: Number
  },
  
  // Weather and conditions
  weather_dependent: {
    type: Boolean,
    default: false
  },
  weather_conditions: [String], // e.g., ['sunny', 'cloudy', 'no_rain']
  backup_plan: String,
  
  // Special notes and requirements
  special_requirements: [String],
  what_to_bring: [String],
  included_items: [String],
  excluded_items: [String],
  
  // Seasonal information
  season: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter', 'year_round']
  },
  
  // Status and modifications
  last_updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  
  // Denormalized fields
  tour_template_name: String,
  provider_name: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Calculate available spots before saving
availabilitySchema.pre('save', function(next) {
  this.available_spots = this.total_capacity - this.reserved_spots;
  next();
});

// Methods
availabilitySchema.methods.reserveSpots = function(numberOfSpots) {
  if (this.available_spots >= numberOfSpots) {
    this.reserved_spots += numberOfSpots;
    this.available_spots -= numberOfSpots;
    return this.save();
  }
  throw new Error('Not enough available spots');
};

availabilitySchema.methods.releaseSpots = function(numberOfSpots) {
  this.reserved_spots = Math.max(0, this.reserved_spots - numberOfSpots);
  this.available_spots = this.total_capacity - this.reserved_spots;
  return this.save();
};

availabilitySchema.methods.calculatePrice = function(participants, bookingDate) {
  let basePrice = this.base_price_per_person * participants;
  
  // Apply pricing rules
  for (const rule of this.pricing_rules) {
    if (this.isRuleApplicable(rule, participants, bookingDate)) {
      if (rule.discount_percentage) {
        basePrice *= (1 - rule.discount_percentage / 100);
      } else if (rule.discount_amount) {
        basePrice -= rule.discount_amount;
      }
    }
  }
  
  return Math.max(0, basePrice);
};

availabilitySchema.methods.isRuleApplicable = function(rule, participants, bookingDate) {
  // Check participant count
  if (rule.min_participants && participants < rule.min_participants) return false;
  if (rule.max_participants && participants > rule.max_participants) return false;
  
  // Check date validity
  if (rule.valid_from && bookingDate < rule.valid_from) return false;
  if (rule.valid_until && bookingDate > rule.valid_until) return false;
  
  return true;
};

// Indexes
availabilitySchema.index({ tour_template_id: 1, date: 1 });
availabilitySchema.index({ provider_id: 1, date: 1 });
availabilitySchema.index({ date: 1, is_available: 1 });
availabilitySchema.index({ day_of_week: 1, is_available: 1 });

// Ensure unique availability per tour template per date
availabilitySchema.index({ tour_template_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);