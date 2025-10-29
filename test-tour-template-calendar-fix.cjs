/**
 * Test Tour Template Calendar Fix
 * 
 * This script tests the tour template calendar entry functionality
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/tourlicity';

async function testTourTemplateCalendar() {
  console.log('🔧 Testing Tour Template Calendar Functionality...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const CalendarEntry = require('./src/models/CalendarEntry');
    const TourTemplate = require('./src/models/TourTemplate');
    const User = require('./src/models/User');

    // Find a tour template
    const tourTemplate = await TourTemplate.findOne({ is_active: true });
    if (!tourTemplate) {
      console.log('❌ No active tour template found');
      return;
    }

    console.log(`✅ Found tour template: ${tourTemplate.template_name} (ID: ${tourTemplate._id})`);

    // Check existing calendar entries for this template
    const existingEntries = await CalendarEntry.find({ tour_template_id: tourTemplate._id });
    console.log(`📊 Existing calendar entries for template: ${existingEntries.length}`);

    if (existingEntries.length > 0) {
      console.log('\n📋 Existing entries:');
      existingEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.activity} - ${entry.entry_date}`);
      });
    }

    // Find a test user (provider admin)
    let testUser = await User.findOne({ 
      user_type: 'provider_admin',
      provider_id: tourTemplate.provider_id 
    });

    if (!testUser) {
      console.log('⚠️ No provider admin found for this template, using any provider admin');
      testUser = await User.findOne({ user_type: 'provider_admin' });
    }

    if (!testUser) {
      console.log('❌ No provider admin found at all');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email}`);

    // Create a test calendar entry for the tour template
    console.log('\n🔧 Creating test calendar entry for tour template...');
    
    const testEntry = new CalendarEntry({
      tour_template_id: tourTemplate._id,
      entry_date: new Date('2025-12-01'),
      activity: 'Test Template Activity',
      activity_description: 'This is a test activity for the tour template calendar system',
      activity_details: 'Testing tour template calendar functionality',
      start_time: '09:00',
      end_time: '12:00',
      web_links: ['https://example.com/test'],
      created_by: testUser._id
    });

    await testEntry.save();
    console.log('✅ Test calendar entry created:', testEntry._id);

    // Verify the entry was created correctly
    const createdEntry = await CalendarEntry.findById(testEntry._id)
      .populate('tour_template_id', 'template_name')
      .populate('created_by', 'first_name last_name email');

    console.log('\n📋 Created entry details:');
    console.log(`  ID: ${createdEntry._id}`);
    console.log(`  Template: ${createdEntry.tour_template_id?.template_name}`);
    console.log(`  Activity: ${createdEntry.activity}`);
    console.log(`  Date: ${createdEntry.entry_date}`);
    console.log(`  Time: ${createdEntry.start_time} - ${createdEntry.end_time}`);
    console.log(`  Created by: ${createdEntry.created_by?.email}`);

    // Test querying calendar entries by tour template
    console.log('\n🔧 Testing calendar entry queries...');
    
    const templateEntries = await CalendarEntry.find({ tour_template_id: tourTemplate._id })
      .populate('tour_template_id', 'template_name')
      .sort({ entry_date: 1 });

    console.log(`✅ Found ${templateEntries.length} entries for tour template`);

    templateEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.activity} (${entry.entry_date.toDateString()})`);
    });

    // Test the backend API endpoint (simulate the request)
    console.log('\n🔧 Testing backend API logic...');
    
    // Simulate the controller logic
    const query = { tour_template_id: tourTemplate._id };
    const apiEntries = await CalendarEntry.find(query)
      .populate('created_by', 'first_name last_name')
      .sort({ entry_date: 1, start_time: 1 });

    console.log(`✅ API query returned ${apiEntries.length} entries`);

    // Test permissions logic
    console.log('\n🔧 Testing permission logic...');
    
    const userProviderId = testUser.provider_id?.toString();
    const templateProviderId = tourTemplate.provider_id?.toString();
    const hasAccess = userProviderId === templateProviderId;
    
    console.log(`  User provider ID: ${userProviderId}`);
    console.log(`  Template provider ID: ${templateProviderId}`);
    console.log(`  Access granted: ${hasAccess ? '✅' : '❌'}`);

    // Clean up test entry
    console.log('\n🧹 Cleaning up test entry...');
    await CalendarEntry.findByIdAndDelete(testEntry._id);
    console.log('✅ Test entry deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testTourTemplateCalendar().then(() => {
  console.log('\n🎯 Tour template calendar test completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});