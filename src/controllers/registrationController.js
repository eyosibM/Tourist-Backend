const Registration = require('../models/Registration');
const CustomTour = require('../models/CustomTour');
const User = require('../models/User');
const { paginate, buildPaginationResponse } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const NotificationService = require('../services/notificationService');

// Get all registrations
const getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, provider_id, custom_tour_id } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Build query based on user role
    const query = {};
    if (req.user.user_type === 'provider_admin') {
      // Extract provider ID from populated object or use directly if it's a string
      const providerId = req.user.provider_id?._id || req.user.provider_id?.id || req.user.provider_id;
      query.provider_id = providerId;
      
      // Debug: Uncomment to troubleshoot provider_id issues
      // console.log('🔍 Registration Controller Debug:', { userType: req.user.user_type, extractedProviderId: providerId, query });
    } else if (req.user.user_type === 'tourist') {
      query.tourist_id = req.user._id;
    }
    if (status) query.status = status;
    if (provider_id && req.user.user_type === 'system_admin') {
      query.provider_id = provider_id;
    }
    if (custom_tour_id) query.custom_tour_id = custom_tour_id;

    const registrations = await Registration.find(query)
      .populate('custom_tour_id', 'tour_name start_date end_date max_tourists remaining_tourists')
      .populate('tourist_id', 'first_name last_name email')
      .populate('provider_id', 'provider_name')
      .skip(skip)
      .limit(limitNum)
      .sort({ created_date: -1 });

    const total = await Registration.countDocuments(query);

    // Debug: Uncomment to troubleshoot query results
    // console.log('🔍 Registration Query Results:', { query, registrationsFound: registrations.length, totalCount: total });

    res.json(buildPaginationResponse(registrations, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

// Get user's registrations (Tourist)
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      tourist_id: req.user._id 
    })
    .populate('custom_tour_id')
    .populate('provider_id', 'provider_name')
    .sort({ created_date: -1 });

    res.json({ registrations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

// Register for a tour (Tourist)
const registerForTour = async (req, res) => {
  try {
    const { custom_tour_id, notes } = req.body;

    // Check if tour exists and is published
    const tour = await CustomTour.findOne({
      _id: custom_tour_id,
      status: 'published'
    }).populate('provider_id');

    if (!tour) {
      return res.status(404).json({ error: 'Tour not found or not available for registration' });
    }

    // Check if user has an active registration (not cancelled or rejected)
    const existingRegistration = await Registration.findOne({
      custom_tour_id,
      tourist_id: req.user._id,
      status: { $nin: ['cancelled', 'rejected'] } // Allow re-registration if previous was cancelled/rejected
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        error: 'You are already registered for this tour',
        registration_status: existingRegistration.status
      });
    }

    // Create registration
    const registration = new Registration({
      custom_tour_id,
      tourist_id: req.user._id,
      provider_id: tour.provider_id._id,
      notes,
      // Denormalized fields
      tourist_first_name: req.user.first_name,
      tourist_last_name: req.user.last_name,
      tourist_email: req.user.email,
      tour_name: tour.tour_name,
      created_by: req.user._id
    });

    await registration.save();

    // Send email notification to provider admins
    const providerAdmins = await User.find({
      provider_id: tour.provider_id._id,
      user_type: 'provider_admin',
      is_active: true
    });

    for (const admin of providerAdmins) {
      await sendEmail(
        admin.email,
        'registrationSubmitted',
        admin.first_name,
        tour.tour_name,
        req.user.first_name + ' ' + req.user.last_name
      );
    }

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('custom_tour_id')
      .populate('provider_id', 'provider_name')
      .populate('tourist_id', 'first_name last_name email');

    // Create in-app notification for provider admins
    try {
      await NotificationService.createRegistrationNotification(
        populatedRegistration,
        'tour_registration'
      );
    } catch (notificationError) {
      console.error('Error creating registration notification:', notificationError);
      // Don't fail the registration if notification fails
    }

    res.status(201).json({
      message: 'Registration submitted successfully',
      registration: populatedRegistration
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You are already registered for this tour' });
    }
    res.status(500).json({ error: 'Failed to register for tour' });
  }
};

// Update registration status (Provider Admin, System Admin)
const updateRegistrationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const registrationId = req.params.id;

    const registration = await Registration.findById(registrationId)
      .populate('custom_tour_id')
      .populate('tourist_id');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check access permissions
    // Extract provider ID properly (handle both populated and non-populated cases)
    const userProviderId = req.user.provider_id?._id || req.user.provider_id;
    const registrationProviderId = registration.provider_id._id || registration.provider_id;
    
    console.log('🔍 Authorization Debug:', {
      userType: req.user.user_type,
      userProviderId: userProviderId,
      userProviderIdString: userProviderId?.toString(),
      registrationProviderId: registrationProviderId,
      registrationProviderIdString: registrationProviderId?.toString(),
      match: userProviderId?.toString() === registrationProviderId?.toString()
    });
    
    if (req.user.user_type === 'provider_admin' && 
        userProviderId?.toString() !== registrationProviderId?.toString()) {
      console.log('❌ Access denied - provider ID mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if tour has remaining spots for approval
    if (status === 'approved') {
      console.log('🔍 Starting approval process for registration:', registrationId);
      console.log('🔍 Registration custom_tour_id:', registration.custom_tour_id);
      
      const tour = await CustomTour.findById(registration.custom_tour_id._id);
      
      if (!tour) {
        console.error('❌ Tour not found for ID:', registration.custom_tour_id._id);
        return res.status(404).json({ error: 'Tour not found' });
      }
      
      console.log('🔍 Found tour:', {
        id: tour._id,
        name: tour.tour_name,
        maxTourists: tour.max_tourists,
        remainingTourists: tour.remaining_tourists
      });
      
      // Count actual approved registrations to verify remaining_tourists is correct
      const approvedCount = await Registration.countDocuments({
        custom_tour_id: tour._id,
        status: 'approved'
      });
      
      const actualRemaining = tour.max_tourists - approvedCount;
      
      console.log('🔍 Registration Approval Debug:', {
        tourId: tour._id,
        tourName: tour.tour_name,
        maxTourists: tour.max_tourists,
        remainingTourists: tour.remaining_tourists,
        approvedRegistrations: approvedCount,
        actualRemaining: actualRemaining,
        canApprove: actualRemaining > 0
      });
      
      // Use actual calculation instead of stored value if they don't match
      if (tour.remaining_tourists !== actualRemaining) {
        console.warn('⚠️ Remaining tourists count out of sync, correcting...', {
          stored: tour.remaining_tourists,
          actual: actualRemaining
        });
        tour.remaining_tourists = actualRemaining;
        await tour.save();
      }
      
      if (actualRemaining <= 0) {
        console.error('❌ No remaining spots available:', {
          maxTourists: tour.max_tourists,
          approvedCount: approvedCount,
          actualRemaining: actualRemaining
        });
        return res.status(400).json({ error: 'No remaining spots available for this tour' });
      }

      // Update remaining tourists
      tour.remaining_tourists -= 1;
      await tour.save();
    }

    // If changing from approved to rejected/cancelled, free up the spot
    if (registration.status === 'approved' && ['rejected', 'cancelled'].includes(status)) {
      const tour = await CustomTour.findById(registration.custom_tour_id._id);
      tour.remaining_tourists += 1;
      await tour.save();
    }

    registration.status = status;
    if (notes) registration.notes = notes;
    await registration.save();

    // Send email notification to tourist
    await sendEmail(
      registration.tourist_id.email,
      'registrationStatusUpdate',
      registration.tourist_id.first_name,
      registration.custom_tour_id.tour_name,
      status
    );

    // Create in-app notification for tourist
    try {
      if (status === 'approved') {
        await NotificationService.createRegistrationNotification(
          registration,
          'registration_approved'
        );
      } else if (status === 'rejected') {
        await NotificationService.createRegistrationNotification(
          registration,
          'registration_rejected'
        );
      }
    } catch (notificationError) {
      console.error('Error creating registration status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({
      message: `Registration ${status} successfully`,
      registration
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update registration status' });
  }
};

// Unregister from tour (Tourist, System Admin)
const unregisterFromTour = async (req, res) => {
  try {
    const registrationId = req.params.id;

    const registration = await Registration.findById(registrationId)
      .populate('custom_tour_id')
      .populate('provider_id');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Check access permissions
    if (req.user.user_type === 'tourist' && 
        registration.tourist_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Free up the spot if registration was approved
    if (registration.status === 'approved') {
      const tour = await CustomTour.findById(registration.custom_tour_id._id);
      tour.remaining_tourists += 1;
      await tour.save();
    }

    registration.status = 'cancelled';
    await registration.save();

    // Send email notifications
    if (req.user.user_type === 'system_admin') {
      // Notify tourist
      const tourist = await User.findById(registration.tourist_id);
      await sendEmail(
        tourist.email,
        'registrationStatusUpdate',
        tourist.first_name,
        registration.custom_tour_id.tour_name,
        'cancelled'
      );
    } else {
      // Notify provider admins
      const providerAdmins = await User.find({
        provider_id: registration.provider_id._id,
        user_type: 'provider_admin',
        is_active: true
      });

      for (const admin of providerAdmins) {
        // You can create a specific email template for unregistration
        await sendEmail(
          admin.email,
          'registrationStatusUpdate',
          admin.first_name,
          registration.custom_tour_id.tour_name,
          'cancelled by tourist'
        );
      }
    }

    res.json({
      message: 'Unregistered successfully',
      registration
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unregister from tour' });
  }
};

// Get registration statistics
const getRegistrationStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.user_type === 'provider_admin') {
      query.provider_id = req.user.provider_id;
    }

    const [
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations
    ] = await Promise.all([
      Registration.countDocuments(query),
      Registration.countDocuments({ ...query, status: 'pending' }),
      Registration.countDocuments({ ...query, status: 'approved' }),
      Registration.countDocuments({ ...query, status: 'rejected' })
    ]);

    res.json({
      stats: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        approved: approvedRegistrations,
        rejected: rejectedRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registration statistics' });
  }
};

module.exports = {
  getAllRegistrations,
  getMyRegistrations,
  registerForTour,
  updateRegistrationStatus,
  unregisterFromTour,
  getRegistrationStats
};