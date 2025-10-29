const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  registration_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  custom_tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomTour',
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  payment_method: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transaction_id: {
    type: String, // External payment processor transaction ID
    unique: true,
    sparse: true
  },
  stripe_payment_intent_id: String,
  paypal_order_id: String,
  payment_date: Date,
  refund_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  refund_date: Date,
  refund_reason: String,
  failure_reason: String,
  metadata: {
    type: Map,
    of: String // Additional payment processor metadata
  },
  // Denormalized fields for reporting
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

// Indexes for efficient queries
paymentSchema.index({ tourist_id: 1, payment_status: 1 });
paymentSchema.index({ provider_id: 1, payment_status: 1 });
paymentSchema.index({ custom_tour_id: 1 });
paymentSchema.index({ payment_date: -1 });
paymentSchema.index({ transaction_id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);