/**
 * Create Test Calendar Entry for Tour Template
 * 
 * This script creates a test calendar entry that persists for frontend testing
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/tourlicity';

async function createTestCalendarEntry() {
  console.log('🔧 Creating Test Calendar Entry for Tour Template...\n');

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

    // Find a test user
    const testUser = await User.findOne({ user_type: 'provider_admin' });
    if (!testUser) {
      console.log('❌ No provider admin found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email}`);

    // Check if test entry already exists
    const existingEntry = await CalendarEntry.findOne({
      tour_template_id: tourTemplate._id,
      activity: 'Frontend Test Activity'
    });

    if (existingEntry) {
      console.log('✅ Test calendar entry already exists:', existingEntry._id);
      return;
    }

    // Create test calendar entries for different dates
    const testEntries = [
      {
        tour_template_id: tourTemplate._id,
        entry_date: new Date('2025-11-15'),
        activity: 'Frontend Test Activity 1',
        activity_description: 'This is a test activity for frontend calendar display',
        activity_details: 'Testing tour template calendar functionality in the frontend',
        start_time: '09:00',
        end_time: '12:00',
        web_links: ['https://example.com/test1'],
        created_by: testUser._id
      },
      {
        tour_template_id: tourTemplate._id,
        entry_date: new Date('2025-11-16'),
        activity: 'Frontend Test Activity 2',
        activity_description: 'Another test activity for the next day',
        activity_details: 'Testing multiple calendar entries display',
        start_time: '14:00',
        end_time: '17:00',
        web_links: ['https://example.com/test2'],
        created_by: testUser._id
      },
      {
        tour_template_id: tourTemplate._id,
        entry_date: new Date('2025-11-17'),
        activity: 'Frontend Test Activity 3',
        activity_description: 'Third test activity for comprehensive testing',
        activity_details: 'Testing calendar entry editing and deletion',
        start_time: '10:00',
        end_time: '15:00',
        web_links: ['https://example.com/test3'],
        created_by: testUser._id
      }
    ];

    // Create all test entries
    const createdEntries = await CalendarEntry.insertMany(testEntries);
    console.log(`✅ Created ${createdEntries.length} test calendar entries`);

    createdEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.activity} - ${entry.entry_date.toDateString()}`);
    });

    // Verify entries were created
    const allTemplateEntries = await CalendarEntry.find({ tour_template_id: tourTemplate._id });
    console.log(`\n📊 Total calendar entries for template: ${allTemplateEntries.length}`);

  } catch (error) {
    console.error('❌ Failed to create test entries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
createTestCalendarEntry().then(() => {
  console.log('\n🎯 Test calendar entries created successfully');
}).catch(error => {
  console.error('❌ Script failed:', error);
});