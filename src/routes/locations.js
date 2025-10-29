const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireCompleteProfile } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [city, landmark, attraction, restaurant, hotel, airport, station, museum, park, beach, mountain, building, neighborhood, other]
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         address:
 *           type: object
 *           properties:
 *             street_address:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *         average_rating:
 *           type: number
 *         is_active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Search locations
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Location type filter
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country filter
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for nearby search
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for nearby search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Search radius in kilometers
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
 *         description: Locations retrieved successfully
 */
router.get('/', locationController.searchLocations);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - coordinates
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               address:
 *                 type: object
 *                 properties:
 *                   street_address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 */
router.post('/',
  authenticate,
  authorize('system_admin', 'provider_admin'),
  requireCompleteProfile,
  locationController.createLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 */
router.get('/:id', locationController.getLocationById);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update location
 *     tags: [Locations]
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
 *         description: Location updated successfully
 */
router.put('/:id',
  authenticate,
  authorize('system_admin', 'provider_admin'),
  requireCompleteProfile,
  locationController.updateLocation
);

/**
 * @swagger
 * /api/locations/tours/{tourId}:
 *   get:
 *     summary: Get locations for tour
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [template, custom]
 *         description: Tour type (template or custom)
 *     responses:
 *       200:
 *         description: Tour locations retrieved successfully
 */
router.get('/tours/:tourId', locationController.getTourLocations);

/**
 * @swagger
 * /api/locations/tours/{tourId}:
 *   post:
 *     summary: Add location to tour
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
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
 *               - location_id
 *               - visit_order
 *               - day_number
 *               - activity_type
 *             properties:
 *               location_id:
 *                 type: string
 *               visit_order:
 *                 type: number
 *               day_number:
 *                 type: number
 *               activity_type:
 *                 type: string
 *               planned_arrival_time:
 *                 type: string
 *               planned_departure_time:
 *                 type: string
 *               activity_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location added to tour successfully
 */
router.post('/tours/:tourId',
  authenticate,
  authorize('system_admin', 'provider_admin'),
  requireCompleteProfile,
  locationController.addLocationToTour
);

module.exports = router;