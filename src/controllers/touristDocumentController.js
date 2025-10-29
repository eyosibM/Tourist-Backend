const TouristDocument = require('../models/TouristDocument');
const DocumentType = require('../models/DocumentType');
const User = require('../models/User');
const CustomTour = require('../models/CustomTour');
const Registration = require('../models/Registration');
// File upload is handled by multer middleware

/**
 * Get tourist documents with filtering
 */
const getTouristDocuments = async (req, res) => {
  try {
    const { tourist_id, custom_tour_id, document_type_id, registration_id } = req.query;
    const filter = {};

    // Build filter based on query parameters
    if (tourist_id) filter.tourist_id = tourist_id;
    if (custom_tour_id) filter.custom_tour_id = custom_tour_id;
    if (document_type_id) filter.document_type_id = document_type_id;
    if (registration_id) filter.registration_id = registration_id;

    // For tourists, only show their own documents
    if (req.user.user_type === 'tourist') {
      filter.tourist_id = req.user.id;
    }

    const documents = await TouristDocument.find(filter)
      .populate('tourist_id', 'first_name last_name email')
      .populate('document_type_id', 'document_type_name description is_required')
      .populate('custom_tour_id', 'tour_name')
      .populate('uploaded_by', 'first_name last_name email')
      .sort({ created_date: -1 });

    // Transform for frontend compatibility
    const transformedDocuments = documents.map(doc => ({
      id: doc._id,
      tourist_id: doc.tourist_id._id,
      custom_tour_id: doc.custom_tour_id._id,
      registration_id: doc.registration_id,
      document_type_id: doc.document_type_id._id,
      document_type_name: doc.document_type_id.document_type_name,
      document_name: doc.file_name,
      file_name: doc.file_name,
      document_url: doc.file_url,
      file_url: doc.file_url,
      file_size: doc.file_size,
      upload_date: doc.created_date,
      created_date: doc.created_date,
      updated_date: doc.updated_date,
      notes: doc.notes,
      // Populated data
      tourist: doc.tourist_id ? {
        id: doc.tourist_id._id,
        first_name: doc.tourist_id.first_name,
        last_name: doc.tourist_id.last_name,
        email: doc.tourist_id.email
      } : null,
      document_type: doc.document_type_id ? {
        id: doc.document_type_id._id,
        document_type_name: doc.document_type_id.document_type_name,
        description: doc.document_type_id.description,
        is_required: doc.document_type_id.is_required
      } : null,
      custom_tour: doc.custom_tour_id ? {
        id: doc.custom_tour_id._id,
        tour_name: doc.custom_tour_id.tour_name
      } : null
    }));

    res.json(transformedDocuments);
  } catch (error) {
    console.error('Error fetching tourist documents:', error);
    res.status(500).json({ error: 'Failed to fetch tourist documents' });
  }
};

/**
 * Upload a new tourist document
 */
const uploadTouristDocument = async (req, res) => {
  try {
    const { document_type_id, document_name, tourist_id, custom_tour_id, notes } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!document_type_id) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Determine the tourist ID
    let targetTouristId = tourist_id;
    if (req.user.user_type === 'tourist') {
      // Tourists can only upload for themselves
      targetTouristId = req.user.id;
    } else if (!tourist_id) {
      return res.status(400).json({ error: 'Tourist ID is required for provider uploads' });
    }

    // Validate document type exists
    const documentType = await DocumentType.findById(document_type_id);
    if (!documentType) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Find registration if custom_tour_id is provided
    let registrationId = null;
    if (custom_tour_id) {
      const registration = await Registration.findOne({
        tourist_id: targetTouristId,
        custom_tour_id: custom_tour_id
      });
      if (registration) {
        registrationId = registration._id;
      }
    }

    // File is already uploaded by multer middleware
    // Get the file URL from the uploaded file
    const fileUrl = file.location || file.path;

    // Create tourist document record
    const touristDocument = new TouristDocument({
      tourist_id: targetTouristId,
      custom_tour_id: custom_tour_id || null,
      registration_id: registrationId,
      document_type_id: document_type_id,
      document_type_name: documentType.document_type_name,
      file_name: document_name || file.originalname,
      file_url: fileUrl,
      file_size: file.size,
      uploaded_by: req.user.id,
      created_by: req.user.id,
      notes: notes || ''
    });

    await touristDocument.save();

    // Populate for response
    await touristDocument.populate([
      { path: 'tourist_id', select: 'first_name last_name email' },
      { path: 'document_type_id', select: 'document_type_name description is_required' },
      { path: 'custom_tour_id', select: 'tour_name' }
    ]);

    // Transform for frontend compatibility
    const transformedDocument = {
      id: touristDocument._id,
      tourist_id: touristDocument.tourist_id._id,
      custom_tour_id: touristDocument.custom_tour_id?._id,
      registration_id: touristDocument.registration_id,
      document_type_id: touristDocument.document_type_id._id,
      document_type_name: touristDocument.document_type_id.document_type_name,
      document_name: touristDocument.file_name,
      file_name: touristDocument.file_name,
      document_url: touristDocument.file_url,
      file_url: touristDocument.file_url,
      file_size: touristDocument.file_size,
      upload_date: touristDocument.created_date,
      created_date: touristDocument.created_date,
      updated_date: touristDocument.updated_date,
      notes: touristDocument.notes
    };

    res.status(201).json(transformedDocument);
  } catch (error) {
    console.error('Error uploading tourist document:', error);
    res.status(500).json({ error: 'Failed to upload tourist document' });
  }
};

