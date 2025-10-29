const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_account'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true
  },
  // Stripe-specific fields
  stripe_payment_method_id: String,
  stripe_customer_id: String,
  
  // PayPal-specific fields
  paypal_payer_id: String,
  paypal_email: String,
  
  // Card information (masked for security)
  card_brand: String, // visa, mastercard, amex, etc.
  card_last_four: String,
  card_exp_month: Number,
  card_exp_year: Number,
  
  // Bank account information (masked)
  bank_name: String,
  account_last_four: String,
  account_type: {
    type: String,
    enum: ['checking', 'savings']
  },
  
  is_default: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  nickname: String, // User-friendly name for the payment method
  
  // Billing address
  billing_address: {
    name: String,
    address_line_1: String,
    address_line_2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.is_default && this.isModified('is_default')) {
    await this.constructor.updateMany(
      { user_id: this.user_id, _id: { $ne: this._id } },
      { is_default: false }
    );
  }
  next();
});

// Indexes
paymentMethodSchema.index({ user_id: 1, is_active: 1 });
paymentMethodSchema.index({ user_id: 1, is_default: 1 });
paymentMethodSchema.index({ stripe_customer_id: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);