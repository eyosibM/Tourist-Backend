let stripe = null;

// Initialize Stripe only if configured
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe payment service initialized');
  } else {
    console.warn('Stripe not configured - payment features will be limited');
  }
} catch (error) {
  console.warn('Stripe initialization failed:', error.message);
}

const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const PaymentMethod = require('../models/PaymentMethod');
const Registration = require('../models/Registration');
const CustomTour = require('../models/CustomTour');
const User = require('../models/User');

class PaymentService {
  /**
   * Check if Stripe is available
   */
  static isStripeAvailable() {
    return stripe !== null && process.env.STRIPE_SECRET_KEY;
  }

  /**
   * Initialize Stripe customer for user
   */
  static async createStripeCustomer(user) {
    try {
      if (!this.isStripeAvailable()) {
        throw new Error('Stripe not configured');
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          user_id: user._id.toString()
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for tour registration
   */
  static async createPaymentIntent(registrationId, amount, currency = 'USD') {
    try {
      if (!this.isStripeAvailable()) {
        throw new Error('Payment processing not available - Stripe not configured');
      }

      const registration = await Registration.findById(registrationId)
        .populate('tourist_id')
        .populate('custom_tour_id')
        .populate('provider_id');

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Create or get Stripe customer
      let stripeCustomerId = registration.tourist_id.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await this.createStripeCustomer(registration.tourist_id);
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await User.findByIdAndUpdate(registration.tourist_id._id, {
          stripe_customer_id: stripeCustomerId
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: stripeCustomerId,
        metadata: {
          registration_id: registrationId.toString(),
          custom_tour_id: registration.custom_tour_id._id.toString(),
          tourist_id: registration.tourist_id._id.toString(),
          provider_id: registration.provider_id._id.toString()
        },
        description: `Payment for ${registration.custom_tour_id.tour_name}`
      });

      // Create payment record
      const payment = new Payment({
        registration_id: registrationId,
        custom_tour_id: registration.custom_tour_id._id,
        tourist_id: registration.tourist_id._id,
        provider_id: registration.provider_id._id,
        amount: amount,
        currency: currency,
        payment_method: 'stripe',
        payment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        // Denormalized fields
        tourist_name: `${registration.tourist_id.first_name} ${registration.tourist_id.last_name}`,
        tourist_email: registration.tourist_id.email,
        tour_name: registration.custom_tour_id.tour_name,
        provider_name: registration.provider_id.provider_name
      });

      await payment.save();

      return {
        payment_intent: paymentIntent,
        payment_record: payment
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and update records
   */
  static async confirmPayment(paymentIntentId) {
    try {
      if (!this.isStripeAvailable()) {
        throw new Error('Payment processing not available - Stripe not configured');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      const payment = await Payment.findOne({
        stripe_payment_intent_id: paymentIntentId
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (paymentIntent.status === 'succeeded') {
        payment.payment_status = 'completed';
        payment.payment_date = new Date();
        payment.transaction_id = paymentIntent.id;
        await payment.save();

        // Update registration status
        await Registration.findByIdAndUpdate(payment.registration_id, {
          status: 'approved'
        });

        // Generate invoice
        await this.generateInvoice(payment);

        return payment;
      } else {
        payment.payment_status = 'failed';
        payment.failure_reason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await payment.save();
        
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(paymentId, refundAmount, reason) {
    try {
      if (!this.isStripeAvailable()) {
        throw new Error('Refund processing not available - Stripe not configured');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.payment_status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          payment_id: paymentId.toString(),
          refund_reason: reason
        }
      });

      // Update payment record
      payment.payment_status = 'refunded';
      payment.refund_amount = refundAmount;
      payment.refund_date = new Date();
      payment.refund_reason = reason;
      await payment.save();

      return {
        refund: refund,
        payment: payment
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Generate invoice for payment
   */
  static async generateInvoice(payment) {
    try {
      const registration = await Registration.findById(payment.registration_id)
        .populate('tourist_id')
        .populate('custom_tour_id')
        .populate('provider_id');

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const invoice = new Invoice({
        registration_id: payment.registration_id,
        custom_tour_id: payment.custom_tour_id,
        tourist_id: payment.tourist_id,
        provider_id: payment.provider_id,
        due_date: dueDate,
        status: 'paid',
        items: [{
          description: `Tour Registration: ${payment.tour_name}`,
          quantity: 1,
          unit_price: payment.amount,
          total_price: payment.amount
        }],
        subtotal: payment.amount,
        total_amount: payment.amount,
        currency: payment.currency,
        // Denormalized fields
        tourist_name: payment.tourist_name,
        tourist_email: payment.tourist_email,
        tour_name: payment.tour_name,
        provider_name: payment.provider_name
      });

      await invoice.save();
      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Save payment method for user
   */
  static async savePaymentMethod(userId, stripePaymentMethodId) {
    try {
      if (!this.isStripeAvailable()) {
        throw new Error('Payment method storage not available - Stripe not configured');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get payment method details from Stripe
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

      const paymentMethod = new PaymentMethod({
        user_id: userId,
        type: stripePaymentMethod.type === 'card' ? 'credit_card' : stripePaymentMethod.type,
        provider: 'stripe',
        stripe_payment_method_id: stripePaymentMethodId,
        stripe_customer_id: user.stripe_customer_id
      });

      if (stripePaymentMethod.card) {
        paymentMethod.card_brand = stripePaymentMethod.card.brand;
        paymentMethod.card_last_four = stripePaymentMethod.card.last4;
        paymentMethod.card_exp_month = stripePaymentMethod.card.exp_month;
        paymentMethod.card_exp_year = stripePaymentMethod.card.exp_year;
      }

      await paymentMethod.save();
      return paymentMethod;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * Get payment history for user
   */
  static async getPaymentHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        startDate,
        endDate
      } = options;

      const query = { tourist_id: userId };
      
      if (status) {
        query.payment_status = status;
      }
      
      if (startDate || endDate) {
        query.payment_date = {};
        if (startDate) query.payment_date.$gte = new Date(startDate);
        if (endDate) query.payment_date.$lte = new Date(endDate);
      }

      const payments = await Payment.find(query)
        .populate('custom_tour_id', 'tour_name start_date end_date')
        .populate('provider_id', 'provider_name')
        .sort({ payment_date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(query);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event) {
    try {
      if (!this.isStripeAvailable()) {
        console.warn('Webhook received but Stripe not configured');
        return;
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmPayment(event.data.object.id);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
          
        case 'charge.dispute.created':
          await this.handleDispute(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  static async handlePaymentFailure(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        stripe_payment_intent_id: paymentIntent.id
      });

      if (payment) {
        payment.payment_status = 'failed';
        payment.failure_reason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await payment.save();
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle dispute
   */
  static async handleDispute(charge) {
    try {
      const payment = await Payment.findOne({
        transaction_id: charge.payment_intent
      });

      if (payment) {
        // Log dispute for manual review
        console.log(`Dispute created for payment ${payment._id}`);
        // Could send notification to admin, etc.
      }
    } catch (error) {
      console.error('Error handling dispute:', error);
    }
  }
}

module.exports = PaymentService;