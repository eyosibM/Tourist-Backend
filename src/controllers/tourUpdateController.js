const TourUpdate = require('../models/TourUpdate');
const CustomTour = require('../models/CustomTour');
const User = require('../models/User');
const Registration = require('../models/Registration');
const notificationService = require('../services/notificationService');
const { isValidObjectId } = require('../utils/helpers');

/**
 * Get all tour updates with optional filtering and pagination
 */
const getTourUpdates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      custom_tour_id,
      update_type,
      is_published,
      created_by,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (custom_tour_id) {
      if (!isValidObjectId(custom_tour_id)) {
        return res.status(400).json({ error: 'Invalid custom tour ID' });
      }
      filter.custom_tour_id = custom_tour_id;
    }
    
    if (update_type) {
      filter.update_type = update_type;
    }
    
    if (is_published !== undefined) {
      filter.is_published = is_published === 'true';
    }
    
    if (created_by) {
      if (!isValidObjectId(created_by)) {
        return res.status(400).json({ error: 'Invalid created_by user ID' });
      }
      filter.created_by = created_by;
    }
    
    if (search) {
      filter.$or = [
        { update_title: { $regex: search, $options: 'i' } },
        { update_content: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await TourUpdate.countDocuments(filter);
    
    // Get tour updates with population
    const updates = await TourUpdate.find(filter)
      .populate('custom_tour_id', 'tour_name join_code provider_id')
      .populate('created_by', 'email first_name last_name user_type')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      updates,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Error fetching tour updates:', error);
    res.status(500).json({ error: 'Failed to fetch tour updates' });
  }
};

/**
 * Get tour updates for a specific tour
 */
const getTourUpdatesByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const {
      page = 1,
      limit = 10,
      update_type,
      is_published
    } = req.query;

    if (!isValidObjectId(tourId)) {
      return res.status(400).json({ error: 'Invalid tour ID' });
    }

    // Verify tour exists
    const tour = await CustomTour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    // Build filter
    const filter = { custom_tour_id: tourId };
    
    if (update_type) {
      filter.update_type = update_type;
    }
    
    if (is_published !== undefined) {
      filter.is_published = is_published === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await TourUpdate.countDocuments(filter);
    
    // Get tour updates
    const updates = await TourUpdate.find(filter)
      .populate('custom_tour_id', 'tour_name join_code provider_id')
      .populate('created_by', 'email first_name last_name user_type')
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      updates,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Error fetching tour updates by tour:', error);
    res.status(500).json({ error: 'Failed to fetch tour updates' });
  }
};

/**
 * Get single tour update by ID
 */
const getTourUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid tour update ID' });
    }

    const update = await TourUpdate.findById(id)
      .populate('custom_tour_id', 'tour_name join_code provider_id')
      .populate('created_by', 'email first_name last_name user_type');

    if (!update) {
      return res.status(404).json({ error: 'Tour update not found' });
    }

    res.json({ update });
  } catch (error) {
    console.error('Error fetching tour update:', error);
    res.status(500).json({ error: 'Failed to fetch tour update' });
  }
};

/**
 * Create new tour update
 */
const createTourUpdate = async (req, res) => {
  try {
    const {
      custom_tour_id,
      update_title,
      update_content,
      update_type = 'general',
      is_published = false
    } = req.body;

    // Validation
    if (!custom_tour_id || !update_title || !update_content) {
      return res.status(400).json({ 
        error: 'Missing required fields: custom_tour_id, update_title, update_content' 
      });
    }

    if (!isValidObjectId(custom_tour_id)) {
      return res.status(400).json({ error: 'Invalid custom tour ID' });
    }

    // Verify tour exists and user has permission
    const tour = await CustomTour.findById(custom_tour_id).populate('provider_id');
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    // Check permissions - only system admins, provider admins of the tour's provider can create updates
    const user = req.user;
    if (user.user_type !== 'system_admin' && 
        (user.user_type !== 'provider_admin' || user.provider_id?.toString() !== tour.provider_id._id.toString())) {
      return res.status(403).json({ error: 'Insufficient permissions to create tour update' });
    }

    // Create tour update
    const tourUpdate = new TourUpdate({
      custom_tour_id,
      update_title: update_title.trim(),
      update_content: update_content.trim(),
      update_type,
      is_published,
      created_by: user._id,
      published_date: is_published ? new Date() : undefined
    });

    await tourUpdate.save();

    // Populate the created update
    await tourUpdate.populate('custom_tour_id', 'tour_name join_code provider_id');
    await tourUpdate.populate('created_by', 'email first_name last_name user_type');

    // If published, send notifications
    if (is_published) {
      try {
        await sendTourUpdateNotifications(tourUpdate);
      } catch (notificationError) {
        console.error('Error sending tour update notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    res.status(201).json({ update: tourUpdate });
  } catch (error) {
    console.error('Error creating tour update:', error);
    res.status(500).json({ error: 'Failed to create tour update' });
  }
};

/**
 * Update tour update
 */
const updateTourUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      update_title,
      update_content,
      update_type,
      is_published
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid tour update ID' });
    }

    // Find existing update
    const existingUpdate = await TourUpdate.findById(id).populate('custom_tour_id');
    if (!existingUpdate) {
      return res.status(404).json({ error: 'Tour update not found' });
    }

    // Check permissions
    const user = req.user;
    if (user.user_type !== 'system_admin' && 
        (user.user_type !== 'provider_admin' || 
         user.provider_id?.toString() !== existingUpdate.custom_tour_id.provider_id.toString()) &&
        existingUpdate.created_by.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Insufficient permissions to update tour update' });
    }

    // Build update object
    const updateData = {};
    if (update_title !== undefined) updateData.update_title = update_title.trim();
    if (update_content !== undefined) updateData.update_content = update_content.trim();
    if (update_type !== undefined) updateData.update_type = update_type;
    
    // Handle publishing
    const wasPublished = existingUpdate.is_published;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      if (is_published && !wasPublished) {
        updateData.published_date = new Date();
      }
    }

    // Update the tour update
    const updatedTourUpdate = await TourUpdate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('custom_tour_id', 'tour_name join_code provider_id')
      .populate('created_by', 'email first_name last_name user_type');

    // If newly published, send notifications
    if (is_published && !wasPublished) {
      try {
        await sendTourUpdateNotifications(updatedTourUpdate);
      } catch (notificationError) {
        console.error('Error sending tour update notifications:', notificationError);
      }
    }

    res.json({ update: updatedTourUpdate });
  } catch (error) {
    console.error('Error updating tour update:', error);
    res.status(500).json({ error: 'Failed to update tour update' });
  }
};

