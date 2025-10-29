const Provider = require('../models/Provider');
const User = require('../models/User');
const { paginate, buildPaginationResponse, generateProviderCode } = require('../utils/helpers');

// Get all providers
const getAllProviders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { provider_name: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { email_address: { $regex: search, $options: 'i' } }
      ];
    }
    if (is_active !== undefined) query.is_active = is_active === 'true';

    const providers = await Provider.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ created_date: -1 });

    const total = await Provider.countDocuments(query);

    res.json(buildPaginationResponse(providers, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};

// Get provider by ID
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Check access permissions
    if (req.user.user_type === 'provider_admin' && 
        req.user.provider_id?.toString() !== provider._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
};

// Create new provider (System Admin only)
const createProvider = async (req, res) => {
  try {
    const providerData = req.body;
    
    // Generate provider code
    providerData.provider_code = generateProviderCode(providerData.provider_name);
    providerData.created_by = req.user._id;

    const provider = new Provider(providerData);
    await provider.save();

    res.status(201).json({
      message: 'Provider created successfully',
      provider
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create provider' });
  }
};

// Direct provider signup (Tourist creates new company)
const signupAsProvider = async (req, res) => {
  try {
    const tourist = req.user;
    const providerData = req.body;

    // Check if tourist already has a provider role
    if (tourist.user_type !== 'tourist') {
      return res.status(400).json({ 
        error: 'Only tourists can signup as providers' 
      });
    }

    // Check for conflicts with existing providers
    const conflicts = [];
    
    // Check email uniqueness
    const existingEmailProvider = await Provider.findOne({ 
      email_address: providerData.email_address.toLowerCase() 
    });
    if (existingEmailProvider) {
      conflicts.push(`Email address '${providerData.email_address}' is already used by another provider`);
    }
    
    // Check provider name uniqueness
    const existingNameProvider = await Provider.findOne({ 
      provider_name: providerData.provider_name 
    });
    if (existingNameProvider) {
      conflicts.push(`Provider name '${providerData.provider_name}' is already taken`);
    }
    
    // Check phone number uniqueness
    const existingPhoneProvider = await Provider.findOne({ 
      phone_number: providerData.phone_number 
    });
    if (existingPhoneProvider) {
      conflicts.push(`Phone number '${providerData.phone_number}' is already used by another provider`);
    }
    
    // Check corporate tax ID uniqueness (if provided)
    if (providerData.corporate_tax_id) {
      const existingTaxIdProvider = await Provider.findOne({ 
        corporate_tax_id: providerData.corporate_tax_id 
      });
      if (existingTaxIdProvider) {
        conflicts.push(`Corporate Tax ID '${providerData.corporate_tax_id}' is already used by another provider`);
      }
    }
    
    // If there are conflicts, return error
    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Provider data conflicts with existing providers',
        details: conflicts
      });
    }

    // Generate provider code and set defaults
    providerData.provider_code = generateProviderCode(providerData.provider_name);
    providerData.created_by = tourist._id;
    providerData.is_active = true;

    // Create the provider
    const provider = new Provider(providerData);
    await provider.save();

    // Update tourist to become provider admin
    tourist.user_type = 'provider_admin';
    tourist.provider_id = provider._id;
    await tourist.save();

    res.status(201).json({
      message: 'Provider signup successful! You are now a provider admin.',
      provider: {
        _id: provider._id,
        provider_name: provider.provider_name,
        provider_code: provider.provider_code,
        country: provider.country,
        is_active: provider.is_active
      },
      user: {
        _id: tourist._id,
        user_type: tourist.user_type,
        provider_id: tourist.provider_id
      }
    });
  } catch (error) {
    console.error('Provider signup error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to complete provider signup' });
  }
};

// Get active providers for tourists to join
const getActiveProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ is_active: true })
      .select('provider_name provider_code country email_address')
      .sort({ provider_name: 1 });

    res.json({ providers });
  } catch (error) {
    console.error('Get active providers error:', error);
    res.status(500).json({ error: 'Failed to fetch active providers' });
  }
};

// Update provider
const updateProvider = async (req, res) => {
  try {
    const providerId = req.params.id;
    const updates = req.body;

    // Check access permissions
    if (req.user.user_type === 'provider_admin' && 
        req.user.provider_id?.toString() !== providerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow updating provider_code
    delete updates.provider_code;

    const provider = await Provider.findByIdAndUpdate(
      providerId,
      updates,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      message: 'Provider updated successfully',
      provider
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update provider' });
  }
};

// Activate/Deactivate provider (System Admin only)
const toggleProviderStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { is_active },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      message: `Provider ${is_active ? 'activated' : 'deactivated'} successfully`,
      provider
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update provider status' });
  }
};

// Get provider admins
const getProviderAdmins = async (req, res) => {
  try {
    const providerId = req.params.id;

    // Check access permissions
    if (req.user.user_type === 'provider_admin' && 
        req.user.provider_id?.toString() !== providerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const admins = await User.find({
      provider_id: providerId,
      user_type: 'provider_admin',
      is_active: true
    }).select('-password -google_id');

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provider admins' });
  }
};

// Get provider statistics
const getProviderStats = async (req, res) => {
  try {
    const providerId = req.params.id;

    // Check access permissions
    if (req.user.user_type === 'provider_admin' && 
        req.user.provider_id?.toString() !== providerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const CustomTour = require('../models/CustomTour');
    const Registration = require('../models/Registration');

    const [
      totalTours,
      activeTours,
      totalRegistrations,
      approvedRegistrations
    ] = await Promise.all([
      CustomTour.countDocuments({ provider_id: providerId }),
      CustomTour.countDocuments({ 
        provider_id: providerId, 
        status: { $in: ['draft', 'published'] }
      }),
      Registration.countDocuments({ provider_id: providerId }),
      Registration.countDocuments({ 
        provider_id: providerId, 
        status: 'approved' 
      })
    ]);

    res.json({
      stats: {
        total_tours: totalTours,
        active_tours: activeTours,
        total_registrations: totalRegistrations,
        approved_registrations: approvedRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provider statistics' });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  signupAsProvider,
  getActiveProviders,
  updateProvider,
  toggleProviderStatus,
  getProviderAdmins,
  getProviderStats
};