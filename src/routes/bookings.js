const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireCompleteProfile } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const bookingController = require('../controllers/bookingController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         booking_reference:
 *           type: string
 *         tour_template_id:
 *           type: string
 *         custom_tour_id:
 *           type: string
 *         tourist_id:
 *           type: string
 *         provider_id:
 *           type: string
 *         booking_date:
 *           type: string
 *           format: date-time
 *         tour_date:
 *           type: string
 *           format: date
 *         number_of_participants:
 *           type: number
 *         total_amount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, paid, cancelled, completed, no_show, refunded]
 *         payment_status:
 *           type: string
 *           enum: [pending, partial, paid, refunded, failed]
 *     Availability:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         tour_template_id:
 *           type: string
 *         provider_id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         is_available:
 *           type: boolean
 *         total_capacity:
 *           type: number
 *         available_spots:
 *           type: number
 *         base_price_per_person:
 *           type: number
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Bookings]
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
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/',
  authenticate,
  requireCompleteProfile,
  bookingController.getUserBookings
);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability_id
 *               - number_of_participants
 *               - contact_email
 *             properties:
 *               availability_id:
 *                 type: string
 *               number_of_participants:
 *                 type: number
 *               contact_email:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               special_requests:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     age:
 *                       type: number
 *                     dietary_requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/',
  authenticate,
  requireCompleteProfile,
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 */
router.get('/:id',
  authenticate,
  requireCompleteProfile,
  bookingController.getBookingById
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Bookings]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.patch('/:id/cancel',
  authenticate,
  requireCompleteProfile,
  bookingController.cancelBooking
);

/**
 * @swagger
 * /api/bookings/{id}/check-in:
 *   patch:
 *     summary: Check in booking (Provider only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking checked in successfully
 */
router.patch('/:id/check-in',
  authenticate,
  authorize('provider_admin', 'system_admin'),
  requireCompleteProfile,
  bookingController.checkInBooking
);

/**
 * @swagger
 * /api/availability:
 *   get:
 *     summary: Get tour availability
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: tour_template_id
 *         schema:
 *           type: string
 *         description: Tour template ID
 *       - in: query
 *         name: provider_id
 *         schema:
 *           type: string
 *         description: Provider ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for availability search
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for availability search
 *     responses:
 *       200:
 *         description: Availability retrieved successfully
 */
router.get('/availability',
  bookingController.getAvailability
);

/**
 * @swagger
 * /api/availability:
 *   post:
 *     summary: Create availability (Provider only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tour_template_id
 *               - date
 *               - total_capacity
 *               - base_price_per_person
 *             properties:
 *               tour_template_id:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               total_capacity:
 *                 type: number
 *               base_price_per_person:
 *                 type: number
 *               time_slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *                     max_capacity:
 *                       type: number
 *                     price_per_person:
 *                       type: number
 *     responses:
 *       201:
 *         description: Availability created successfully
 */
router.post('/availability',
  authenticate,
  authorize('provider_admin', 'system_admin'),
  requireCompleteProfile,
  bookingController.createAvailability
);

module.exports = router;