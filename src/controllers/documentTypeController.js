const DocumentType = require('../models/DocumentType');
const { paginate, buildPaginationResponse } = require('../utils/helpers');

// Get all document types
const getAllDocumentTypes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, is_active, is_required } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { document_type_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    if (is_required !== undefined) {
      query.is_required = is_required === 'true';
    }

    const documentTypes = await DocumentType.find(query)
      .populate('created_by', 'first_name last_name')
      .skip(skip)
      .limit(limitNum)
      .sort({ document_type_name: 1 });

    const total = await DocumentType.countDocuments(query);

    res.json(buildPaginationResponse(documentTypes, total, page, limit));
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({ error: 'Failed to fetch document types' });
  }
};

// Get document type by ID
const getDocumentTypeById = async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id)
      .populate('created_by', 'first_name last_name');
    
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }

    res.json({ documentType });
  } catch (error) {
    console.error('Get document type error:', error);
    res.status(500).json({ error: 'Failed to fetch document type' });
  }
};

// Create new document type
const createDocumentType = async (req, res) => {
  try {
    const documentTypeData = {
      ...req.body,
      created_by: req.user._id
    };

    const documentType = new DocumentType(documentTypeData);
    await documentType.save();

    const populatedDocumentType = await DocumentType.findById(documentType._id)
      .populate('created_by', 'first_name last_name email');

    res.status(201).json({
      message: 'Document type created successfully',
      documentType: populatedDocumentType
    });
  } catch (error) {
    console.error('Create document type error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Document type name already exists' });
    }
    res.status(500).json({ error: 'Failed to create document type' });
  }
};

// Update document type
const updateDocumentType = async (req, res) => {
  try {
    const documentType = await DocumentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('created_by', 'first_name last_name email');

    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }

    res.json({
      message: 'Document type updated successfully',
      documentType
    });
  } catch (error) {
    console.error('Update document type error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Document type name already exists' });
    }
    res.status(500).json({ error: 'Failed to update document type' });
  }
};

// Toggle document type status
const toggleDocumentTypeStatus = async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }

    documentType.is_active = !documentType.is_active;
    await documentType.save();

    const populatedDocumentType = await DocumentType.findById(documentType._id)
      .populate('created_by', 'first_name last_name email');

    res.json({
      message: `Document type ${documentType.is_active ? 'activated' : 'deactivated'} successfully`,
      documentType: populatedDocumentType
    });
  } catch (error) {
    console.error('Toggle document type status error:', error);
    res.status(500).json({ error: 'Failed to update document type status' });
  }
};

// Delete document type
const deleteDocumentType = async (req, res) => {
  try {
    const documentType = await DocumentType.findByIdAndDelete(req.params.id);
    
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }

    res.json({ message: 'Document type deleted successfully' });
  } catch (error) {
    console.error('Delete document type error:', error);
    res.status(500).json({ error: 'Failed to delete document type' });
  }
};

// Get active document types for selection
const getActiveDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.find({ is_active: true })
      .select('document_type_name description is_required')
      .sort({ document_type_name: 1 });

    res.json({ documentTypes });
  } catch (error) {
    console.error('Get active document types error:', error);
    res.status(500).json({ error: 'Failed to fetch active document types' });
  }
};

module.exports = {
  getAllDocumentTypes,
  getDocumentTypeById,
  createDocumentType,
  updateDocumentType,
  toggleDocumentTypeStatus,
  deleteDocumentType,
  getActiveDocumentTypes
};