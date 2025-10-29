const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dietary_requirements: [String],
  special_needs: String,
  emergency_contact: {
    name: String,
    phone: String,
    relationship: String
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  booking_reference: {
    type: String,
    required: true,
    unique: true
  },
  
  // Related entities
  availability_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability',
    required: true
  },
  tour_template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourTemplate',
    required: true
  },
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour'
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
  
  // Booking details
  booking_date: {
    type: Date,
    required: true
  },
  tour_date: {
    type: Date,
    required: true
  },
  selected_time_slot: {
    start_time: String,
    end_time: String
  },
  
  // Participants
  number_of_participants: {
    type: Number,
    required: true,
    min: 1
  },
  participants: [participantSchema],
  
  // Pricing
  price_per_person: {
    type: Number,
    required: true,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  applied_discounts: [{
    discount_type: String,
    discount_amount: Number,
    discount_percentage: Number,
    description: String
  }],
  
  // Booking status
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'paid', 'cancelled', 
      'completed', 'no_show', 'refunded'
    ],
    default: 'pending'
  },
  
  // Payment information
  payment_status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  payment_method: String,
  payment_due_date: Date,
  
  // Confirmation and communication
  confirmation_sent_at: Date,
  reminder_sent_at: Date,
  
  // Customer information
  contact_email: {
    type: String,
    required: true
  },
  contact_phone: String,
  special_requests: String,
  
  // Cancellation information
  cancelled_at: Date,
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellation_reason: String,
  refund_amount: Number,
  refund_processed_at: Date,
  
  // Check-in information
  checked_in_at: Date,
  checked_in_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  no_show: {
    type: Boolean,
    default: false
  },
  
  // Reviews and feedback
  review_requested_at: Date,
  review_submitted: {
    type: Boolean,
    default: false
  },
  
  // Internal notes
  internal_notes: String,
  customer_notes: String,
  
  // Denormalized fields for performance
  tourist_name: String,
  tourist_email: String,
  tour_name: String,
  provider_name: String,
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Auto-generate booking reference
bookingSchema.pre('save', function(next) {
  if (!this.booking_reference) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.booking_reference = `BK${date}${random}`;
  }
  next();
});

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.isModified('price_per_person') || this.isModified('number_of_participants') || this.isModified('applied_discounts')) {
    let total = this.price_per_person * this.number_of_participants;
    
    // Apply discounts
    for (const discount of this.applied_discounts) {
      if (discount.discount_amount) {
        total -= discount.discount_amount;
      } else if (discount.discount_percentage) {
        total *= (1 - discount.discount_percentage / 100);
      }
    }
    
    this.total_amount = Math.max(0, total);
  }
  next();
});

// Methods
bookingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmation_sent_at = new Date();
  return this.save();
};

bookingSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancelled_by = cancelledBy;
  this.cancellation_reason = reason;
  return this.save();
};

bookingSchema.methods.checkIn = function(checkedInBy) {
  this.checked_in_at = new Date();
  this.checked_in_by = checkedInBy;
  if (this.status === 'confirmed' || this.status === 'paid') {
    this.status = 'completed';
  }
  return this.save();
};

bookingSchema.methods.markNoShow = function() {
  this.no_show = true;
  this.status = 'no_show';
  return this.save();
};

// Indexes
bookingSchema.index({ booking_reference: 1 });
bookingSchema.index({ tourist_id: 1, booking_date: -1 });
bookingSchema.index({ provider_id: 1, tour_date: 1 });
bookingSchema.index({ tour_date: 1, status: 1 });
bookingSchema.index({ availability_id: 1 });
bookingSchema.index({ custom_tour_id: 1 });
bookingSchema.index({ status: 1, tour_date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);