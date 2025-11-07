// Run this from the api directory: node quick-verify-user.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/tourlicity';
const EMAIL_TO_VERIFY = 'junior_e40@yahoo.com'; // Change this if needed

async function verifyUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Find the user
    const user = await users.findOne({ email: EMAIL_TO_VERIFY });
    
    if (!user) {
      console.log(`❌ User not found: ${EMAIL_TO_VERIFY}`);
      return;
    }
    
    console.log(`📧 Found user: ${user.first_name} ${user.last_name}`);
    console.log(`   Email verified: ${user.email_verified}`);
    
    if (user.email_verified) {
      console.log('\n✅ User is already verified!');
      return;
    }
    
    // Verify the user
    console.log('\n🔧 Verifying user...');
    const result = await users.updateOne(
      { email: EMAIL_TO_VERIFY },
      { 
        $set: { email_verified: true },
        $unset: { 
          email_verification_token: '',
          email_verification_expires: ''
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ User verified successfully!');
      console.log('\n🎉 You can now login with this account!');
    } else {
      console.log('⚠️  No changes made');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

console.log('🚀 Quick User Verification\n');
verifyUser();
