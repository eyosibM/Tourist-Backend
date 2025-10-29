const express = require('express');
const router = express.Router();
const { authenticate, authorize, checkProviderOwnership } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const providerController = require('../controllers/providerController');

// @route   GET /api/providers
// @desc    Get all providers
// @access  Private (System Admin, Provider Admin can see their own)
router.get('/', 
  authenticate,
  authorize('system_admin', 'provider_admin', 'tourist'),
  providerController.getAllProviders
);

// @route   POST /api/providers
// @desc    Create new provider
// @access  Private (System Admin only)
router.post('/', 
  authenticate,
  authorize('system_admin'),
  validate(schemas.provider),
  providerController.createProvider
);

// @route   POST /api/providers/signup
// @desc    Direct provider signup (Tourist creates new company)
// @access  Private (Tourist only)
router.post('/signup', 
  authenticate,
  authorize('tourist'),
  validate(schemas.provider),
  providerController.signupAsProvider
);

// @route   GET /api/providers/active
// @desc    Get active providers for tourists to join
// @access  Private (Tourist only)
router.get('/active', 
  authenticate,
  authorize('tourist'),
  providerController.getActiveProviders
);



// @route   PUT /api/providers/:id
// @desc    Update provider
// @access  Private (System Admin, Provider Admin for their own)
router.put('/:id', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  checkProviderOwnership,
  validate(schemas.provider),
  providerController.updateProvider
);

// @route   PATCH /api/providers/:id/status
// @desc    Toggle provider status
// @access  Private (System Admin only)
router.patch('/:id/status', 
  authenticate,
  authorize('system_admin'),
  providerController.toggleProviderStatus
);

// @route   GET /api/providers/:id/admins
// @desc    Get provider admins
// @access  Private (System Admin, Provider Admin for their own)
router.get('/:id/admins', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  checkProviderOwnership,
  providerController.getProviderAdmins
);

// @route   GET /api/providers/:id/stats
// @desc    Get provider statistics
// @access  Private (System Admin, Provider Admin for their own)
router.get('/:id/stats', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  checkProviderOwnership,
  providerController.getProviderStats
);

// @route   GET /api/providers/:id
// @desc    Get provider by ID
// @access  Private (System Admin, Provider Admin for their own)
router.get('/:id', 
  authenticate,
  authorize('system_admin', 'provider_admin'),
  checkProviderOwnership,
  providerController.getProviderById
);

module.exports = router;