const express = require('express');
const router = express.Router();
const {
  getTourDocuments,
  getTourDocumentsByTour,
  getTourDocumentById,
  createTourDocument,
  updateTourDocument,
  deleteTourDocument
} = require('../controllers/tourDocumentController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     TourDocument:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         custom_tour_id:
 *           type: string
 *         document_name:
 *           type: string
 *         description:
 *           type: string
 *         file_name:
 *           type: string
 *         file_url:
 *           type: string
 *         file_size:
 *           type: number
 *         uploaded_by:
 *           type: string
 *         is_visible_to_tourists:
 *           type: boolean
 *         created_date:
 *           type: string
 *           format: date-time
 *         updated_date:
 *           type: string
 *           format: date-time
 */

/**
 * @route GET /api/tour-documents
 * @desc Get all tour documents with optional filtering and pagination
 * @access Private
 */
router.get('/', getTourDocuments);

/**
 * @route GET /api/tour-documents/tour/:tourId
 * @desc Get tour documents by tour ID
 * @access Private
 */
router.get('/tour/:tourId', getTourDocumentsByTour);

/**
 * @route GET /api/tour-documents/:id
 * @desc Get tour document by ID
 * @access Private
 */
router.get('/:id', getTourDocumentById);

/**
 * @route POST /api/tour-documents
 * @desc Create new tour document
 * @access Private (Provider Admin, System Admin)
 */
router.post('/', createTourDocument);

/**
 * @route PUT /api/tour-documents/:id
 * @desc Update tour document
 * @access Private (Provider Admin, System Admin)
 */
router.put('/:id', updateTourDocument);

/**
 * @route DELETE /api/tour-documents/:id
 * @desc Delete tour document
 * @access Private (Provider Admin, System Admin)
 */
router.delete('/:id', deleteTourDocument);

module.exports = router;