const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourlicity');

const RoleChangeRequest = require('./src/models/RoleChangeRequest');
const User = require('./src/models/User');

async function quickFix() {
  try {
    const user = await User.findOne({ email: 'opeyemioladejobi@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.email);
    
    // Find and cancel any pending requests
    const pendingRequests = await RoleChangeRequest.find({ 
      tourist_id: user._id, 
      status: 'pending' 
    });
    
    console.log('Found pending requests:', pendingRequests.length);
    
    for (const request of pendingRequests) {
      request.status = 'rejected';
      request.admin_notes = 'Cancelled to allow new application';
      request.processed_date = new Date();
      await request.save();
      console.log('Cancelled request:', request._id);
    }
    
    console.log('✅ Fixed! You can now submit a new provider application.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

quickFix();