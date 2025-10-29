require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB, connectRedis } = require('./config/database');
const cacheService = require('./services/cacheService');
const { printConfigurationStatus, validateServiceConfigurations } = require('./utils/configCheck');

const app = express();

// Check configuration before starting services
console.log('Checking server configuration...');
const configStatus = printConfigurationStatus();
const serviceConfigs = validateServiceConfigurations();

// Log service availability
console.log('=== SERVICE AVAILABILITY ===');
Object.entries(serviceConfigs).forEach(([key, service]) => {
  const status = service.status === 'enabled' ? '✅' : '❌';
  console.log(`${status} ${service.name}: ${service.status}`);
  if (service.status === 'disabled' && service.missingVars.length > 0) {
    console.log(`   Missing: ${service.missingVars.join(', ')}`);
  }
});
console.log('============================\n');

// Connect to databases
connectDB();
let redisClient;
connectRedis().then(async client => {
  redisClient = client;
  if (client) {
    app.locals.redis = client;

    // Initialize cache service with the same Redis client
    try {
      await cacheService.initialize(client);
      console.log('Cache service initialized');
    } catch (error) {
      console.warn('Failed to initialize cache service:', error.message);
    }

    // Initialize notification queues after Redis connection
    try {
      const NotificationQueueService = require('./services/notificationQueueService');
      if (NotificationQueueService && typeof NotificationQueueService.initializeQueues === 'function') {
        NotificationQueueService.initializeQueues();
        console.log('Notification queues initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize notification queues:', error.message);
    }
  } else {
    console.warn('Redis not available - caching and notification queues disabled');
  }
}).catch(error => {
  console.warn('Redis connection failed:', error.message);
  console.log('Server will continue without Redis functionality');
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting - Disabled for development, enabled for production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests for production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use('/api/', limiter);
} else {
  console.log('Rate limiting disabled for development environment');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for local uploads (when S3 is not configured)
app.use('/uploads', express.static('uploads'));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     redis:
 *                       type: string
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: string
 *                     total:
 *                       type: string
 *                 environment:
 *                   type: string
 *       503:
 *         description: Service is degraded or unhealthy
 */
// Health check endpoints
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'connected';
    } else {
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Check Redis connection
    if (redisClient && redisClient.isOpen) {
      healthCheck.services.redis = 'connected';
    } else {
      healthCheck.services.redis = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Add cache statistics
    if (cacheService.isAvailable()) {
      const cacheStats = await cacheService.getStats();
      healthCheck.cache = cacheStats;
    }

    // Return appropriate status code
    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    });
  }
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with performance metrics
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Detailed service health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 services:
 *                   type: object
 *                 performance:
 *                   type: object
 *                 system:
 *                   type: object
 *       503:
 *         description: Service is degraded or unhealthy
 */
// Detailed health check for monitoring
app.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../package.json').version,
    services: {},
    performance: {},
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };

  try {
    // Check MongoDB connection with timing
    const mongoose = require('mongoose');
    const dbStart = Date.now();
    if (mongoose.connection.readyState === 1) {
      // Test actual database query
      await mongoose.connection.db.admin().ping();
      healthCheck.services.database = {
        status: 'connected',
        responseTime: Date.now() - dbStart + 'ms',
        readyState: mongoose.connection.readyState
      };
    } else {
      healthCheck.services.database = {
        status: 'disconnected',
        readyState: mongoose.connection.readyState
      };
      healthCheck.status = 'DEGRADED';
    }

    // Check Redis connection with timing
    const redisStart = Date.now();
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      healthCheck.services.redis = {
        status: 'connected',
        responseTime: Date.now() - redisStart + 'ms'
      };
    } else {
      healthCheck.services.redis = {
        status: 'disconnected'
      };
      healthCheck.status = 'DEGRADED';
    }

    // Add detailed cache statistics
    if (cacheService.isAvailable()) {
      const cacheStats = await cacheService.getStats();
      healthCheck.cache = cacheStats;
    }

    // Performance metrics
    const memUsage = process.memoryUsage();
    healthCheck.performance = {
      totalResponseTime: Date.now() - startTime + 'ms',
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpuUsage: process.cpuUsage()
    };

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
      responseTime: Date.now() - startTime + 'ms'
    });
  }
});

// Swagger API Documentation
const { swaggerUi, specs } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/tour-templates', require('./routes/tourTemplates'));
app.use('/api/custom-tours', require('./routes/customTours'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/role-change-requests', require('./routes/roleChangeRequests'));
app.use('/api/qr-codes', require('./routes/qrCodes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/activities', require('./routes/defaultActivities'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/cache', require('./routes/cache'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/tour-updates', require('./routes/tourUpdates'));
app.use('/api/tour-documents', require('./routes/tourDocuments'));
app.use('/api/tour-template-documents', require('./routes/tourTemplateDocuments'));
app.use('/api/document-types', require('./routes/documentTypes'));
app.use('/api/tourist-documents', require('./routes/touristDocuments'));
app.use('/api/user-tour-update-views', require('./routes/userTourUpdateViews'));
app.use('/api/document-activities', require('./routes/documentActivities'));
app.use('/api/payment-configs', require('./routes/paymentConfigs'));
app.use('/api/test', require('./routes/test'));

// Test endpoint to verify no global auth (outside of /api/notifications)
app.get('/api/test-no-auth', (req, res) => {
  res.json({ 
    message: 'Test endpoint working without auth', 
    timestamp: new Date().toISOString(),
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? 'Configured' : 'Not configured'
  });
});

// Direct VAPID endpoint (workaround for notifications router auth issue)
app.get('/api/vapid-public-key', (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      return res.status(500).json({ 
        error: 'VAPID public key not configured' 
      });
    }

    res.json({ 
      publicKey,
      message: 'VAPID public key retrieved successfully'
    });
  } catch (error) {
    console.error('Get VAPID public key error:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
});

// Additional routes (to be created)
// app.use('/api/documents', require('./routes/documents'));
// app.use('/api/config', require('./routes/paymentConfig'));

// Admin endpoint to reconnect database
app.post('/admin/reconnect-db', async (req, res) => {
  try {
    console.log('🔄 Manual database reconnection requested...');
    await connectDB();
    res.json({
      message: 'Database reconnection attempted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual reconnection failed:', error);
    res.status(500).json({
      error: 'Reconnection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);

    try {
      // Close cache service
      await cacheService.close();

      // Close Redis connection
      if (redisClient) {
        await redisClient.quit();
        console.log('Redis connection closed');
      }

      // Close MongoDB connection
      if (require('mongoose').connection.readyState !== 0) {
        await require('mongoose').disconnect();
        console.log('MongoDB connection closed');
      }

      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
}

module.exports = app;