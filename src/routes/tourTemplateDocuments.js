const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTourTemplateDocuments,
  getTourTemplateDocumentsByTemplate,
  getTourTemplateDocument,
  uploadTourTemplateDocument,
  updateTourTemplateDocument,
  deleteTourTemplateDocument,
  getPublicTourTemplateDocuments
} = require('../controllers/tourTemplateDocumentController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, text, and image files are allowed.'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     TourTemplateDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tour_template_id:
 *           type: string
 *         document_name:
 *           type: string
 *         document_url:
 *           type: string
 *         document_type:
 *           type: string
 *         file_size:
 *           type: number
 *         file_type:
 *           type: string
 *         is_public:
 *           type: boolean
 *         upload_date:
 *           type: string
 *           format: date-time
 *         uploaded_by:
 *           type: string
 */

/**
 * @swagger
 * /api/tour-template-documents:
 *   get:
 *     summary: Get tour template documents
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tour_template_id
 *         schema:
 *           type: string
 *         description: Filter by tour template ID
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *         description: Filter by public status
 *     responses:
 *       200:
 *         description: List of tour template documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TourTemplateDocument'
 */
router.get('/', authenticate, getTourTemplateDocuments);

/**
 * @swagger
 * /api/tour-template-documents/template/{templateId}:
 *   get:
 *     summary: Get tour template documents for a specific template
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour template ID
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *         description: Filter by public status
 *     responses:
 *       200:
 *         description: List of tour template documents for the template
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TourTemplateDocument'
 *       404:
 *         description: Template not found
 */
router.get('/template/:templateId', authenticate, getTourTemplateDocumentsByTemplate);

/**
 * @swagger
 * /api/tour-template-documents/{id}:
 *   get:
 *     summary: Get tour template document by ID
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour template document ID
 *     responses:
 *       200:
 *         description: Tour template document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TourTemplateDocument'
 *       404:
 *         description: Tour template document not found
 */
/**
 * @swagger
 * /api/tour-template-documents/public:
 *   get:
 *     summary: Get public tour template documents
 *     tags: [Tour Template Documents]
 *     parameters:
 *       - in: query
 *         name: tour_template_id
 *         schema:
 *           type: string
 *         description: Filter by tour template ID
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: List of public tour template documents
 */
router.get('/public', getPublicTourTemplateDocuments);

router.get('/:id', authenticate, getTourTemplateDocument);

/**
 * @swagger
 * /api/tour-template-documents/upload:
 *   post:
 *     summary: Upload a new tour template document
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               tour_template_id:
 *                 type: string
 *               document_name:
 *                 type: string
 *               document_type:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tour template document uploaded successfully
 */
router.post('/upload', authenticate, authorize('system_admin', 'provider_admin'), upload.single('file'), uploadTourTemplateDocument);

/**
 * @swagger
 * /api/tour-template-documents/{id}:
 *   put:
 *     summary: Update tour template document
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour template document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_name:
 *                 type: string
 *               document_type:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tour template document updated successfully
 */
router.put('/:id', authenticate, authorize('system_admin', 'provider_admin'), updateTourTemplateDocument);

/**
 * @swagger
 * /api/tour-template-documents/{id}:
 *   delete:
 *     summary: Delete tour template document
 *     tags: [Tour Template Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour template document ID
 *     responses:
 *       200:
 *         description: Tour template document deleted successfully
 */
router.delete('/:id', authenticate, authorize('system_admin', 'provider_admin'), deleteTourTemplateDocument);

module.exports = router;