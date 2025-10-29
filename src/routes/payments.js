const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireCompleteProfile } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         registration_id:
 *           type: string
 *         custom_tour_id:
 *           type: string
 *         tourist_id:
 *           type: string
 *         provider_id:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, CAD, AUD]
 *         payment_method:
 *           type: string
 *           enum: [stripe, paypal, bank_transfer, cash]
 *         payment_status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded, cancelled]
 *         transaction_id:
 *           type: string
 *         payment_date:
 *           type: string
 *           format: date-time
 *         created_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/', 
  authenticate,
  requireCompleteProfile,
  paymentController.getPaymentHistory
);

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_id
 *               - amount
 *             properties:
 *               registration_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 */
router.post('/create-intent',
  authenticate,
  requireCompleteProfile,
  validate(schemas.createPaymentIntent),
  paymentController.createPaymentIntent
);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent_id
 *             properties:
 *               payment_intent_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.post('/confirm',
  authenticate,
  requireCompleteProfile,
  validate(schemas.confirmPayment),
  paymentController.confirmPayment
);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refund_amount
 *               - reason
 *             properties:
 *               refund_amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/:id/refund',
  authenticate,
  authorize('system_admin', 'provider_admin'),
  requireCompleteProfile,
  validate(schemas.processRefund),
  paymentController.processRefund
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook',
  paymentController.handleWebhook
);

module.exports = router;