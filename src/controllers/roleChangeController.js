const RoleChangeRequest = require('../models/RoleChangeRequest');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { paginate, buildPaginationResponse, sanitizeUser } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/email');

// Submit role change request (Tourist only)
const submitRoleChangeRequest = async (req, res) => {
  try {
    const { request_type, provider_id, proposed_provider_data, request_message } = req.body;
    const tourist = req.user;

    // Check if user already has a pending request
    const existingRequest = await RoleChangeRequest.findOne({
      tourist_id: tourist._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending role change request' 
      });
    }

    // Prepare request data
    const requestData = {
      tourist_id: tourist._id,
      request_type,
      tourist_name: tourist.full_name,
      tourist_email: tourist.email,
      request_message,
      created_by: tourist._id
    };

    if (request_type === 'join_existing_provider') {
      // Validate provider exists
      const provider = await Provider.findById(provider_id);
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      requestData.provider_id = provider_id;
      requestData.provider_name = provider.provider_name;
    } else if (request_type === 'become_new_provider') {
      // Check for conflicts with existing providers
      const conflicts = [];
      
      // Check email uniqueness
      const existingEmailProvider = await Provider.findOne({ 
        email_address: proposed_provider_data.email_address.toLowerCase() 
      });
      if (existingEmailProvider) {
        conflicts.push(`Email address '${proposed_provider_data.email_address}' is already used by another provider`);
      }
      
      // Check provider name uniqueness
      const existingNameProvider = await Provider.findOne({ 
        provider_name: proposed_provider_data.provider_name 
      });
      if (existingNameProvider) {
        conflicts.push(`Provider name '${proposed_provider_data.provider_name}' is already taken`);
      }
      
      // Check phone number uniqueness
      const existingPhoneProvider = await Provider.findOne({ 
        phone_number: proposed_provider_data.phone_number 
      });
      if (existingPhoneProvider) {
        conflicts.push(`Phone number '${proposed_provider_data.phone_number}' is already used by another provider`);
      }
      
      // Check corporate tax ID uniqueness (if provided)
      if (proposed_provider_data.corporate_tax_id) {
        const existingTaxIdProvider = await Provider.findOne({ 
          corporate_tax_id: proposed_provider_data.corporate_tax_id 
        });
        if (existingTaxIdProvider) {
          conflicts.push(`Corporate Tax ID '${proposed_provider_data.corporate_tax_id}' is already used by another provider`);
        }
      }
      
      // If there are conflicts, return error
      if (conflicts.length > 0) {
        return res.status(400).json({ 
          error: 'Provider data conflicts with existing providers',
          details: conflicts
        });
      }

      // Auto-create the provider and upgrade the user immediately (no approval needed)
      try {
        // Generate provider code and set defaults
        const { generateProviderCode } = require('../utils/helpers');
        proposed_provider_data.provider_code = generateProviderCode(proposed_provider_data.provider_name);
        proposed_provider_data.created_by = tourist._id;
        proposed_provider_data.is_active = true;

        // Create the provider
        const newProvider = new Provider(proposed_provider_data);
        await newProvider.save();

        // Update tourist to become provider admin
        tourist.user_type = 'provider_admin';
        tourist.provider_id = newProvider._id;
        await tourist.save();

        // Create the role change request as approved for record keeping
        requestData.proposed_provider_data = proposed_provider_data;
        requestData.status = 'approved';
        requestData.processed_by = tourist._id; // Self-approved
        requestData.processed_date = new Date();
        requestData.admin_notes = 'Auto-approved: New provider company created successfully';

        const roleChangeRequest = new RoleChangeRequest(requestData);
        await roleChangeRequest.save();

        return res.status(201).json({
          message: 'Provider company created successfully! You are now a provider admin.',
          request: {
            _id: roleChangeRequest._id,
            request_type: roleChangeRequest.request_type,
            status: roleChangeRequest.status,
            created_date: roleChangeRequest.created_date
          },
          provider: {
            _id: newProvider._id,
            provider_name: newProvider.provider_name,
            provider_code: newProvider.provider_code,
            is_active: newProvider.is_active
          },
          user: {
            _id: tourist._id,
            user_type: tourist.user_type,
            provider_id: tourist.provider_id
          }
        });
      } catch (providerError) {
        console.error('Error creating provider:', providerError);
        if (providerError.code === 11000) {
          const field = Object.keys(providerError.keyPattern)[0];
          return res.status(400).json({ error: `${field} already exists` });
        }
        return res.status(500).json({ error: 'Failed to create provider company' });
      }
    }

    // For join_existing_provider requests, continue with normal approval flow
    const roleChangeRequest = new RoleChangeRequest(requestData);
    await roleChangeRequest.save();

    // Send email notification to system admins (only for join requests now)
    if (request_type === 'join_existing_provider') {
      const systemAdmins = await User.find({ user_type: 'system_admin', is_active: true });
      
      for (const admin of systemAdmins) {
        const emailData = emailTemplates.roleChangeRequest(
          requestData.provider_name,
          tourist.full_name,
          tourist.email,
          request_message || 'No message provided'
        );

        await sendEmail(admin.email, emailData.subject, emailData.html);
      }
    }

    res.status(201).json({
      message: 'Role change request submitted successfully',
      request: {
        _id: roleChangeRequest._id,
        request_type: roleChangeRequest.request_type,
        status: roleChangeRequest.status,
        created_date: roleChangeRequest.created_date
      }
    });
  } catch (error) {
    console.error('Submit role change request error:', error);
    res.status(500).json({ error: 'Failed to submit role change request' });
  }
};