/**
 * Get a specific tourist document
 */
const getTouristDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await TouristDocument.findById(id)
      .populate('tourist_id', 'first_name last_name email')
      .populate('document_type_id', 'document_type_name description is_required')
      .populate('custom_tour_id', 'tour_name')
      .populate('uploaded_by', 'first_name last_name email');

    if (!document) {
      return res.status(404).json({ error: 'Tourist document not found' });
    }

    // Check permissions
    if (req.user.user_type === 'tourist' && document.tourist_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Transform for frontend compatibility
    const transformedDocument = {
      id: document._id,
      tourist_id: document.tourist_id._id,
      custom_tour_id: document.custom_tour_id?._id,
      registration_id: document.registration_id,
      document_type_id: document.document_type_id._id,
      document_type_name: document.document_type_id.document_type_name,
      document_name: document.file_name,
      file_name: document.file_name,
      document_url: document.file_url,
      file_url: document.file_url,
      file_size: document.file_size,
      upload_date: document.created_date,
      created_date: document.created_date,
      updated_date: document.updated_date,
      notes: document.notes,
      // Populated data
      tourist: {
        id: document.tourist_id._id,
        first_name: document.tourist_id.first_name,
        last_name: document.tourist_id.last_name,
        email: document.tourist_id.email
      },
      document_type: {
        id: document.document_type_id._id,
        document_type_name: document.document_type_id.document_type_name,
        description: document.document_type_id.description,
        is_required: document.document_type_id.is_required
      }
    };

    res.json(transformedDocument);
  } catch (error) {
    console.error('Error fetching tourist document:', error);
    res.status(500).json({ error: 'Failed to fetch tourist document' });
  }
};

/**
 * Delete a tourist document
 */
const deleteTouristDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await TouristDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Tourist document not found' });
    }

    // Check permissions
    if (req.user.user_type === 'tourist' && document.tourist_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await TouristDocument.findByIdAndDelete(id);
    res.json({ message: 'Tourist document deleted successfully' });
  } catch (error) {
    console.error('Error deleting tourist document:', error);
    res.status(500).json({ error: 'Failed to delete tourist document' });
  }
};

/**
 * Update a tourist document
 */
const updateTouristDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { document_name, notes } = req.body;

    const document = await TouristDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Tourist document not found' });
    }

    // Check permissions
    if (req.user.user_type === 'tourist' && document.tourist_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update allowed fields
    if (document_name) document.file_name = document_name;
    if (notes !== undefined) document.notes = notes;

    await document.save();

    // Populate for response
    await document.populate([
      { path: 'tourist_id', select: 'first_name last_name email' },
      { path: 'document_type_id', select: 'document_type_name description is_required' },
      { path: 'custom_tour_id', select: 'tour_name' }
    ]);

    // Transform for frontend compatibility
    const transformedDocument = {
      id: document._id,
      tourist_id: document.tourist_id._id,
      custom_tour_id: document.custom_tour_id?._id,
      registration_id: document.registration_id,
      document_type_id: document.document_type_id._id,
      document_type_name: document.document_type_id.document_type_name,
      document_name: document.file_name,
      file_name: document.file_name,
      document_url: document.file_url,
      file_url: document.file_url,
      file_size: document.file_size,
      upload_date: document.created_date,
      created_date: document.created_date,
      updated_date: document.updated_date,
      notes: document.notes
    };

    res.json(transformedDocument);
  } catch (error) {
    console.error('Error updating tourist document:', error);
    res.status(500).json({ error: 'Failed to update tourist document' });
  }
};

module.exports = {
  getTouristDocuments,
  uploadTouristDocument,
  getTouristDocument,
  deleteTouristDocument,
  updateTouristDocument
};