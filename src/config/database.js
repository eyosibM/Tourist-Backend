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

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 20000, // Close sockets after 20s of inactivity
      maxPoolSize: 3, // Very small pool size
      minPoolSize: 1, // Minimum connections
      maxIdleTimeMS: 5000, // Close connections after 5 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      heartbeatFrequencyMS: 10000, // Check connection every 10s
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
    
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectDB(retryCount + 1);
    } else {
      console.error('All MongoDB connection attempts failed');
      console.log('Please ensure MongoDB is running on:', process.env.MONGODB_URI);
      console.log('Try restarting MongoDB: net stop MongoDB && net start MongoDB (as admin)');
      
      // Don't exit in development, just log the error
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.log('Continuing in development mode without database...');
      }
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