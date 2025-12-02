const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const defaultActivityController = require('../controllers/defaultActivityController');
const { cacheMiddleware } = require('../middleware/cache');
const { createInvalidationMiddleware } = require('../middleware/cacheInvalidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     DefaultActivity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the activity
 *           example: "507f1f77bcf86cd799439011"
 *         activity_name:
 *           type: string
 *           description: Name of the activity
 *           example: "City Walking Tour"
 *         description:
 *           type: string
 *           description: Detailed description of the activity
 *           example: "Explore the historic downtown area with a professional guide"
 *         typical_duration_hours:
 *           type: number
 *           description: Typical duration in hours
 *           example: 2.5
 *           minimum: 0
 *         category:
 *           type: string
 *           enum: [sightseeing, cultural, adventure, dining, transportation, accommodation, entertainment, shopping, educational, religious, nature, other]
 *           description: Activity category
 *           example: "sightseeing"
 *         features_media:
 *           type: object
 *           description: Enhanced media object supporting images and videos
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               description: URL to the media file (S3 or local storage)
 *               example: "https://s3.amazonaws.com/tourlicity/activities/city-tour.jpg"
 *             type:
 *               type: string
 *               enum: [image, video]
 *               description: Type of media content
 *               example: "image"
 *             duration:
 *               type: number
 *               description: Duration in seconds (for videos only)
 *               example: 120
 *               nullable: true
 *             video_id:
 *               type: string
 *               description: Legacy field - no longer used
 *               deprecated: true
 *               nullable: true
 *             embed_url:
 *               type: string
 *               description: Legacy field - no longer used
 *               deprecated: true
 *               nullable: true
 *         features_image:
 *           type: string
 *           format: uri
 *           description: Legacy image URL (deprecated - use features_media instead)
 *           deprecated: true
 *           nullable: true
 *           example: "https://example.com/legacy-image.jpg"
 *         is_active:
 *           type: boolean
 *           description: Whether the activity is currently active
 *           example: true
 *         created_by:
 *           type: object
 *           description: User who created this activity
 *           properties:
 *             _id:
 *               type: string
 *               description: User ID
 *               example: "507f1f77bcf86cd799439012"
 *             first_name:
 *               type: string
 *               description: User's first name
 *               example: "John"
 *             last_name:
 *               type: string
 *               description: User's last name
 *               example: "Doe"
 *             email:
 *               type: string
 *               format: email
 *               description: User's email address
 *               example: "john.doe@example.com"
 *         created_date:
 *           type: string
 *           format: date-time
 *           description: When the activity was created
 *           example: "2025-11-06T20:00:00.000Z"
 *         updated_date:
 *           type: string
 *           format: date-time
 *           description: When the activity was last updated
 *           example: "2025-11-06T20:30:00.000Z"
 *     DefaultActivityRequest:
 *       type: object
 *       required:
 *         - activity_name
 *         - category
 *       properties:
 *         activity_name:
 *           type: string
 *           description: Name of the activity
 *           example: "Sunset Beach Walk"
 *           minLength: 1
 *           maxLength: 200
 *         description:
 *           type: string
 *           description: Detailed description of the activity
 *           example: "A relaxing walk along the beach during sunset with photo opportunities"
 *           maxLength: 1000
 *         typical_duration_hours:
 *           type: number
 *           minimum: 0
 *           maximum: 24
 *           description: Typical duration in hours
 *           example: 1.5
 *         category:
 *           type: string
 *           enum: [sightseeing, cultural, adventure, dining, transportation, accommodation, entertainment, shopping, educational, religious, nature, other]
 *           description: Activity category
 *           example: "nature"
 *         features_media:
 *           type: object
 *           description: Media content for the activity
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               description: URL to the media file
 *               example: "https://s3.amazonaws.com/tourlicity/activities/beach-walk.jpg"
 *             type:
 *               type: string
 *               enum: [image, video]
 *               description: Type of media content
 *               example: "image"
 *             duration:
 *               type: number
 *               description: Duration in seconds (required for videos)
 *               example: 30
 *               minimum: 1
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the activity is active
 *           example: true
 *     ActivityCategory:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Category name
 *           example: "sightseeing"
 *         count:
 *           type: number
 *           description: Number of activities in this category
 *           example: 15
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Activities focused on viewing attractions and landmarks"
 *     ActivitySelection:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Activity ID
 *           example: "507f1f77bcf86cd799439011"
 *         activity_name:
 *           type: string
 *           description: Activity name
 *           example: "City Walking Tour"
 *         description:
 *           type: string
 *           description: Brief description
 *           example: "Explore the historic downtown area"
 *         typical_duration_hours:
 *           type: number
 *           description: Duration in hours
 *           example: 2.5
 *         category:
 *           type: string
 *           description: Activity category
 *           example: "sightseeing"
 *         features_media:
 *           $ref: '#/components/schemas/MediaObject'
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all default activities with advanced filtering
 *     description: |
 *       Retrieve a paginated list of default activities with support for:
 *       - Text search across activity names and descriptions
 *       - Category filtering
 *       - Active status filtering
 *       - Cached responses for optimal performance
 *       
 *       **Performance**: This endpoint uses Redis caching with a 10-minute TTL for faster response times.
 *       
 *       **Access**: Requires system_admin or provider_admin role.
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sightseeing, cultural, adventure, dining, transportation, accommodation, entertainment, shopping, educational, religious, nature, other]
 *         description: Filter activities by category
 *         example: "sightseeing"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true for active, false for inactive)
 *         example: true
 *     responses:
 *       200:
 *         description: Default activities retrieved successfully
 *         headers:
 *           X-Cache-Status:
 *             description: Cache hit/miss status
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *           X-Total-Count:
 *             description: Total number of activities (for pagination)
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DefaultActivity'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 filters:
 *                   type: object
 *                   description: Applied filters
 *                   properties:
 *                     category:
 *                       type: string
 *                       nullable: true
 *                     search:
 *                       type: string
 *                       nullable: true
 *                     is_active:
 *                       type: boolean
 *                       nullable: true
 *             examples:
 *               success_response:
 *                 summary: Successful response with activities
 *                 value:
 *                   success: true
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       activity_name: "City Walking Tour"
 *                       description: "Explore historic downtown"
 *                       typical_duration_hours: 2.5
 *                       category: "sightseeing"
 *                       features_media:
 *                         url: "https://s3.amazonaws.com/tourlicity/city-tour.jpg"
 *                         type: "image"
 *                       is_active: true
 *                       created_date: "2025-11-06T20:00:00.000Z"
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 5
 *                     totalItems: 47
 *                     itemsPerPage: 10
 *                     hasNextPage: true
 *                     hasPrevPage: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  cacheMiddleware({ 
    ttl: 600, // 10 minutes
    prefix: 'activities',
    varyBy: ['page', 'limit', 'category', 'search']
  }),
  defaultActivityController.getAllDefaultActivities
);