/**
 * Publish tour update (send notifications)
 */
const publishTourUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid tour update ID' });
    }

    // Find existing update
    const existingUpdate = await TourUpdate.findById(id).populate('custom_tour_id');
    if (!existingUpdate) {
      return res.status(404).json({ error: 'Tour update not found' });
    }

    // Check permissions
    const user = req.user;
    if (user.user_type !== 'system_admin' && 
        (user.user_type !== 'provider_admin' || 
         user.provider_id?.toString() !== existingUpdate.custom_tour_id.provider_id.toString()) &&
        existingUpdate.created_by.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Insufficient permissions to publish tour update' });
    }

    // Check if already published
    if (existingUpdate.is_published) {
      return res.status(400).json({ error: 'Tour update is already published' });
    }

    // Publish the update
    const publishedUpdate = await TourUpdate.findByIdAndUpdate(
      id,
      { 
        is_published: true,
        published_date: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('custom_tour_id', 'tour_name join_code provider_id')
      .populate('created_by', 'email first_name last_name user_type');

    // Send notifications
    try {
      await sendTourUpdateNotifications(publishedUpdate);
    } catch (notificationError) {
      console.error('Error sending tour update notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({ update: publishedUpdate });
  } catch (error) {
    console.error('Error publishing tour update:', error);
    res.status(500).json({ error: 'Failed to publish tour update' });
  }
};

/**
 * Delete tour update
 */
const deleteTourUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid tour update ID' });
    }

    // Find existing update
    const existingUpdate = await TourUpdate.findById(id).populate('custom_tour_id');
    if (!existingUpdate) {
      return res.status(404).json({ error: 'Tour update not found' });
    }

    // Check permissions
    const user = req.user;
    if (user.user_type !== 'system_admin' && 
        (user.user_type !== 'provider_admin' || 
         user.provider_id?.toString() !== existingUpdate.custom_tour_id.provider_id.toString()) &&
        existingUpdate.created_by.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Insufficient permissions to delete tour update' });
    }

    // Delete the tour update
    await TourUpdate.findByIdAndDelete(id);

    res.json({ message: 'Tour update deleted successfully' });
  } catch (error) {
    console.error('Error deleting tour update:', error);
    res.status(500).json({ error: 'Failed to delete tour update' });
  }
};

/**
 * Helper function to send tour update notifications
 */
const sendTourUpdateNotifications = async (tourUpdate) => {
  try {
    // Get all approved registrations for the tour
    const registrations = await Registration.find({
      custom_tour_id: tourUpdate.custom_tour_id._id,
      status: 'approved'
    }).populate('tourist_id', 'email first_name last_name is_active');

    // Send notifications to each tourist
    for (const registration of registrations) {
      const tourist = registration.tourist_id;
      if (tourist && tourist.is_active) {
        try {
          // Create in-app notification
          await notificationService.createNotification({
            userId: tourist._id.toString(),
            title: `Tour Update: ${tourUpdate.update_title}`,
            body: tourUpdate.update_content,
            type: 'tour_update',
            metadata: {
              tour_id: tourUpdate.custom_tour_id._id.toString(),
              tour_name: tourUpdate.custom_tour_id.tour_name,
              update_id: tourUpdate._id.toString(),
              update_type: tourUpdate.update_type
            },
            includeEmail: true
          });
        } catch (notificationError) {
          console.error(`Error sending notification to tourist ${tourist._id}:`, notificationError);
        }
      }
    }

    console.log(`Tour update notifications sent for update: ${tourUpdate._id}`);
  } catch (error) {
    console.error('Error in sendTourUpdateNotifications:', error);
    throw error;
  }
};

module.exports = {
  getTourUpdates,
  getTourUpdatesByTour,
  getTourUpdate,
  createTourUpdate,
  updateTourUpdate,
  publishTourUpdate,
  deleteTourUpdate
};