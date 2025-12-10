/**
 * Debug script to check calendar entries in the database
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugCalendarEntries() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check tour templates
    console.log('📋 Tour Templates:');
    const templates = await db.collection('tourtemplates').find({}).toArray();
    console.log(`Found ${templates.length} tour templates`);
    templates.forEach(t => {
      console.log(`  - ${t.template_name} (ID: ${t._id})`);
    });

    // Check calendar entries for templates
    console.log('\n📅 Calendar Entries for Templates:');
    const templateEntries = await db.collection('calendarentries').find({ 
      tour_template_id: { $exists: true, $ne: null } 
    }).toArray();
    console.log(`Found ${templateEntries.length} calendar entries for templates`);
    templateEntries.forEach(e => {
      console.log(`  - Template ID: ${e.tour_template_id}, Activity: ${e.activity}, Date: ${e.entry_date}`);
    });

    // Check custom tours
    console.log('\n🎯 Custom Tours:');
    const customTours = await db.collection('customtours').find({}).toArray();
    console.log(`Found ${customTours.length} custom tours`);
    customTours.forEach(t => {
      console.log(`  - ${t.tour_name} (ID: ${t._id}, Template: ${t.tour_template_id || 'None'})`);
    });

    // Check calendar entries for custom tours
    console.log('\n📅 Calendar Entries for Custom Tours:');
    const customEntries = await db.collection('calendarentries').find({ 
      custom_tour_id: { $exists: true, $ne: null } 
    }).toArray();
    console.log(`Found ${customEntries.length} calendar entries for custom tours`);
    customEntries.forEach(e => {
      console.log(`  - Custom Tour ID: ${e.custom_tour_id}, Activity: ${e.activity}, Date: ${e.entry_date}`);
    });

    console.log('\n✅ Debug complete');
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugCalendarEntries();
