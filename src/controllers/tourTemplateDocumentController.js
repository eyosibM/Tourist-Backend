const TourTemplateDocument = require('../models/TourTemplateDocument');
const TourTemplate = require('../models/TourTemplate');
const ImageUploadService = require('../services/imageUploadService');
const mongoose = require('mongoose');

/**
 * Get all tour template documents with filtering and pagination
 */
const getTourTemplateDocuments = async (req, res) => {
  try {
    const {
      tour_template_id,
      document_type,
      is_public,
      uploaded_by,
      search,
      page = 1,
      limit = 50,
      sort = '-created_date'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (tour_template_id) {
      if (!mongoose.Types.ObjectId.isValid(tour_template_id)) {
        return res.status(400).json({ error: 'Invalid tour template ID' });
      }
      filter.tour_template_id = tour_template_id;
    }
    
    if (document_type) {
      filter.document_type = document_type;
    }
    
    if (is_public !== undefined) {
      filter.is_public = is_public === 'true';
    }
    
    if (uploaded_by) {
      if (!mongoose.Types.ObjectId.isValid(uploaded_by)) {
        return res.status(400).json({ error: 'Invalid uploader ID' });
      }
      filter.uploaded_by = uploaded_by;
    }
    
    if (search) {
      filter.$or = [
        { document_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
    const documents = await TourTemplateDocument.find(filter)
      .populate('template', 'template_name description')
      .populate('uploader', 'email first_name last_name user_type')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await TourTemplateDocument.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tour template documents:', error);
    res.status(500).json({ error: 'Failed to fetch tour template documents' });
  }
};

/**
 * Get tour template documents for a specific template
 */
const getTourTemplateDocumentsByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { document_type, is_public, page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if template exists
    const template = await TourTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Tour template not found' });
    }

    // Build filter
    const filter = { tour_template_id: templateId };
    
    if (document_type) {
      filter.document_type = document_type;
    }
    
    if (is_public !== undefined) {
      filter.is_public = is_public === 'true';
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const documents = await TourTemplateDocument.find(filter)
      .populate('uploader', 'email first_name last_name user_type')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await TourTemplateDocument.countDocuments(filter);

    res.json({
      documents,
      template: {
        id: template._id,
        name: template.template_name,
        description: template.description
      },
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching tour template documents by template:', error);
    res.status(500).json({ error: 'Failed to fetch tour template documents for template' });
  }
};

/**
 * Get a single tour template document by ID
 */
const getTourTemplateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourTemplateDocument.findById(id)
      .populate('template', 'template_name description')
      .populate('uploader', 'email first_name last_name user_type');

    if (!document) {
      return res.status(404).json({ error: 'Tour template document not found' });
    }

    // Check access permissions
    if (!document.canAccess(req.user)) {
      return res.status(403).json({ error: 'Access denied to this document' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Error fetching tour template document:', error);
    res.status(500).json({ error: 'Failed to fetch tour template document' });
  }
};

/**
 * Upload a new tour template document
 */
const uploadTourTemplateDocument = async (req, res) => {
  try {
    const {
      tour_template_id,
      document_name,
      description,
      document_type = 'general',
      is_public = true
    } = req.body;

    // Validate required fields
    if (!tour_template_id || !document_name) {
      return res.status(400).json({ 
        error: 'Tour template ID and document name are required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Validate template ID
    if (!mongoose.Types.ObjectId.isValid(tour_template_id)) {
      return res.status(400).json({ error: 'Invalid tour template ID' });
    }

    // Check if template exists
    const template = await TourTemplate.findById(tour_template_id);
    if (!template) {
      return res.status(404).json({ error: 'Tour template not found' });
    }

    // Upload file to S3
    const uploadResult = await ImageUploadService.uploadImageBuffer(
      req.file.buffer,
      req.file.originalname,
      'tour-template-documents',
      req.file.mimetype
    );

    // Create document record
    const documentData = {
      tour_template_id,
      document_name: document_name.trim(),
      description: description ? description.trim() : '',
      document_url: uploadResult,
      document_type,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      is_public: is_public === 'true' || is_public === true,
      uploaded_by: req.user._id
    };

    const document = new TourTemplateDocument(documentData);
    await document.save();

    // Populate the document for response
    await document.populate('template', 'template_name description');
    await document.populate('uploader', 'email first_name last_name user_type');

    res.status(201).json({
      message: 'Tour template document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Error uploading tour template document:', error);
    
    // Clean up uploaded file if document creation failed
    if (req.file && error.name !== 'ValidationError' && uploadResult) {
      try {
        await ImageUploadService.deleteImage(uploadResult);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload tour template document' });
  }
};

/**
 * Update a tour template document
 */
const updateTourTemplateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      document_name,
      description,
      document_type,
      is_public
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourTemplateDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Tour template document not found' });
    }

    // Check permissions - only uploader, system admin, or provider admin can update
    if (document.uploaded_by.toString() !== req.user._id.toString() && 
        req.user.user_type !== 'system_admin' && 
        req.user.user_type !== 'provider_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    const updateData = {};
    if (document_name) updateData.document_name = document_name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (document_type) updateData.document_type = document_type;
    if (is_public !== undefined) updateData.is_public = is_public === 'true' || is_public === true;

    const updatedDocument = await TourTemplateDocument.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('template', 'template_name description')
     .populate('uploader', 'email first_name last_name user_type');

    res.json({
      message: 'Tour template document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error updating tour template document:', error);
    res.status(500).json({ error: 'Failed to update tour template document' });
  }
};

/**
 * Delete a tour template document
 */
const deleteTourTemplateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourTemplateDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Tour template document not found' });
    }

    // Check permissions - only uploader, system admin, or provider admin can delete
    if (document.uploaded_by.toString() !== req.user._id.toString() && 
        req.user.user_type !== 'system_admin' && 
        req.user.user_type !== 'provider_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from S3
    try {
      await ImageUploadService.deleteImage(document.document_url);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete document from database
    await TourTemplateDocument.findByIdAndDelete(id);

    res.json({ 
      message: 'Tour template document deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting tour template document:', error);
    res.status(500).json({ error: 'Failed to delete tour template document' });
  }
};

/**
 * Get public tour template documents
 */
const getPublicTourTemplateDocuments = async (req, res) => {
  try {
    const {
      tour_template_id,
      document_type,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter for public documents only
    const filter = { is_public: true };
    
    if (tour_template_id) {
      if (!mongoose.Types.ObjectId.isValid(tour_template_id)) {
        return res.status(400).json({ error: 'Invalid tour template ID' });
      }
      filter.tour_template_id = tour_template_id;
    }
    
    if (document_type) {
      filter.document_type = document_type;
    }
    
    if (search) {
      filter.$or = [
        { document_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const documents = await TourTemplateDocument.find(filter)
      .populate('template', 'template_name description')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await TourTemplateDocument.countDocuments(filter);

    res.json({
      documents,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching public tour template documents:', error);
    res.status(500).json({ error: 'Failed to fetch public tour template documents' });
  }
};

module.exports = {
  getTourTemplateDocuments,
  getTourTemplateDocumentsByTemplate,
  getTourTemplateDocument,
  uploadTourTemplateDocument,
  updateTourTemplateDocument,
  deleteTourTemplateDocument,
  getPublicTourTemplateDocuments
};