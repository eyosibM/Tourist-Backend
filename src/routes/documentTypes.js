const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const documentTypeController = require('../controllers/documentTypeController');

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentType:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         document_type_name:
 *           type: string
 *         description:
 *           type: string
 *         is_required:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         created_date:
 *           type: string
 *           format: date-time
 *     DocumentTypeRequest:
 *       type: object
 *       required:
 *         - document_type_name
 *       properties:
 *         document_type_name:
 *           type: string
 *         description:
 *           type: string
 *         is_required:
 *           type: boolean
 *         is_active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/document-types:
 *   get:
 *     summary: Get all document types
 *     tags: [Document Types]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: is_required
 *         schema:
 *           type: boolean
 *         description: Filter by required status
 *     responses:
 *       200:
 *         description: Document types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentType'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  documentTypeController.getAllDocumentTypes
);

/**
 * @swagger
 * /api/document-types/active:
 *   get:
 *     summary: Get active document types for selection
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active document types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentTypes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentType'
 *       401:
 *         description: Unauthorized
 */
router.get('/active', 
  authenticate,
  documentTypeController.getActiveDocumentTypes
);

/**
 * @swagger
 * /api/document-types/{id}:
 *   get:
 *     summary: Get document type by ID
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type ID
 *     responses:
 *       200:
 *         description: Document type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentType:
 *                   $ref: '#/components/schemas/DocumentType'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document type not found
 */
router.get('/:id', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  documentTypeController.getDocumentTypeById
);

/**
 * @swagger
 * /api/document-types:
 *   post:
 *     summary: Create new document type
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentTypeRequest'
 *     responses:
 *       201:
 *         description: Document type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentType:
 *                   $ref: '#/components/schemas/DocumentType'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Document type name already exists
 */
router.post('/', 
  authenticate,
  authorize('system_admin'),
  validate(schemas.documentType),
  documentTypeController.createDocumentType
);

/**
 * @swagger
 * /api/document-types/{id}:
 *   put:
 *     summary: Update document type
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentTypeRequest'
 *     responses:
 *       200:
 *         description: Document type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentType:
 *                   $ref: '#/components/schemas/DocumentType'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document type not found
 *       409:
 *         description: Document type name already exists
 */
router.put('/:id', 
  authenticate,
  authorize('system_admin'),
  validate(schemas.documentType),
  documentTypeController.updateDocumentType
);

/**
 * @swagger
 * /api/document-types/{id}/status:
 *   patch:
 *     summary: Toggle document type status
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type ID
 *     responses:
 *       200:
 *         description: Document type status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentType:
 *                   $ref: '#/components/schemas/DocumentType'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document type not found
 */
router.patch('/:id/status', 
  authenticate,
  authorize('system_admin'),
  documentTypeController.toggleDocumentTypeStatus
);

/**
 * @swagger
 * /api/document-types/{id}:
 *   delete:
 *     summary: Delete document type
 *     tags: [Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type ID
 *     responses:
 *       200:
 *         description: Document type deleted successfully
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
 *         description: Document type not found
 */
router.delete('/:id', 
  authenticate,
  authorize('system_admin'),
  documentTypeController.deleteDocumentType
);

module.exports = router;