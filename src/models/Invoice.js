const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    required: true,
    unique: true
  },
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
  invoice_date: {
    type: Date,
    default: Date.now
  },
  due_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1 // Percentage as decimal (e.g., 0.1 for 10%)
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  payment_terms: {
    type: String,
    default: 'Due upon receipt'
  },
  notes: String,
  // Billing addresses
  billing_address: {
    name: String,
    address_line_1: String,
    address_line_2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  provider_address: {
    name: String,
    address_line_1: String,
    address_line_2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  // Denormalized fields
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

// Auto-generate invoice number
invoiceSchema.pre('save', function(next) {
  if (!this.invoice_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.invoice_number = `INV-${year}${month}-${random}`;
  }
  next();
});

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
  
  // Calculate tax amount
  this.tax_amount = this.subtotal * this.tax_rate;
  
  // Calculate total amount
  this.total_amount = this.subtotal + this.tax_amount - this.discount_amount;
  
  next();
});

// Indexes
invoiceSchema.index({ tourist_id: 1, status: 1 });
invoiceSchema.index({ provider_id: 1, status: 1 });
invoiceSchema.index({ invoice_date: -1 });
invoiceSchema.index({ due_date: 1 });
invoiceSchema.index({ invoice_number: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);