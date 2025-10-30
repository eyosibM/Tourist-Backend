const mongoose = require('mongoose');
const redis = require('redis');

// MongoDB connection with retry mechanism
const connectDB = async (retryCount = 0) => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  try {
    // Close any existing connections first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Attempting MongoDB connection (attempt ${retryCount + 1}/${maxRetries + 1})...`);

    // Enhanced connection string validation
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('MongoDB URI format check:', mongoUri.substring(0, 20) + '...');
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // Increased timeout for Vercel
      socketTimeoutMS: 30000, // Longer socket timeout
      connectTimeoutMS: 15000, // Connection timeout
      maxPoolSize: 2, // Smaller pool for serverless
      minPoolSize: 0, // No minimum for serverless
      maxIdleTimeMS: 30000, // Longer idle time
      bufferCommands: false, // Disable mongoose buffering
      heartbeatFrequencyMS: 30000, // Less frequent heartbeat
      retryWrites: true, // Enable retry writes
      w: 'majority', // Write concern
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return conn;
    
  } catch (error) {
    console.error(`❌ Database connection attempt ${retryCount + 1} failed:`, error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      reason: error.reason
    });
    
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectDB(retryCount + 1);
    } else {
      console.error('All MongoDB connection attempts failed');
      console.log('MongoDB URI (masked):', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET');
      
      // In production, continue without database but log the issue
      console.log('Continuing without database - API will have limited functionality');
      return null;
    }
  }
};

// Redis connection
const connectRedis = async () => {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000, // 5 second timeout
        lazyConnect: true
      }
    });
    
    client.on('error', (err) => {
      console.log('Redis Client Error:', err.message);
    });
    client.on('connect', () => console.log('Redis Connected'));
    client.on('ready', () => console.log('Redis Ready'));
    
    await client.connect();
    return client;
  } catch (error) {
    console.warn('Redis connection failed:', error.message);
    console.log('Continuing without Redis - some features may be limited');
    return null;
  }
};

module.exports = { connectDB, connectRedis };