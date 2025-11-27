const CustomTour = require('../models/CustomTour');
const TourTemplate = require('../models/TourTemplate');
const CalendarEntry = require('../models/CalendarEntry');
const Registration = require('../models/Registration');
const QRCodeService = require('../services/qrCodeService');
const NotificationService = require('../services/notificationService');
const { paginate, buildPaginationResponse, generateJoinCode, createTourUpdate } = require('../utils/helpers');

// Helper function to check provider access
const checkProviderAccess = (user, tour) => {
  if (user.user_type !== 'provider_admin') {
    return true; // System admins and other users pass through
  }
  
  const userProviderId = user.provider_id?._id || user.provider_id?.id || user.provider_id;
  const tourProviderId = tour.provider_id?._id || tour.provider_id?.id || tour.provider_id;
  
  return userProviderId?.toString() === tourProviderId?.toString();
};

// Get all custom tours
const getAllCustomTours = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, provider_id } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    console.log('🔍 getAllCustomTours called with query params:', req.query);
    console.log('👤 User type:', req.user.user_type);

    // Build query based on user role
    const query = {};
    if (req.user.user_type === 'provider_admin') {
      query.provider_id = req.user.provider_id;
    } else if (req.user.user_type === 'tourist') {
      // Check if searching by join_code (for private tours)
      const { join_code } = req.query;
      console.log('🔑 Join code from query:', join_code);
      if (join_code) {
        // If searching by join_code, allow access to both public and private tours
        query.join_code = join_code.toUpperCase();
        console.log('✅ Searching by join code:', query.join_code);
      } else {
        // Otherwise, tourists can only see public tours
        query.viewAccessibility = 'public';
        console.log('👁️ Filtering for public tours only');
      }
    }
    
    console.log('📋 Final MongoDB query:', JSON.stringify(query, null, 2));
    
    if (search && !req.query.join_code) {
      query.$or = [
        { tour_name: { $regex: search, $options: 'i' } },
        { join_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (provider_id && req.user.user_type === 'system_admin') {
      query.provider_id = provider_id;
    }

    const tours = await CustomTour.find(query)
      .populate('provider_id', 'provider_name')
      .populate('tour_template_id', 'template_name')
      .populate('created_by', 'first_name last_name')
      .skip(skip)
      .limit(limitNum)
      .sort({ created_date: -1 });

    const total = await CustomTour.countDocuments(query);

    console.log(`📊 Found ${tours.length} tours matching query`);
    if (tours.length > 0) {
      console.log('🎯 Tours found:', tours.map(t => ({
        name: t.tour_name,
        join_code: t.join_code,
        viewAccessibility: t.viewAccessibility
      })));
    }

    res.json(buildPaginationResponse(tours, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch custom tours' });
  }
};

// Get custom tour by ID
const getCustomTourById = async (req, res) => {
  try {
    const tour = await CustomTour.findById(req.params.id)
      .populate('provider_id')
      .populate('tour_template_id')
      .populate('created_by', 'first_name last_name');
    
    if (!tour) {
      return res.status(404).json({ error: 'Custom tour not found' });
    }

    // Check access permissions
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check viewAccessibility for tourists
    if (req.user.user_type === 'tourist' && tour.viewAccessibility === 'private') {
      // Check if user has access through registration or join code
      const hasAccess = await Registration.findOne({
        custom_tour_id: req.params.id,
        tourist_id: req.user._id
      });
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'This tour is private. You need the join code to access it.' 
        });
      }
    }

    // Get calendar entries for this tour
    const calendarEntries = await CalendarEntry.find({ 
      custom_tour_id: req.params.id 
    }).sort({ entry_date: 1, start_time: 1 });

    // Get registrations count
    const registrationsCount = await Registration.countDocuments({
      custom_tour_id: req.params.id,
      status: 'approved'
    });

    res.json({ 
      tour,
      calendar_entries: calendarEntries,
      registrations_count: registrationsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch custom tour' });
  }
};

// Create new custom tour
const createCustomTour = async (req, res) => {
  try {
    const tourData = req.body;
    
    // Set provider_id based on user role
    if (req.user.user_type === 'provider_admin') {
      tourData.provider_id = req.user.provider_id;
    }

    // Validate tour template exists and is active
    const template = await TourTemplate.findOne({
      _id: tourData.tour_template_id,
      is_active: true
    });

    if (!template) {
      return res.status(400).json({ error: 'Invalid or inactive tour template' });
    }
    console.log(`📋 Creating tour from template: ${template.template_name}`);

    // Inherit visibility from template's viewAccessibility
    // If template is public, custom tour is public (visible in Find Tour)
    // If template is private, custom tour is private (only via join code/invite)
    if (template.viewAccessibility === 'public') {
      tourData.visibility = 'public';
    } else if (template.viewAccessibility === 'private') {
      tourData.visibility = 'private';
    }

    // Use provided join code or generate a unique one if not provided
    if (!tourData.join_code || tourData.join_code.trim() === '') {
      let joinCode;
      let isUnique = false;
      while (!isUnique) {
        joinCode = generateJoinCode();
        const existing = await CustomTour.findOne({ join_code: joinCode });
        if (!existing) isUnique = true;
      }
      tourData.join_code = joinCode;
    } else {
      // Validate uniqueness of provided join code
      const existing = await CustomTour.findOne({ join_code: tourData.join_code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ error: 'Join code already exists. Please choose a different code.' });
      }
      tourData.join_code = tourData.join_code.toUpperCase();
    }
    tourData.created_by = req.user._id;

    // Get default max tourists from PaymentConfig
    const PaymentConfig = require('../models/PaymentConfig');
    const config = await PaymentConfig.findOne({ config_key: 'default' });
    if (!tourData.max_tourists) {
      tourData.max_tourists = config?.default_max_tourists || 5;
    }
    tourData.remaining_tourists = tourData.max_tourists;

    const tour = new CustomTour(tourData);
    await tour.save();

    // Copy calendar entries from template
    if (tourData.tour_template_id) {
      const templateEntries = await CalendarEntry.find({ 
        tour_template_id: tourData.tour_template_id 
      });

      const tourEntries = templateEntries.map(entry => ({
        custom_tour_id: tour._id,
        entry_date: entry.entry_date,
        activity: entry.activity,
        activity_description: entry.activity_description,
        activity_details: entry.activity_details,
        web_links: entry.web_links,
        start_time: entry.start_time,
        end_time: entry.end_time,
        created_by: req.user._id
      }));

      if (tourEntries.length > 0) {
        await CalendarEntry.insertMany(tourEntries);
      }
    }

    const populatedTour = await CustomTour.findById(tour._id)
      .populate('provider_id', 'provider_name')
      .populate('tour_template_id', 'template_name');

    // Generate QR codes asynchronously (don't wait for completion)
    setImmediate(async () => {
      try {
        const qrCodeUrl = await QRCodeService.generateTourQRCode(populatedTour, 'custom');
        const joinQrCodeUrl = await QRCodeService.generateJoinQRCode(populatedTour);
        
        // Update tour with QR code URLs
        await CustomTour.findByIdAndUpdate(tour._id, {
          qr_code_url: qrCodeUrl,
          join_qr_code_url: joinQrCodeUrl,
          qr_code_generated_at: new Date()
        });

        // Send notification to provider admins
        await NotificationService.notifyQRCodeGenerated(populatedTour, qrCodeUrl, 'custom');
      } catch (error) {
        console.error('Error generating QR codes for new tour:', error);
      }
    });

    res.status(201).json({
      message: 'Custom tour created successfully',
      tour: populatedTour
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create custom tour' });
  }
};

// Update custom tour
const updateCustomTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const updates = req.body;

    console.log('🔄 updateCustomTour called:', {
      tourId,
      hasJoinCode: !!updates.join_code,
      joinCodeValue: updates.join_code,
      updateKeys: Object.keys(updates)
    });

    // Get current tour
    const currentTour = await CustomTour.findById(tourId);
    if (!currentTour) {
      return res.status(404).json({ error: 'Custom tour not found' });
    }

    console.log('📋 Current tour join_code:', currentTour.join_code);

    // Check access permissions
    if (!checkProviderAccess(req.user, currentTour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow updating provider_id or tour_template_id
    delete updates.provider_id;
    delete updates.tour_template_id;

    // Handle max_tourists change
    if (updates.max_tourists && updates.max_tourists !== currentTour.max_tourists) {
      const approvedRegistrations = await Registration.countDocuments({
        custom_tour_id: tourId,
        status: 'approved'
      });

      updates.remaining_tourists = updates.max_tourists - approvedRegistrations;
    }

    // Validate join_code uniqueness if being updated
    if (updates.join_code && updates.join_code !== currentTour.join_code) {
      // Normalize join code to uppercase
      updates.join_code = updates.join_code.toUpperCase();
      
      // Check if the new join code is already in use by another tour
      const existing = await CustomTour.findOne({ 
        join_code: updates.join_code,
        _id: { $ne: tourId }
      });
      
      if (existing) {
        return res.status(400).json({ 
          error: `Join code "${updates.join_code}" is already in use by another tour. Please choose a different code.` 
        });
      }
      
      console.log(`✅ Join code updated from "${currentTour.join_code}" to "${updates.join_code}" for tour ${tourId}`);
    }

    const tour = await CustomTour.findByIdAndUpdate(
      tourId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('provider_id', 'provider_name')
    .populate('tour_template_id', 'template_name');

    console.log('✅ Tour updated successfully. New join_code:', tour.join_code);

    res.json({
      message: 'Custom tour updated successfully',
      tour
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update custom tour' });
  }
};

// Update tour status
const updateTourStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tourId = req.params.id;

    const tour = await CustomTour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: 'Custom tour not found' });
    }

    // Check access permissions
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle cancelled status
    if (status === 'cancelled') {
      // Cancel all registrations
      await Registration.updateMany(
        { custom_tour_id: tourId },
        { status: 'cancelled' }
      );

      // Update remaining tourists
      tour.remaining_tourists = tour.max_tourists;
    }

    tour.status = status;
    await tour.save();

    res.json({
      message: `Tour status updated to ${status}`,
      tour
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tour status' });
  }
};

// Delete custom tour
const deleteCustomTour = async (req, res) => {
  try {
    const tourId = req.params.id;

    const tour = await CustomTour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ error: 'Custom tour not found' });
    }

    // Check access permissions
    if (!checkProviderAccess(req.user, tour)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete tour and all associated data
    await Promise.all([
      CustomTour.findByIdAndDelete(tourId),
      CalendarEntry.deleteMany({ custom_tour_id: tourId }),
      Registration.deleteMany({ custom_tour_id: tourId }),
      // Add other cleanup operations as needed
    ]);

    res.json({ message: 'Custom tour deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete custom tour' });
  }
};

// Search tour by join code (Tourist)
const searchTourByJoinCode = async (req, res) => {
  try {
    const { join_code } = req.params;

    const tour = await CustomTour.findOne({ 
      join_code: join_code.toUpperCase(),
      status: 'published'
    })
    .populate('provider_id', 'provider_name country')
    .populate('tour_template_id', 'template_name');

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found or not available for registration' });
    }

    // For private tours, having the join code grants access
    // For public tours, anyone can access
    if (tour.viewAccessibility === 'private') {
      // User found the tour with join code, so they have access
      console.log(`User ${req.user._id} accessed private tour ${tour._id} with join code`);
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      custom_tour_id: tour._id,
      tourist_id: req.user._id
    });

    res.json({ 
      tour,
      already_registered: !!existingRegistration,
      registration_status: existingRegistration?.status,
      access_method: tour.viewAccessibility === 'private' ? 'join_code' : 'public'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search tour' });
  }
};

module.exports = {
  getAllCustomTours,
  getCustomTourById,
  createCustomTour,
  updateCustomTour,
  updateTourStatus,
  deleteCustomTour,
  searchTourByJoinCode
};