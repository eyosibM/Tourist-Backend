// AWS S3 Upload Issue Fix
// Run this script to test and fix AWS S3 configuration

const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testAWSConfiguration() {
    console.log('🔍 Testing AWS S3 Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
    console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set (will use default)');
    console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME || '❌ Missing');
    console.log();

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
        console.log('❌ Missing required AWS credentials. Please check your .env file.');
        return;
    }

    // Create S3 client
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    try {
        // Test 1: List buckets (basic connectivity test)
        console.log('🧪 Test 1: Testing AWS connectivity...');
        const listCommand = new ListBucketsCommand({});
        const buckets = await s3Client.send(listCommand);
        console.log('✅ AWS connectivity successful');
        console.log('📦 Available buckets:', buckets.Buckets.map(b => b.Name).join(', '));
        
        // Check if our bucket exists
        const bucketExists = buckets.Buckets.some(b => b.Name === process.env.S3_BUCKET_NAME);
        if (bucketExists) {
            console.log(`✅ Bucket "${process.env.S3_BUCKET_NAME}" exists`);
        } else {
            console.log(`❌ Bucket "${process.env.S3_BUCKET_NAME}" not found`);
            console.log('Available buckets:', buckets.Buckets.map(b => b.Name));
            return;
        }

        // Test 2: Upload a test file
        console.log('\n🧪 Test 2: Testing file upload...');
        const testKey = `test-uploads/test-${Date.now()}.txt`;
        const testContent = 'This is a test file for AWS S3 upload verification';
        
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain',
            Metadata: {
                testFile: 'true',
                uploadedAt: new Date().toISOString()
            }
        });

        await s3Client.send(uploadCommand);
        console.log('✅ Test file upload successful');
        console.log(`📁 Test file uploaded to: ${testKey}`);
        
        const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${testKey}`;
        console.log(`🔗 Public URL: ${publicUrl}`);

        console.log('\n🎉 AWS S3 configuration is working correctly!');
        console.log('\n💡 If you\'re still experiencing issues, try:');
        console.log('1. Verify your system clock is synchronized');
        console.log('2. Check if your AWS credentials have the necessary S3 permissions');
        console.log('3. Ensure the bucket policy allows uploads');

    } catch (error) {
        console.log('❌ AWS S3 test failed:', error.message);
        
        if (error.name === 'SignatureDoesNotMatch') {
            console.log('\n🔧 SignatureDoesNotMatch Error Solutions:');
            console.log('1. Verify AWS credentials are correct');
            console.log('2. Check if system clock is synchronized');
            console.log('3. Ensure AWS region matches your bucket region');
            console.log('4. Verify credentials have S3 permissions');
        } else if (error.name === 'AccessDenied') {
            console.log('\n🔧 Access Denied Solutions:');
            console.log('1. Check IAM user permissions for S3');
            console.log('2. Verify bucket policy allows your operations');
            console.log('3. Ensure bucket exists and is accessible');
        } else if (error.name === 'NoSuchBucket') {
            console.log('\n🔧 Bucket Not Found Solutions:');
            console.log('1. Verify bucket name is correct');
            console.log('2. Check if bucket exists in the specified region');
            console.log('3. Ensure you have access to the bucket');
        }
        
        console.log('\n📋 Error Details:');
        console.log('Name:', error.name);
        console.log('Message:', error.message);
        if (error.$metadata) {
            console.log('HTTP Status:', error.$metadata.httpStatusCode);
            console.log('Request ID:', error.$metadata.requestId);
        }
    }
}

// Run the test
if (require.main === module) {
    testAWSConfiguration().catch(console.error);
}

module.exports = { testAWSConfiguration };