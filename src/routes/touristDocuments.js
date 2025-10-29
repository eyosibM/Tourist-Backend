const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ImageUploadService = require('../services/imageUploadService');
const {
  getTouristDocuments,
  uploadTouristDocument,
  getTouristDocument,
  deleteTouristDocument,
  updateTouristDocument
} = require('../controllers/touristDocumentController');

// Configure multer for document uploads using ImageUploadService
const allowedDocumentTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const upload = ImageUploadService.createUploadMiddleware(
  'tourist-documents', 
  allowedDocumentTypes, 
  10 * 1024 * 1024 // 10MB limit
);

/**
 * @swagger
 * components:
 *   schemas:
 *     TouristDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tourist_id:
 *           type: string
 *         custom_tour_id:
 *           type: string
 *         document_type_id:
 *           type: string
 *         document_name:
 *           type: string
 *         file_url:
 *           type: string
 *         file_size:
 *           type: number
 *         upload_date:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /api/tourist-documents:
 *   get:
 *     summary: Get tourist documents
 *     tags: [Tourist Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tourist_id
 *         schema:
 *           type: string
 *         description: Filter by tourist ID
 *       - in: query
 *         name: custom_tour_id
 *         schema:
 *           type: string
 *         description: Filter by custom tour ID
 *       - in: query
 *         name: document_type_id
 *         schema:
 *           type: string
 *         description: Filter by document type ID
 *     responses:
 *       200:
 *         description: List of tourist documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TouristDocument'
 */
router.get('/', authenticate, getTouristDocuments);

/**
 * @swagger
 * /api/tourist-documents/upload:
 *   post:
 *     summary: Upload a new tourist document
 *     tags: [Tourist Documents]
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
 *               document_type_id:
 *                 type: string
 *               document_name:
 *                 type: string
 *               tourist_id:
 *                 type: string
 *               custom_tour_id:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tourist document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TouristDocument'
 */
router.post('/upload', authenticate, upload.single('file'), uploadTouristDocument);

/**
 * @swagger
 * /api/tourist-documents/{id}:
 *   get:
 *     summary: Get a specific tourist document
 *     tags: [Tourist Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tourist document ID
 *     responses:
 *       200:
 *         description: Tourist document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TouristDocument'
 */
router.get('/:id', authenticate, getTouristDocument);

/**
 * @swagger
 * /api/tourist-documents/{id}:
 *   put:
 *     summary: Update a tourist document
 *     tags: [Tourist Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tourist document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_name:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tourist document updated successfully
 */
router.put('/:id', authenticate, updateTouristDocument);

/**
 * @swagger
 * /api/tourist-documents/{id}:
 *   delete:
 *     summary: Delete a tourist document
 *     tags: [Tourist Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tourist document ID
 *     responses:
 *       200:
 *         description: Tourist document deleted successfully
 */
router.delete('/:id', authenticate, deleteTouristDocument);

module.exports = router;