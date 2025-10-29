const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const MediaUploadService = require('../services/mediaUploadService');
const ImageUploadService = require('../services/imageUploadService');

const { validateServiceConfigurations } = require('../utils/configCheck');

/**
 * @swagger
 * /api/test/upload-services:
 *   get:
 *     summary: Test upload services availability
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload services status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: object
 *                 s3Available:
 *                   type: boolean
 *                 youtubeAvailable:
 *                   type: boolean
 */
router.get('/upload-services', authenticate, async (req, res) => {
  try {
    const services = validateServiceConfigurations();
    
    // Test S3 connectivity
    let s3Available = false;
    try {
      if (process.env.S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
        // Try to generate a presigned URL as a connectivity test
        await ImageUploadService.generatePresignedUrl('test.jpg', 'general');
        s3Available = true;
      }
    } catch (error) {
      console.log('S3 test failed:', error.message);
    }

    // All videos are now uploaded to S3
    const youtubeAvailable = false; // YouTube integration removed

    res.json({
      message: 'Upload services status',
      services,
      s3Available,
      youtubeAvailable,
      recommendations: generateRecommendations(services, s3Available, youtubeAvailable)
    });
  } catch (error) {
    console.error('Upload services test error:', error);
    res.status(500).json({ error: 'Failed to test upload services' });
  }
});

/**
 * @swagger
 * /api/test/media-validation:
 *   post:
 *     summary: Test media file validation without uploading
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               test_file:
 *                 type: string
 *                 format: binary
 *                 description: File to validate
 *     responses:
 *       200:
 *         description: File validation results
 */
router.post('/media-validation', authenticate, (req, res) => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });
  
  upload.single('test_file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      // Validate the file
      const validation = MediaUploadService.validateMediaFile(req.file);
      
      res.json({
        message: 'File validation completed',
        file: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          sizeFormatted: formatFileSize(req.file.size)
        },
        validation,
        recommendations: validation.isValid 
          ? ['File is valid and ready for upload']
          : validation.errors.map(error => `Fix: ${error}`)
      });
    } catch (error) {
      console.error('File validation error:', error);
      res.status(500).json({ error: 'Failed to validate file' });
    }
  });
});

/**
 * Generate recommendations based on service availability
 */
function generateRecommendations(services, s3Available, youtubeAvailable) {
  const recommendations = [];

  if (!s3Available) {
    recommendations.push('Configure AWS S3 credentials for file uploads');
    recommendations.push('Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME');
  }

  // YouTube integration removed - all videos are uploaded to S3
  recommendations.push('All media files (images and videos) are uploaded to S3 bucket');

  if (services.email.status === 'disabled') {
    recommendations.push('Configure SMTP settings for email notifications (optional)');
  }

  if (services.stripe.status === 'disabled') {
    recommendations.push('Configure Stripe for payment processing (optional)');
  }

  if (recommendations.length === 0) {
    recommendations.push('All services are properly configured!');
  }

  return recommendations;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;