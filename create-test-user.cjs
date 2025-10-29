const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  first_name: String,
  last_name: String,
  user_type: String,
  is_active: Boolean,
  google_id: String,
  profile_picture: String,
  created_date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    console.log('🔍 Checking for existing users...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'opeyemioladejobi@gmail.com' });
    
    if (existingUser) {
      console.log('✅ User already exists:', {
        id: existingUser._id,
        email: existingUser.email,
        name: `${existingUser.first_name} ${existingUser.last_name}`,
        type: existingUser.user_type,
        active: existingUser.is_active
      });
      
      // Generate a test JWT token for this user
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: existingUser._id,
          email: existingUser.email,
          user_type: existingUser.user_type
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('\n🔑 Test JWT Token (valid for 24h):');
      console.log(token);
      console.log('\n📝 Use this token in Authorization header: Bearer <token>');
      
    } else {
      console.log('❌ No user found with email: opeyemioladejobi@gmail.com');
      console.log('Creating test user...');
      
      const testUser = new User({
        email: 'opeyemioladejobi@gmail.com',
        first_name: 'Opeyemi',
        last_name: 'Oladejobi',
        user_type: 'provider_admin',
        is_active: true,
        google_id: 'test_google_id_' + Date.now(),
        profile_picture: 'https://via.placeholder.com/150'
      });
      
      await testUser.save();
      console.log('✅ Test user created:', {
        id: testUser._id,
        email: testUser.email,
        name: `${testUser.first_name} ${testUser.last_name}`,
        type: testUser.user_type
      });
      
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: testUser._id,
          email: testUser.email,
          user_type: testUser.user_type
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('\n🔑 Test JWT Token (valid for 24h):');
      console.log(token);
      console.log('\n📝 Use this token in Authorization header: Bearer <token>');
    }
    
    // List all users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}).select('email first_name last_name user_type is_active');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.first_name} ${user.last_name} (${user.user_type}) - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();