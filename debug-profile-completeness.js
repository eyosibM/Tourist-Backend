const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourlicity');

const User = require('./src/models/User');

async function checkProfileCompleteness() {
  try {
    console.log('🔍 Checking profile completeness for user: opeyemioladejobi@gmail.com');
    
    const user = await User.findOne({ email: 'opeyemioladejobi@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n📋 User Profile:');
    console.log('- ID:', user._id);
    console.log('- Email:', user.email);
    console.log('- First Name:', user.first_name || 'MISSING');
    console.log('- Last Name:', user.last_name || 'MISSING');
    console.log('- Country:', user.country || 'MISSING');
    console.log('- Date of Birth:', user.date_of_birth || 'MISSING');
    console.log('- Gender:', user.gender || 'MISSING');
    console.log('- Passport Number:', user.passport_number || 'MISSING');
    console.log('- Phone Number:', user.phone_number || 'MISSING');
    console.log('- User Type:', user.user_type);
    console.log('- Is Active:', user.is_active);
    
    // Check profile completeness
    const isProfileComplete = !!(
      user.first_name && 
      user.last_name && 
      user.country && 
      user.date_of_birth && 
      user.gender && 
      user.passport_number && 
      user.phone_number
    );
    
    console.log('\n✅ Profile Complete:', isProfileComplete);
    
    if (!isProfileComplete) {
      const missingFields = [];
      if (!user.first_name) missingFields.push('first_name');
      if (!user.last_name) missingFields.push('last_name');
      if (!user.country) missingFields.push('country');
      if (!user.date_of_birth) missingFields.push('date_of_birth');
      if (!user.gender) missingFields.push('gender');
      if (!user.passport_number) missingFields.push('passport_number');
      if (!user.phone_number) missingFields.push('phone_number');
      
      console.log('❌ Missing Fields:', missingFields);
    }
    
    // Check for existing role change requests
    const RoleChangeRequest = require('./src/models/RoleChangeRequest');
    const existingRequests = await RoleChangeRequest.find({ tourist_id: user._id });
    
    console.log('\n📝 Existing Role Change Requests:', existingRequests.length);
    existingRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. Type: ${req.request_type}, Status: ${req.status}, Created: ${req.created_date}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkProfileCompleteness();