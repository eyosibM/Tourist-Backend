const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
  time: {
    type: String, // HH:MM format
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  location_name: String,
  description: String,
  duration_minutes: Number,
  notes: String,
  is_meal: {
    type: Boolean,
    default: false
  },
  meal_type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  cost_per_person: Number,
  is_optional: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate'
  },
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour'
  },
  day_number: {
    type: Number,
    required: true,
    min: 1
  },
  date: Date, // Specific date for custom tours
  
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Daily schedule
  items: [itineraryItemSchema],
  
  // Daily summary
  total_duration_hours: Number,
  total_cost_per_person: Number,
  total_distance_km: Number,
  
  // Logistics
  meeting_point: {
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    location_name: String,
    address: String,
    time: String, // HH:MM format
    instructions: String
  },
  
  end_point: {
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    location_name: String,
    address: String,
    time: String, // HH:MM format
  },
  
  // Requirements and recommendations
  what_to_bring: [String],
  dress_code: String,
  fitness_level_required: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'difficult']
  },
  
  // Weather and conditions
  weather_considerations: String,
  best_weather_conditions: [String],
  backup_plan: String,
  
  // Transportation
  transportation_included: {
    type: Boolean,
    default: false
  },
  transportation_details: String,
  
  // Meals
  meals_included: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  }],
  dietary_accommodations: [String],
  
  // Status and modifications
  is_confirmed: {
    type: Boolean,
    default: true
  },
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modification_notes: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Calculate totals before saving
itinerarySchema.pre('save', function(next) {
  // Calculate total duration
  this.total_duration_hours = this.items.reduce((total, item) => {
    return total + (item.duration_minutes || 0);
  }, 0) / 60;
  
  // Calculate total cost
  this.total_cost_per_person = this.items.reduce((total, item) => {
    return total + (item.cost_per_person || 0);
  }, 0);
  
  next();
});

// Compound indexes
itinerarySchema.index({ tour_template_id: 1, day_number: 1 });
itinerarySchema.index({ custom_tour_id: 1, day_number: 1 });
itinerarySchema.index({ date: 1 });

// Ensure unique day per tour
itinerarySchema.index(
  { tour_template_id: 1, day_number: 1 }, 
  { unique: true, sparse: true }
);
itinerarySchema.index(
  { custom_tour_id: 1, day_number: 1 }, 
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);