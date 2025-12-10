const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.clean') });

const CustomTour = require('./src/models/CustomTour');

// Try localhost first, then mongodb hostname
const MONGODB_URI = 'mongodb://admin:tourlicity123@localhost:27017/tourlicity?authSource=admin';
console.log('Using MongoDB URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

async function debugJoinCode() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const tourId = '6935161e2a26af4d346e6a9a';
    const tour = await CustomTour.findById(tourId);

    if (!tour) {
      console.log('❌ Tour not found');
      return;
    }

    console.log('\n📋 Current Tour Data:');
    console.log('Tour ID:', tour._id.toString());
    console.log('Tour Name:', tour.tour_name);
    console.log('Join Code:', tour.join_code);
    console.log('Join Code Type:', typeof tour.join_code);
    console.log('Join Code Length:', tour.join_code?.length);
    console.log('Status:', tour.status);

    console.log('\n🔍 Testing join code update...');
    const testCode = 'TESTCODE123';
    
    // Check if code exists
    const existing = await CustomTour.findOne({ 
      join_code: testCode,
      _id: { $ne: tourId }
    });
    
    console.log('Existing tour with test code:', existing ? 'YES' : 'NO');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugJoinCode();
