const express = require('express');
const router = express.Router();
const {
  getTourUpdates,
  getTourUpdatesByTour,
  getTourUpdate,
  createTourUpdate,
  updateTourUpdate,
  publishTourUpdate,
  deleteTourUpdate
} = require('../controllers/tourUpdateController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/tour-updates
 * @desc Get all tour updates with optional filtering and pagination
 * @access Private
 * @query {string} page - Page number (default: 1)
 * @query {string} limit - Items per page (default: 10)
 * @query {string} custom_tour_id - Filter by tour ID
 * @query {string} update_type - Filter by update type
 * @query {string} is_published - Filter by published status (true/false)
 * @query {string} created_by - Filter by creator user ID
 * @query {string} search - Search in title and content
 */
router.get('/', getTourUpdates);

/**
 * @route GET /api/tour-updates/tour/:tourId
 * @desc Get tour updates for a specific tour
 * @access Private
 * @param {string} tourId - Custom tour ID
 * @query {string} page - Page number (default: 1)
 * @query {string} limit - Items per page (default: 10)
 * @query {string} update_type - Filter by update type
 * @query {string} is_published - Filter by published status (true/false)
 */
router.get('/tour/:tourId', getTourUpdatesByTour);

/**
 * @route GET /api/tour-updates/:id
 * @desc Get single tour update by ID
 * @access Private
 * @param {string} id - Tour update ID
 */
router.get('/:id', getTourUpdate);

/**
 * @route POST /api/tour-updates
 * @desc Create new tour update
 * @access Private (System Admin, Provider Admin)
 * @body {string} custom_tour_id - Tour ID (required)
 * @body {string} update_title - Update title (required)
 * @body {string} update_content - Update content (required)
 * @body {string} update_type - Update type (optional, default: 'general')
 * @body {boolean} is_published - Published status (optional, default: false)
 */
router.post('/', createTourUpdate);

/**
 * @route PUT /api/tour-updates/:id
 * @desc Update tour update
 * @access Private (System Admin, Provider Admin, Creator)
 * @param {string} id - Tour update ID
 * @body {string} update_title - Update title (optional)
 * @body {string} update_content - Update content (optional)
 * @body {string} update_type - Update type (optional)
 * @body {boolean} is_published - Published status (optional)
 */
router.put('/:id', updateTourUpdate);

/**
 * @route PATCH /api/tour-updates/:id/publish
 * @desc Publish tour update (send notifications to tour participants)
 * @access Private (System Admin, Provider Admin, Creator)
 * @param {string} id - Tour update ID
 */
router.patch('/:id/publish', publishTourUpdate);

/**
 * @route DELETE /api/tour-updates/:id
 * @desc Delete tour update
 * @access Private (System Admin, Provider Admin, Creator)
 * @param {string} id - Tour update ID
 */
router.delete('/:id', deleteTourUpdate);

module.exports = router;