// Simple test to verify our fixes
require('dotenv').config();

console.log('Testing server components...');

// Test 1: Media upload service (S3 only)
try {
  const MediaUploadService = require('./src/services/mediaUploadService');
  console.log('✅ Media upload service loaded successfully');
} catch (error) {
  console.error('❌ Media upload service error:', error.message);
}

// Test 2: Media upload service
try {
  const MediaUploadService = require('./src/services/mediaUploadService');
  console.log('✅ Media upload service loaded successfully');
} catch (error) {
  console.error('❌ Media upload service error:', error.message);
}

// Test 3: Database connection
try {
  const { connectDB } = require('./src/config/database');
  console.log('✅ Database config loaded successfully');
  
  // Test connection
  connectDB().then(() => {
    console.log('✅ Database connection test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Database config error:', error.message);
  process.exit(1);
}