/**
 * Direct Database Notification Test
 * 
 * This script directly creates notifications in the database to test the system
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/tourlicity';

async function testNotificationSystem() {
  console.log('🔧 Testing Notification System (Direct DB)...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const Notification = require('./src/models/Notification');
    const User = require('./src/models/User');

    // Find a test user (tourist)
    const testUser = await User.findOne({ user_type: 'tourist' });
    if (!testUser) {
      console.log('❌ No tourist user found in database');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email} (${testUser.first_name} ${testUser.last_name})`);

    // Check existing notifications for this user
    const existingNotifications = await Notification.find({ recipient_id: testUser._id });
    console.log(`📊 Existing notifications for user: ${existingNotifications.length}`);

    // Create a test notification
    console.log('\n🔧 Creating test notification...');
    const testNotification = new Notification({
      recipient_id: testUser._id,
      type: 'system_announcement',
      title: 'Test Notification - Direct DB',
      message: 'This is a test notification created directly in the database to verify the notification system is working.',
      priority: 'high',
      channels: {
        push: true,
        email: false,
        sms: false,
        in_app: true
      }
    });

    await testNotification.save();
    console.log('✅ Test notification created:', testNotification._id);

    // Check notifications again
    const updatedNotifications = await Notification.find({ recipient_id: testUser._id });
    console.log(`📊 Updated notifications for user: ${updatedNotifications.length}`);

    // Display recent notifications
    console.log('\n📋 Recent notifications for user:');
    const recentNotifications = await Notification.find({ recipient_id: testUser._id })
      .sort({ created_date: -1 })
      .limit(5);

    recentNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.created_date}`);
      console.log(`     ${notif.message}`);
      console.log(`     Read: ${notif.is_read}, Priority: ${notif.priority}`);
    });

    // Test notification service
    console.log('\n🔧 Testing NotificationService...');
    const NotificationService = require('./src/services/notificationService');
    
    try {
      await NotificationService.createNotification({
        userId: testUser._id.toString(),
        type: 'tour_update',
        title: 'Test Service Notification',
        message: 'This notification was created using the NotificationService.',
        priority: 'normal'
      });
      console.log('✅ NotificationService test successful');
    } catch (serviceError) {
      console.log('❌ NotificationService test failed:', serviceError.message);
    }

    // Final count
    const finalNotifications = await Notification.find({ recipient_id: testUser._id });
    console.log(`\n📊 Final notification count: ${finalNotifications.length}`);

    // Test registration notification
    console.log('\n🔧 Testing registration notification...');
    const Registration = require('./src/models/Registration');
    const CustomTour = require('./src/models/CustomTour');

    // Find a test registration
    const testRegistration = await Registration.findOne({ tourist_id: testUser._id })
      .populate('custom_tour_id')
      .populate('tourist_id', 'first_name last_name email');

    if (testRegistration) {
      console.log(`✅ Found test registration for tour: ${testRegistration.custom_tour_id.tour_name}`);
      
      try {
        await NotificationService.createRegistrationNotification(
          testRegistration,
          'registration_approved'
        );
        console.log('✅ Registration notification test successful');
      } catch (regNotifError) {
        console.log('❌ Registration notification test failed:', regNotifError.message);
      }
    } else {
      console.log('ℹ️ No registration found for testing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testNotificationSystem().then(() => {
  console.log('\n🎯 Direct DB notification test completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});