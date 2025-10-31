const Joi = require('joi');
const PasswordUtils = require('../utils/passwordUtils');

// Custom Joi validation for password strength
const passwordValidation = Joi.string().custom((value, helpers) => {
  const validation = PasswordUtils.validatePasswordStrength(value);
  if (!validation.isValid) {
    return helpers.error('password.strength', { errors: validation.errors });
  }
  return value;
}).messages({
  'password.strength': 'Password does not meet security requirements: {{#errors}}'
});

// Validation schemas
const schemas = {
  // User schemas
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    first_name: Joi.string().min(1).max(50).required(),
    last_name: Joi.string().min(1).max(50).required(),
    country: Joi.string().max(100),
    passport_number: Joi.string().max(50).allow('', null).optional(),
    date_of_birth: Joi.date(),
    gender: Joi.string().valid('male', 'female', 'other'),
    phone_number: Joi.string().max(20),
    google_id: Joi.string(),
    picture: Joi.string().uri().allow(null, '').optional()
  }),

  userUpdate: Joi.object({
    first_name: Joi.string().min(1).max(50),
    last_name: Joi.string().min(1).max(50),
    country: Joi.string().max(100),
    passport_number: Joi.string().max(50).allow('', null).optional(),
    date_of_birth: Joi.date(),
    gender: Joi.string().valid('male', 'female', 'other'),
    phone_number: Joi.string().max(20),
    profile_picture: Joi.string().uri().allow(null, ''),
    user_type: Joi.string().valid('system_admin', 'provider_admin', 'tourist'),
    provider_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  // Provider schemas
  provider: Joi.object({
    country: Joi.string().required(),
    provider_name: Joi.string().required(),
    logo_url: Joi.string().uri().allow(''),
    address: Joi.string().required(),
    phone_number: Joi.string().required(),
    email_address: Joi.string().email().required(),
    corporate_tax_id: Joi.string().allow(''),
    company_description: Joi.string().allow(''),
    is_active: Joi.boolean()
  }),

  // Tour Template schemas
  tourTemplate: Joi.object({
    template_name: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    description: Joi.string().allow(''),
    is_active: Joi.boolean(),
    duration_days: Joi.number(),
    features_image: Joi.string().uri().allow(null, ''),
    features_media: Joi.object({
      url: Joi.string().uri().allow(null, ''),
      type: Joi.string().valid('image', 'video').allow(null, ''),
      video_id: Joi.string().allow(null, ''),
      duration: Joi.number().allow(null),
      embed_url: Joi.string().uri().allow(null, '')
    }).allow(null),
    teaser_images: Joi.array().items(Joi.string().uri()),
    qr_code_url: Joi.string().uri().allow(null, ''),
    qr_code_generated_at: Joi.date().allow(null),
    web_links: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      description: Joi.string().max(24).allow('')
    })),
    created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  // Custom Tour schemas
  customTour: Joi.object({
    provider_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    tour_template_id: Joi.alternatives().try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // Valid MongoDB ObjectId
      Joi.string().valid('blank-public', 'blank-private'), // Allow blank template IDs
      Joi.allow(null) // Allow null for blank templates after processing
    ).required(),
    tour_name: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    status: Joi.string().valid('draft', 'published', 'completed', 'cancelled'),
    viewAccessibility: Joi.string().valid('public', 'private'),
    join_code: Joi.string().max(10),
    max_tourists: Joi.number().min(1),
    group_chat_link: Joi.string().uri().allow(null, ''),
    features_image: Joi.string().uri().allow(null, ''),
    features_media: Joi.object({
      url: Joi.string().uri().allow(null, ''),
      type: Joi.string().valid('image', 'video').allow(null, ''),
      video_id: Joi.string().allow(null, ''),
      duration: Joi.number().allow(null),
      embed_url: Joi.string().uri().allow(null, '')
    }).allow(null),
    teaser_images: Joi.array().items(Joi.string().uri()),
    web_links: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      description: Joi.string().max(24)
    }))
  }),

  // Calendar Entry schemas
  calendarEntry: Joi.object({
    tour_template_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    custom_tour_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    entry_date: Joi.date().required(),
    activity: Joi.string().required(),
    activity_description: Joi.string(),
    activity_details: Joi.string(),
    featured_image: Joi.string().uri().allow(null, ''),
    web_links: Joi.array().items(Joi.string().uri()),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }),

  // Registration schemas
  registration: Joi.object({
    custom_tour_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    notes: Joi.string()
  }),

  registrationUpdate: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').required(),
    notes: Joi.string()
  }),

  // Default Activity schemas
  defaultActivity: Joi.object({
    activity_name: Joi.string().required(),
    description: Joi.string(),
    typical_duration_hours: Joi.number().min(0),
    category: Joi.string().valid(
      'sightseeing', 'cultural', 'adventure', 'dining',
      'transportation', 'accommodation', 'entertainment',
      'shopping', 'educational', 'religious', 'nature', 'other'
    ).required(),
    is_active: Joi.boolean()
  }),

  // Document Type schemas
  documentType: Joi.object({
    document_type_name: Joi.string().required(),
    description: Joi.string().allow(''),
    is_required: Joi.boolean(),
    is_active: Joi.boolean()
  }),

  // Broadcast schemas
  broadcast: Joi.object({
    custom_tour_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    message: Joi.string().max(150).required(),
    status: Joi.string().valid('draft', 'published')
  }),

  // Role Change Request schemas
  roleChangeRequest: Joi.object({
    request_type: Joi.string().valid('join_existing_provider', 'become_new_provider').required(),
    provider_id: Joi.when('request_type', {
      is: 'join_existing_provider',
      then: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      otherwise: Joi.forbidden()
    }),
    proposed_provider_data: Joi.when('request_type', {
      is: 'become_new_provider',
      then: Joi.object({
        provider_name: Joi.string().required(),
        country: Joi.string().required(),
        address: Joi.string().required(),
        phone_number: Joi.string().required(),
        email_address: Joi.string().email().required(),
        corporate_tax_id: Joi.string().allow(''),
        company_description: Joi.string().allow(''),
        logo_url: Joi.string().uri().allow('')
      }).required(),
      otherwise: Joi.forbidden()
    }),
    request_message: Joi.string()
  }),

  roleChangeDecision: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    admin_notes: Joi.string()
  }),

  // QR Code schemas
  qrCodeShare: Joi.object({
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    message: Joi.string().max(500),
    bulk: Joi.boolean()
  }),

  // Notification schemas
  pushSubscription: Joi.object({
    endpoint: Joi.string().uri().required(),
    keys: Joi.object({
      p256dh: Joi.string().required(),
      auth: Joi.string().required()
    }).required(),
    userAgent: Joi.string(),
    deviceType: Joi.string().valid('desktop', 'mobile', 'tablet', 'unknown'),
    browser: Joi.string()
  }),

  sendNotification: Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    title: Joi.string().max(100).required(),
    body: Joi.string().max(500).required(),
    type: Joi.string().max(50),
    includeEmail: Joi.boolean()
  }),

  bulkNotification: Joi.object({
    title: Joi.string().max(100).required(),
    body: Joi.string().max(500).required(),
    userIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
    userType: Joi.string().valid('tourist', 'provider_admin', 'system_admin'),
    type: Joi.string().max(50),
    includeEmail: Joi.boolean(),
    emailTemplate: Joi.string(),
    emailTemplateData: Joi.object()
  }).or('userIds', 'userType'),

  // Payment validation
  createPaymentIntent: Joi.object({
    registration_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').default('USD')
  }),

  confirmPayment: Joi.object({
    payment_intent_id: Joi.string().required()
  }),

  processRefund: Joi.object({
    refund_amount: Joi.number().positive().required(),
    reason: Joi.string().required()
  }),

  // Review validation
  createReview: Joi.object({
    custom_tour_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    registration_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    overall_rating: Joi.number().integer().min(1).max(5).required(),
    organization_rating: Joi.number().integer().min(1).max(5),
    communication_rating: Joi.number().integer().min(1).max(5),
    value_rating: Joi.number().integer().min(1).max(5),
    experience_rating: Joi.number().integer().min(1).max(5),
    title: Joi.string().max(100).required(),
    review_text: Joi.string().max(2000).required(),
    pros: Joi.array().items(Joi.string()),
    cons: Joi.array().items(Joi.string())
  }),

  moderateReview: Joi.object({
    status: Joi.string().valid('approved', 'rejected', 'flagged').required(),
    moderation_notes: Joi.string()
  }),

  respondToReview: Joi.object({
    response_text: Joi.string().max(1000).required()
  }),

  // Booking validation
  createBooking: Joi.object({
    availability_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    number_of_participants: Joi.number().integer().min(1).required(),
    contact_email: Joi.string().email().required(),
    contact_phone: Joi.string(),
    special_requests: Joi.string(),
    participants: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      age: Joi.number().integer().min(0),
      gender: Joi.string().valid('male', 'female', 'other'),
      dietary_requirements: Joi.array().items(Joi.string()),
      special_needs: Joi.string()
    }))
  }),

  cancelBooking: Joi.object({
    reason: Joi.string().required()
  }),

  createAvailability: Joi.object({
    tour_template_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    date: Joi.date().required(),
    total_capacity: Joi.number().integer().min(1).required(),
    base_price_per_person: Joi.number().positive().required(),
    minimum_participants: Joi.number().integer().min(1),
    maximum_participants: Joi.number().integer(),
    advance_booking_required_hours: Joi.number().integer().min(0),
    time_slots: Joi.array().items(Joi.object({
      start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      max_capacity: Joi.number().integer().min(1).required(),
      price_per_person: Joi.number().positive().required()
    }))
  }),

  // Location validation
  createLocation: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    type: Joi.string().valid(
      'city', 'landmark', 'attraction', 'restaurant', 'hotel', 
      'airport', 'station', 'museum', 'park', 'beach', 
      'mountain', 'building', 'neighborhood', 'other'
    ).required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    address: Joi.object({
      street_address: Joi.string(),
      city: Joi.string(),
      state_province: Joi.string(),
      postal_code: Joi.string(),
      country: Joi.string().required(),
      formatted_address: Joi.string()
    }).required(),
    contact: Joi.object({
      phone: Joi.string(),
      email: Joi.string().email(),
      website: Joi.string().uri()
    }),
    categories: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string())
  }),

  addLocationToTour: Joi.object({
    location_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    visit_order: Joi.number().integer().min(1).required(),
    day_number: Joi.number().integer().min(1).required(),
    activity_type: Joi.string().valid(
      'visit', 'meal', 'accommodation', 'transportation', 
      'activity', 'free_time', 'meeting_point', 'other'
    ).required(),
    planned_arrival_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    planned_departure_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    activity_description: Joi.string(),
    special_instructions: Joi.string(),
    tour_type: Joi.string().valid('template', 'custom').default('custom')
  }),

  // Payment Config schemas
  paymentConfig: Joi.object({
    charge_per_tourist: Joi.number().min(0),
    default_max_tourists: Joi.number().min(1),
    max_provider_admins: Joi.number().min(1),
    product_overview: Joi.string(),
    mission_statement: Joi.string(),
    vision: Joi.string()
  }),

  // Authentication schemas for email/password authentication
  authRegistration: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: passwordValidation.required().messages({
      'any.required': 'Password is required'
    }),
    first_name: Joi.string().min(1).max(50).required().messages({
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name must be no more than 50 characters long',
      'any.required': 'First name is required'
    }),
    last_name: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name must be no more than 50 characters long',
      'any.required': 'Last name is required'
    })
  }),

  authLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  passwordResetRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),

  passwordResetCompletion: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    new_password: passwordValidation.required().messages({
      'any.required': 'New password is required'
    })
  }),

  emailVerification: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required'
    })
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details.map(detail => detail.message));
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = { schemas, validate };