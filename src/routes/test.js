const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint to verify API functionality
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test endpoint working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test endpoint working
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   example: OK
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    status: 'OK',
    path: req.path,
    method: req.method,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api/test/health:
 *   get:
 *     summary: Test health check endpoint
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test health check
 */
router.get('/health', (req, res) => {
  res.json({
    message: 'Test health endpoint working',
    timestamp: new Date().toISOString(),
    status: 'HEALTHY',
    uptime: process.uptime()
  });
});

module.exports = router;