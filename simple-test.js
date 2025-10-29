console.log('Starting simple test...');

// Test Media upload service loading (S3 only)
try {
  console.log('Loading Media upload service...');
  const MediaUploadService = require('./src/services/mediaUploadService');
  console.log('✅ YouTube service loaded');
  console.log('Available:', YouTubeUploadService.isAvailable());
} catch (error) {
  console.error('❌ YouTube error:', error.message);
}

console.log('Test completed');
process.exit(0);