/**
 * @swagger
 * /api/activities/selection:
 *   get:
 *     summary: Get activities optimized for frontend selection components
 *     description: |
 *       Returns a simplified, optimized list of activities perfect for:
 *       - Dropdown menus
 *       - Selection components
 *       - Autocomplete fields
 *       - Quick activity picking
 *       
 *       **Performance**: Cached for 15 minutes with minimal data transfer.
 *       
 *       **Use Case**: Ideal for frontend components that need quick activity selection without full details.
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sightseeing, cultural, adventure, dining, transportation, accommodation, entertainment, shopping, educational, religious, nature, other]
 *         description: Filter activities by specific category
 *         example: "cultural"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: Search term for activity names (case-insensitive)
 *         example: "museum"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: Activities for selection retrieved successfully
 *         headers:
 *           X-Cache-Status:
 *             description: Cache status
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activities:
 *                   type: array
 *                   description: Simplified activity objects for selection
 *                   items:
 *                     $ref: '#/components/schemas/ActivitySelection'
 *                 total:
 *                   type: number
 *                   description: Total number of matching activities
 *                   example: 15
 *                 filters:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       nullable: true
 *                     search:
 *                       type: string
 *                       nullable: true
 *             examples:
 *               cultural_activities:
 *                 summary: Cultural activities selection
 *                 value:
 *                   success: true
 *                   activities:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       activity_name: "Museum Visit"
 *                       description: "Explore local history and culture"
 *                       typical_duration_hours: 2
 *                       category: "cultural"
 *                       features_media:
 *                         url: "https://s3.amazonaws.com/tourlicity/museum.jpg"
 *                         type: "image"
 *                   total: 8
 *                   filters:
 *                     category: "cultural"
 *                     search: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/selection', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  cacheMiddleware({ 
    ttl: 900, // 15 minutes
    prefix: 'activities-selection'
  }),
  defaultActivityController.getActivitiesForSelection
);

/**
 * @swagger
 * /api/activities/categories:
 *   get:
 *     summary: Get activity categories with statistics and metadata
 *     description: |
 *       Returns all available activity categories with:
 *       - Activity count per category
 *       - Category descriptions
 *       - Usage statistics
 *       
 *       **Performance**: Heavily cached (30 minutes) as categories change rarely.
 *       
 *       **Use Case**: Perfect for building category filters, analytics dashboards, and navigation menus.
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_empty
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include categories with zero activities
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, count, popularity]
 *           default: name
 *         description: Sort categories by name, count, or popularity
 *     responses:
 *       200:
 *         description: Activity categories retrieved successfully
 *         headers:
 *           X-Cache-Status:
 *             description: Cache status
 *             schema:
 *               type: string
 *           X-Categories-Count:
 *             description: Total number of categories
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityCategory'
 *                 total_categories:
 *                   type: number
 *                   description: Total number of categories
 *                   example: 12
 *                 total_activities:
 *                   type: number
 *                   description: Total number of activities across all categories
 *                   example: 156
 *                 most_popular:
 *                   type: string
 *                   description: Category with the most activities
 *                   example: "sightseeing"
 *             examples:
 *               categories_overview:
 *                 summary: Categories with activity counts
 *                 value:
 *                   success: true
 *                   categories:
 *                     - name: "sightseeing"
 *                       count: 45
 *                       description: "Activities focused on viewing attractions and landmarks"
 *                     - name: "cultural"
 *                       count: 32
 *                       description: "Cultural experiences and heritage activities"
 *                     - name: "adventure"
 *                       count: 28
 *                       description: "Exciting outdoor and adventure activities"
 *                   total_categories: 12
 *                   total_activities: 156
 *                   most_popular: "sightseeing"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/categories', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  cacheMiddleware({ 
    ttl: 1800, // 30 minutes - categories change rarely
    prefix: 'activity-categories'
  }),
  defaultActivityController.getActivityCategories
);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get default activity by ID
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Default activity ID
 *     responses:
 *       200:
 *         description: Default activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activity:
 *                   $ref: '#/components/schemas/DefaultActivity'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Default activity not found
 */
