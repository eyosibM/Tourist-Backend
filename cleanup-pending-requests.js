const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourlicity');

const RoleChangeRequest = require('./src/models/RoleChangeRequest');
const User = require('./src/models/User');

async function cleanupPendingRequests() {
  try {
    console.log('🧹 Cleaning up pending role change requests...');
    
    const user = await User.findOne({ email: 'opeyemioladejobi@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.email, 'ID:', user._id);
    
    // Find all pending requests for this user
    const pendingRequests = await RoleChangeRequest.find({ 
      tourist_id: user._id, 
      status: 'pending' 
    });
    
    console.log('📝 Found pending requests:', pendingRequests.length);
    
    if (pendingRequests.length === 0) {
      console.log('✅ No pending requests to clean up');
      return;
    }
    
    // Cancel all pending requests
    for (const request of pendingRequests) {
      console.log(`🗑️  Cancelling request ${request._id} (${request.request_type})`);
      request.status = 'rejected';
      request.admin_notes = 'Cancelled automatically to resolve 400 error';
      request.processed_date = new Date();
      await request.save();
    }
    
    console.log('✅ All pending requests have been cancelled');
    console.log('🎯 You should now be able to submit a new provider application');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

cleanupPendingRequests();