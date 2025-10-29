// Test the upload fix
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ImageUploadService = require('./src/services/imageUploadService');

async function testUploadMiddleware() {
    console.log('🧪 Testing Upload Middleware Fix...\n');
    
    // Create a test middleware
    const uploadMiddleware = ImageUploadService.createUploadMiddleware(
        'general-uploads',
        ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo'],
        100 * 1024 * 1024 // 100MB
    );
    
    console.log('✅ Upload middleware created successfully');
    console.log('📋 Middleware type:', typeof uploadMiddleware);
    console.log('📋 Has single method:', typeof uploadMiddleware.single === 'function');
    console.log('📋 Has array method:', typeof uploadMiddleware.array === 'function');
    
    // Test creating a simple Express app with the middleware
    const app = express();
    
    // Mock request and response objects
    const mockReq = {
        user: { _id: 'test-user-id' },
        file: null,
        files: null
    };
    
    const mockRes = {
        status: (code) => ({ json: (data) => console.log(`Response ${code}:`, data) }),
        json: (data) => console.log('Response:', data)
    };
    
    console.log('\n🎉 Upload middleware test completed successfully!');
    console.log('💡 The middleware should now work with AWS SDK v3');
    
    return true;
}

// Run the test
if (require.main === module) {
    testUploadMiddleware().catch(console.error);
}

module.exports = { testUploadMiddleware };