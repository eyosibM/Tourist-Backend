/**
 * Fix Calendar Entries Dates
 * 
 * This script creates calendar entries within the tour template's date range
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/tourlicity';

async function fixCalendarEntriesDates() {
  console.log('🔧 Fixing Calendar Entries Dates...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const CalendarEntry = require('./src/models/CalendarEntry');
    const TourTemplate = require('./src/models/TourTemplate');
    const User = require('./src/models/User');

    // Find the tour template
    const tourTemplate = await TourTemplate.findOne({ is_active: true });
    if (!tourTemplate) {
      console.log('❌ No active tour template found');
      return;
    }

    console.log(`✅ Found tour template: ${tourTemplate.template_name}`);
    console.log(`📅 Template dates: ${tourTemplate.start_date} to ${tourTemplate.end_date}`);

    // Parse the template dates
    const startDate = new Date(tourTemplate.start_date);
    const endDate = new Date(tourTemplate.end_date);
    
    console.log(`📅 Parsed dates: ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // Find a test user
    const testUser = await User.findOne({ user_type: 'provider_admin' });
    if (!testUser) {
      console.log('❌ No provider admin found');
      return;
    }

    // Delete existing test entries
    await CalendarEntry.deleteMany({
      tour_template_id: tourTemplate._id,
      activity: { $regex: /Frontend Test Activity|Test Template Activity/ }
    });
    console.log('🧹 Deleted existing test entries');

    // Create new entries within the template date range
    const testEntries = [];
    
    // Create entries for the first few days of the template
    for (let i = 0; i < Math.min(3, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1); i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(startDate.getDate() + i);
      
      testEntries.push({
        tour_template_id: tourTemplate._id,
        entry_date: entryDate,
        activity: `Day ${i + 1} Activity`,
        activity_description: `Template activity for ${entryDate.toDateString()}`,
        activity_details: `This is a test activity within the template date range`,
        start_time: `${9 + i}:00`,
        end_time: `${12 + i}:00`,
        web_links: [`https://example.com/day${i + 1}`],
        created_by: testUser._id
      });
    }

    // Create the entries
    if (testEntries.length > 0) {
      const createdEntries = await CalendarEntry.insertMany(testEntries);
      console.log(`✅ Created ${createdEntries.length} calendar entries within template date range:`);
      
      createdEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.activity} - ${entry.entry_date.toDateString()}`);
      });
    }

    // Verify entries
    const allEntries = await CalendarEntry.find({ tour_template_id: tourTemplate._id });
    console.log(`\n📊 Total calendar entries for template: ${allEntries.length}`);

  } catch (error) {
    console.error('❌ Failed to fix calendar entries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
fixCalendarEntriesDates().then(() => {
  console.log('\n🎯 Calendar entries dates fixed successfully');
}).catch(error => {
  console.error('❌ Script failed:', error);
});