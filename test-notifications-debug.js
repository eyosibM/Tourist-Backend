/**
 * Test script to debug push notification issues
 */

console.log('🔍 Testing Push Notification Configuration...\n');

// Test 1: Check if VAPID keys are configured in environment
console.log('1. Checking environment variables...');
console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY ? 'Configured' : 'Not configured');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? 'Configured' : 'Not configured');
console.log('VAPID_EMAIL:', process.env.VAPID_EMAIL || 'Not configured');

// Test 2: Check if web-push is properly configured
try {
  const webpush = require('web-push');
  console.log('\n2. Web-push module loaded successfully');
  
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    console.log('✅ VAPID keys are configured');
    
    // Test VAPID key format
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    console.log('VAPID public key length:', publicKey.length);
    console.log('VAPID public key format:', publicKey.startsWith('B') ? 'Correct (starts with B)' : 'Incorrect');
    
  } else {
    console.log('❌ VAPID keys are not configured');
    console.log('\n💡 To fix this:');
    console.log('1. Generate VAPID keys using: npx web-push generate-vapid-keys');
    console.log('2. Add them to your .env file:');
    console.log('   VAPID_PUBLIC_KEY=your_public_key');
    console.log('   VAPID_PRIVATE_KEY=your_private_key');
    console.log('   VAPID_EMAIL=your_email@example.com');
  }
} catch (error) {
  console.log('\n❌ Failed to load web-push module:', error.message);
}

// Test 3: Generate VAPID keys if not configured
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  try {
    const webpush = require('web-push');
    console.log('\n3. Generating new VAPID keys...');
    const vapidKeys = webpush.generateVAPIDKeys();
    
    console.log('\n🔑 Generated VAPID Keys:');
    console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
    console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
    console.log('VAPID_EMAIL=admin@tourlicity.com');
    
    console.log('\n📝 Add these to your api/.env file to enable push notifications');
    
  } catch (error) {
    console.log('\n❌ Failed to generate VAPID keys:', error.message);
  }
}

console.log('\n🎉 Push notification configuration test completed!');