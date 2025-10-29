const TourDocument = require('../models/TourDocument');
const CustomTour = require('../models/CustomTour');
const { isValidObjectId } = require('../utils/helpers');

// Helper function to check provider access
const checkProviderAccess = (user, tour) => {
  if (user.user_type === 'provider_admin') {
    const userProviderId = user.provider_id?._id || user.provider_id?.id || user.provider_id;
    const tourProviderId = tour.provider_id?._id || tour.provider_id?.id || tour.provider_id;
    
    return userProviderId?.toString() === tourProviderId?.toString();
  }
  return true; // System admins and other users pass through
};

// Get all tour documents
const getTourDocuments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      custom_tour_id,
      is_visible_to_tourists,
      search 
    } = req.query;

    const filter = {};
    
    if (custom_tour_id) {
      if (!isValidObjectId(custom_tour_id)) {
        return res.status(400).json({ error: 'Invalid custom tour ID' });
      }
      filter.custom_tour_id = custom_tour_id;
    }
    
    if (is_visible_to_tourists !== undefined) {
      filter.is_visible_to_tourists = is_visible_to_tourists === 'true';
    }
    
    if (search) {
      filter.$or = [
        { document_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const documents = await TourDocument.find(filter)
      .populate('uploaded_by', 'first_name last_name email')
      .populate('custom_tour_id', 'tour_name')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TourDocument.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching tour documents:', error);
    res.status(500).json({ error: 'Failed to fetch tour documents' });
  }
};

// Get tour documents by tour ID
const getTourDocumentsByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { is_visible_to_tourists } = req.query;

    if (!isValidObjectId(tourId)) {
      return res.status(400).json({ error: 'Invalid tour ID' });
    }

    // Check if tour exists and user has access
    const tour = await CustomTour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filter = { custom_tour_id: tourId };
    
    if (is_visible_to_tourists !== undefined) {
      filter.is_visible_to_tourists = is_visible_to_tourists === 'true';
    }

    const documents = await TourDocument.find(filter)
      .populate('uploaded_by', 'first_name last_name email')
      .sort({ created_date: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching tour documents by tour:', error);
    res.status(500).json({ error: 'Failed to fetch tour documents' });
  }
};

// Get tour document by ID
const getTourDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourDocument.findById(id)
      .populate('uploaded_by', 'first_name last_name email')
      .populate('custom_tour_id', 'tour_name');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access permissions
    const tour = await CustomTour.findById(document.custom_tour_id);
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Error fetching tour document:', error);
    res.status(500).json({ error: 'Failed to fetch tour document' });
  }
};

// Create tour document
const createTourDocument = async (req, res) => {
  try {
    const {
      custom_tour_id,
      document_name,
      description,
      file_name,
      file_url,
      file_size,
      is_visible_to_tourists = true
    } = req.body;

    // Validation
    if (!custom_tour_id || !document_name || !file_name || !file_url) {
      return res.status(400).json({ 
        error: 'Missing required fields: custom_tour_id, document_name, file_name, file_url' 
      });
    }

    if (!isValidObjectId(custom_tour_id)) {
      return res.status(400).json({ error: 'Invalid custom tour ID' });
    }

    // Check if tour exists and user has access
    const tour = await CustomTour.findById(custom_tour_id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = new TourDocument({
      custom_tour_id,
      document_name: document_name.trim(),
      description: description?.trim(),
      file_name: file_name.trim(),
      file_url: file_url.trim(),
      file_size,
      uploaded_by: req.user._id,
      is_visible_to_tourists
    });

    await document.save();

    const populatedDocument = await TourDocument.findById(document._id)
      .populate('uploaded_by', 'first_name last_name email')
      .populate('custom_tour_id', 'tour_name');

    res.status(201).json({
      message: 'Tour document created successfully',
      document: populatedDocument
    });
  } catch (error) {
    console.error('Error creating tour document:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create tour document' });
  }
};

// Update tour document
const updateTourDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access permissions
    const tour = await CustomTour.findById(document.custom_tour_id);
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedDocument = await TourDocument.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('uploaded_by', 'first_name last_name email')
      .populate('custom_tour_id', 'tour_name');

    res.json({
      message: 'Tour document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error updating tour document:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update tour document' });
  }
};

// Delete tour document
const deleteTourDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await TourDocument.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access permissions
    const tour = await CustomTour.findById(document.custom_tour_id);
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await TourDocument.findByIdAndDelete(id);

    res.json({ message: 'Tour document deleted successfully' });
  } catch (error) {
    console.error('Error deleting tour document:', error);
    res.status(500).json({ error: 'Failed to delete tour document' });
  }
};

module.exports = {
  getTourDocuments,
  getTourDocumentsByTour,
  getTourDocumentById,
  createTourDocument,
  updateTourDocument,
  deleteTourDocument
};