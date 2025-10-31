const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { 
  rateLimitLogin, 
  rateLimitRegistration, 
  rateLimitPasswordReset, 
  rateLimitEmailVerification,
  checkAccountLocked,
  requireEmailVerified,
  logSecurityEvent,
  handleFailedLogin,
  resetLoginAttempts
} = require('../middleware/security');
const authController = require('../controllers/authController');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         user_type:
 *           type: string
 *           enum: [tourist, provider_admin, system_admin]
 *         is_active:
 *           type: boolean
 *         email_verified:
 *           type: boolean
 *     GoogleAuthRequest:
 *       type: object
 *       required:
 *         - google_id
 *         - email
 *         - first_name
 *         - last_name
 *       properties:
 *         google_id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         picture:
 *           type: string
 *           format: uri
 *           description: Google profile picture URL (optional)
 *     AuthRegistrationRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *         first_name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         last_name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *     AuthLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     PasswordResetCompletion:
 *       type: object
 *       required:
 *         - token
 *         - new_password
 *       properties:
 *         token:
 *           type: string
 *         new_password:
 *           type: string
 *           minLength: 8
 *     EmailVerificationRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *     ResendVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegistrationRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 email_verification_required:
 *                   type: boolean
 *       400:
 *         description: Validation error or email already exists
 *       429:
 *         description: Too many registration attempts
 */
router.post('/register',
  rateLimitRegistration,
  validate(schemas.authRegistration),
  logSecurityEvent('registration_attempt'),
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 redirect:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email verification required or account inactive
 *       423:
 *         description: Account temporarily locked
 *       429:
 *         description: Too many login attempts
 */
router.post('/login',
  rateLimitLogin,
  checkAccountLocked,
  validate(schemas.authLogin),
  logSecurityEvent('login_attempt'),
  handleFailedLogin,
  resetLoginAttempts,
  authController.login
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many password reset requests
 */
router.post('/forgot-password',
  rateLimitPasswordReset,
  validate(schemas.passwordResetRequest),
  logSecurityEvent('password_reset_request'),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetCompletion'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       400:
 *         description: Invalid token or password validation error
 */
router.post('/reset-password',
  validate(schemas.passwordResetCompletion),
  logSecurityEvent('password_reset_completion'),
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                 email_verified:
 *                   type: boolean
 *       400:
 *         description: Invalid or expired verification token
 */
router.post('/verify-email',
  validate(schemas.emailVerification),
  logSecurityEvent('email_verification'),
  authController.verifyEmail
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationRequest'
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       400:
 *         description: Email already verified or validation error
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many verification requests
 */
router.post('/resend-verification',
  rateLimitEmailVerification,
  validate(schemas.passwordResetRequest), // Reuse email validation schema
  logSecurityEvent('email_verification_resend'),
  authController.resendVerification
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth login/register
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 redirect:
 *                   type: string
 *       400:
 *         description: Validation error
 */
router.post('/google',
  validate(schemas.userRegistration),
  authController.googleAuth
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile',
  authenticate,
  authController.getProfile
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *                 format: uri
 *                 description: URL to profile picture
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               country:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               passport_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile',
  authenticate,
  validate(schemas.userUpdate),
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/reset-google-picture:
 *   put:
 *     summary: Reset profile picture to Google picture
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_picture_url
 *             properties:
 *               google_picture_url:
 *                 type: string
 *                 format: uri
 *                 description: Google profile picture URL
 *     responses:
 *       200:
 *         description: Profile picture reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request or user not linked to Google
 *       401:
 *         description: Unauthorized
 */
router.put('/reset-google-picture',
  authenticate,
  authController.resetToGooglePicture
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/logout',
  authenticate,
  authController.logout
);

module.exports = router;