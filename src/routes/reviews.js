const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireCompleteProfile } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const reviewController = require('../controllers/reviewController');

/**
 * @swagger
 * components:
 *   schemas:
 *     TourReview:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         custom_tour_id:
 *           type: string
 *         tourist_id:
 *           type: string
 *         provider_id:
 *           type: string
 *         overall_rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         organization_rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         communication_rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         value_rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         experience_rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *           maxLength: 100
 *         review_text:
 *           type: string
 *           maxLength: 2000
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         created_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: tour_id
 *         schema:
 *           type: string
 *         description: Filter by tour ID
 *       - in: query
 *         name: provider_id
 *         schema:
 *           type: string
 *         description: Filter by provider ID
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
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/', reviewController.getReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create tour review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custom_tour_id
 *               - registration_id
 *               - overall_rating
 *               - title
 *               - review_text
 *             properties:
 *               custom_tour_id:
 *                 type: string
 *               registration_id:
 *                 type: string
 *               overall_rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               organization_rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               communication_rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               value_rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               experience_rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               review_text:
 *                 type: string
 *                 maxLength: 2000
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/',
  authenticate,
  requireCompleteProfile,
  validate(schemas.createReview),
  reviewController.createReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @swagger
 * /api/reviews/{id}/moderate:
 *   patch:
 *     summary: Moderate review (Admin only)
 *     tags: [Reviews]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, flagged]
 *               moderation_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review moderated successfully
 */
router.patch('/:id/moderate',
  authenticate,
  authorize('system_admin'),
  requireCompleteProfile,
  validate(schemas.moderateReview),
  reviewController.moderateReview
);

/**
 * @swagger
 * /api/reviews/{id}/respond:
 *   post:
 *     summary: Provider response to review
 *     tags: [Reviews]
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
 *               - response_text
 *             properties:
 *               response_text:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.post('/:id/respond',
  authenticate,
  authorize('provider_admin'),
  requireCompleteProfile,
  validate(schemas.respondToReview),
  reviewController.respondToReview
);

/**
 * @swagger
 * /api/reviews/provider/{providerId}/rating:
 *   get:
 *     summary: Get provider rating summary
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Provider rating retrieved successfully
 */
router.get('/provider/:providerId/rating', reviewController.getProviderRating);

module.exports = router;