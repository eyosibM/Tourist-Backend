const mongoose = require('mongoose');

const tourLocationSchema = new mongoose.Schema({
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate'
  },
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour'
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  
  // Tour-specific information
  visit_order: {
    type: Number,
    required: true,
    min: 1
  },
  day_number: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Timing information
  planned_arrival_time: String, // HH:MM format
  planned_departure_time: String, // HH:MM format
  estimated_duration_minutes: {
    type: Number,
    min: 0
  },
  
  // Activity details
  activity_type: {
    type: String,
    enum: [
      'visit', 'meal', 'accommodation', 'transportation', 
      'activity', 'free_time', 'meeting_point', 'other'
    ],
    required: true
  },
  activity_description: String,
  special_instructions: String,
  
  // Transportation
  transportation_to: {
    method: {
      type: String,
      enum: ['walking', 'bus', 'train', 'car', 'taxi', 'boat', 'plane', 'other']
    },
    duration_minutes: Number,
    cost: Number,
    notes: String
  },
  
  // Costs and requirements
  entry_cost_per_person: {
    type: Number,
    default: 0
  },
  is_optional: {
    type: Boolean,
    default: false
  },
  requires_booking: {
    type: Boolean,
    default: false
  },
  booking_notes: String,
  
  // Weather considerations
  weather_dependent: {
    type: Boolean,
    default: false
  },
  alternative_location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  
  // Group management
  max_group_size: Number,
  requires_guide: {
    type: Boolean,
    default: false
  },
  
  // Status
  is_confirmed: {
    type: Boolean,
    default: true
  },
  status_notes: String,
  
  // Denormalized fields for performance
  location_name: String,
  location_address: String,
  location_coordinates: {
    latitude: Number,
    longitude: Number
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Compound indexes
tourLocationSchema.index({ tour_template_id: 1, day_number: 1, visit_order: 1 });
tourLocationSchema.index({ custom_tour_id: 1, day_number: 1, visit_order: 1 });
tourLocationSchema.index({ location_id: 1 });

// Ensure unique visit order per day per tour
tourLocationSchema.index(
  { tour_template_id: 1, day_number: 1, visit_order: 1 }, 
  { unique: true, sparse: true }
);
tourLocationSchema.index(
  { custom_tour_id: 1, day_number: 1, visit_order: 1 }, 
  { unique: true, sparse: true }
);

module.exports = mongoose.model('TourLocation', tourLocationSchema);