// Get all role change requests (System Admin and Provider Admin)
const getAllRoleChangeRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, request_type, provider_id } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Build query
    const query = {};
    if (status) query.status = status;
    if (request_type) query.request_type = request_type;
    
    // For provider admins, only show requests for their provider
    if (req.user.user_type === 'provider_admin') {
      query.provider_id = req.user.provider_id._id || req.user.provider_id;
    } else if (provider_id) {
      // System admins can filter by specific provider_id if provided
      query.provider_id = provider_id;
    }

    const requests = await RoleChangeRequest.find(query)
      .populate('tourist_id', 'first_name last_name email')
      .populate('provider_id', 'provider_name')
      .populate('processed_by', 'first_name last_name')
      .skip(skip)
      .limit(limitNum)
      .sort({ created_date: -1 });

    const total = await RoleChangeRequest.countDocuments(query);

    res.json(buildPaginationResponse(requests, total, page, limit));
  } catch (error) {
    console.error('Get role change requests error:', error);
    res.status(500).json({ error: 'Failed to fetch role change requests' });
  }
};

// Get role change request by ID (System Admin only)
const getRoleChangeRequestById = async (req, res) => {
  try {
    const request = await RoleChangeRequest.findById(req.params.id)
      .populate('tourist_id', 'first_name last_name email phone_number')
      .populate('provider_id', 'provider_name address phone_number email_address')
      .populate('processed_by', 'first_name last_name');

    if (!request) {
      return res.status(404).json({ error: 'Role change request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get role change request error:', error);
    res.status(500).json({ error: 'Failed to fetch role change request' });
  }
};

// Process role change request (System Admin only)
const processRoleChangeRequest = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const requestId = req.params.id;
    const admin = req.user;
    
    console.log('Processing role change request:', {
      requestId,
      status,
      admin_notes,
      adminId: admin._id,
      adminType: admin.user_type,
      adminProviderId: admin.provider_id
    });

    const roleChangeRequest = await RoleChangeRequest.findById(requestId)
      .populate('tourist_id')
      .populate('provider_id');

    if (!roleChangeRequest) {
      return res.status(404).json({ error: 'Role change request not found' });
    }

    // Check if provider admin can process this request (only for their own provider)
    if (admin.user_type === 'provider_admin') {
      const adminProviderId = admin.provider_id._id || admin.provider_id;
      const requestProviderId = roleChangeRequest.provider_id._id || roleChangeRequest.provider_id;
      
      if (!roleChangeRequest.provider_id || 
          requestProviderId.toString() !== adminProviderId.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only process requests for your own provider.' });
      }
    }

    if (roleChangeRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update request status
    roleChangeRequest.status = status;
    roleChangeRequest.admin_notes = admin_notes;
    roleChangeRequest.processed_by = admin._id;
    roleChangeRequest.processed_date = new Date();

    if (status === 'approved') {
      const tourist = roleChangeRequest.tourist_id;

      if (roleChangeRequest.request_type === 'join_existing_provider') {
        // Add tourist to existing provider
        tourist.user_type = 'provider_admin';
        tourist.provider_id = roleChangeRequest.provider_id._id;
        await tourist.save();
      } else if (roleChangeRequest.request_type === 'become_new_provider') {
        // Create new provider and assign tourist as admin
        const newProvider = new Provider({
          ...roleChangeRequest.proposed_provider_data,
          is_active: true
        });
        await newProvider.save();

        tourist.user_type = 'provider_admin';
        tourist.provider_id = newProvider._id;
        await tourist.save();
      }
    }

    await roleChangeRequest.save();

    // Send email notification to tourist
    const emailData = emailTemplates.roleChangeDecision(
      roleChangeRequest.tourist_name,
      roleChangeRequest.provider_name || roleChangeRequest.proposed_provider_data?.provider_name,
      status,
      admin_notes || ''
    );

    await sendEmail(
      roleChangeRequest.tourist_email,
      emailData.subject,
      emailData.html
    );

    res.json({
      message: `Role change request ${status} successfully`,
      request: roleChangeRequest
    });
  } catch (error) {
    console.error('Process role change request error:', error);
    res.status(500).json({ error: 'Failed to process role change request' });
  }
};

// Get user's own role change requests (Tourist only)
const getMyRoleChangeRequests = async (req, res) => {
  try {
    const requests = await RoleChangeRequest.find({ tourist_id: req.user._id })
      .populate('provider_id', 'provider_name')
      .populate('processed_by', 'first_name last_name')
      .sort({ created_date: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my role change requests error:', error);
    res.status(500).json({ error: 'Failed to fetch your role change requests' });
  }
};

// Cancel role change request (Tourist only)
const cancelRoleChangeRequest = async (req, res) => {
  try {
    const request = await RoleChangeRequest.findOne({
      _id: req.params.id,
      tourist_id: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Pending role change request not found' 
      });
    }

    request.status = 'rejected';
    request.admin_notes = 'Cancelled by user';
    request.processed_date = new Date();
    await request.save();

    res.json({ message: 'Role change request cancelled successfully' });
  } catch (error) {
    console.error('Cancel role change request error:', error);
    res.status(500).json({ error: 'Failed to cancel role change request' });
  }
};

module.exports = {
  submitRoleChangeRequest,
  getAllRoleChangeRequests,
  getRoleChangeRequestById,
  processRoleChangeRequest,
  getMyRoleChangeRequests,
  cancelRoleChangeRequest
};