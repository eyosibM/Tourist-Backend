// Quick script to verify all existing users in development
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function verifyAllUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding unverified users...');
    const unverifiedUsers = await User.find({ email_verified: false });
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified!');
      process.exit(0);
    }

    console.log(`📧 Found ${unverifiedUsers.length} unverified user(s):\n`);
    
    for (const user of unverifiedUsers) {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
    }

    console.log('\n🔧 Verifying all users...');
    
    const result = await User.updateMany(
      { email_verified: false },
      { 
        $set: { 
          email_verified: true,
          email_verification_token: undefined,
          email_verification_expires: undefined
        }
      }
    );

    console.log(`✅ Verified ${result.modifiedCount} user(s)!`);
    console.log('\n🎉 All users can now login without email verification!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Development User Verification Script\n');
verifyAllUsers();
