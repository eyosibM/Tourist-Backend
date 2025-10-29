const PaymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const Registration = require('../models/Registration');

class PaymentController {
  /**
   * Get payment history for user
   */
  static async getPaymentHistory(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const result = await PaymentService.getPaymentHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        startDate,
        endDate
      });

      res.json({
        message: 'Payment history retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment history' });
    }
  }

  /**
   * Create payment intent
   */
  static async createPaymentIntent(req, res) {
    try {
      // Check if payment service is available
      if (!PaymentService.isStripeAvailable()) {
        return res.status(503).json({ 
          error: 'Payment processing not available',
          message: 'Stripe payment service is not configured'
        });
      }

      const { registration_id, amount, currency = 'USD' } = req.body;

      // Verify registration belongs to user
      const registration = await Registration.findOne({
        _id: registration_id,
        tourist_id: req.user._id
      });

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const result = await PaymentService.createPaymentIntent(
        registration_id,
        amount,
        currency
      );

      res.status(201).json({
        message: 'Payment intent created successfully',
        client_secret: result.payment_intent.client_secret,
        payment_id: result.payment_record._id
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Confirm payment
   */
  static async confirmPayment(req, res) {
    try {
      const { payment_intent_id } = req.body;

      const payment = await PaymentService.confirmPayment(payment_intent_id);

      res.json({
        message: 'Payment confirmed successfully',
        payment
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Process refund
   */
  static async processRefund(req, res) {
    try {
      const { id } = req.params;
      const { refund_amount, reason } = req.body;

      // Check if user has permission to refund this payment
      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Provider admins can only refund their own payments
      if (req.user.user_type === 'provider_admin' && 
          payment.provider_id.toString() !== req.user.provider_id.toString()) {
        return res.status(403).json({ error: 'Not authorized to refund this payment' });
      }

      const result = await PaymentService.processRefund(id, refund_amount, reason);

      res.json({
        message: 'Refund processed successfully',
        refund: result.refund,
        payment: result.payment
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle Stripe webhook
   */
  static async handleWebhook(req, res) {
    try {
      if (!PaymentService.isStripeAvailable()) {
        console.warn('Webhook received but Stripe not configured');
        return res.status(503).json({ error: 'Payment service not available' });
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      await PaymentService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

module.exports = PaymentController;