router.get('/:id', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  cacheMiddleware({ 
    ttl: 1200, // 20 minutes
    prefix: 'activity-detail'
  }),
  defaultActivityController.getDefaultActivityById
);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create new default activity
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DefaultActivityRequest'
 *     responses:
 *       201:
 *         description: Default activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 activity:
 *                   $ref: '#/components/schemas/DefaultActivity'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', 
  authenticate,
  authorize('system_admin'),
  validate(schemas.defaultActivity),
  createInvalidationMiddleware('DefaultActivity', { operation: 'create' }),
  defaultActivityController.createDefaultActivity
);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update default activity
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Default activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DefaultActivityRequest'
 *     responses:
 *       200:
 *         description: Default activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 activity:
 *                   $ref: '#/components/schemas/DefaultActivity'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Default activity not found
 */
router.put('/:id', 
  authenticate,
  authorize('system_admin'),
  validate(schemas.defaultActivity),
  createInvalidationMiddleware('DefaultActivity', { operation: 'update' }),
  defaultActivityController.updateDefaultActivity
);

/**
 * @swagger
 * /api/activities/{id}/status:
 *   patch:
 *     summary: Toggle default activity status
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Default activity ID
 *     responses:
 *       200:
 *         description: Activity status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 activity:
 *                   $ref: '#/components/schemas/DefaultActivity'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Default activity not found
 */
router.patch('/:id/status', 
  authenticate,
  authorize('system_admin'),
  defaultActivityController.toggleActivityStatus
);

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Delete default activity
 *     tags: [Default Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Default activity ID
 *     responses:
 *       200:
 *         description: Default activity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Default activity not found
 */
router.delete('/:id', 
  authenticate,
  authorize('system_admin'),
  createInvalidationMiddleware('DefaultActivity', { operation: 'delete' }),
  defaultActivityController.deleteDefaultActivity
);

module.exports = router;