// Test script to debug default activities issue
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the model
const DefaultActivity = require('./src/models/DefaultActivity');

async function debugActivities() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check what's actually in the database
        console.log('\n📊 Checking database contents...');
        const allActivities = await DefaultActivity.find({});
        console.log(`📈 Total activities in database: ${allActivities.length}`);
        
        if (allActivities.length > 0) {
            console.log('\n📋 Activities found:');
            allActivities.forEach((activity, index) => {
                console.log(`${index + 1}. ${activity.activity_name} (Active: ${activity.is_active})`);
                console.log(`   ID: ${activity._id}`);
                console.log(`   Category: ${activity.category}`);
                console.log(`   Created: ${activity.created_date}`);
                console.log('');
            });
        }

        // Test different query scenarios
        console.log('\n🧪 Testing query scenarios...');
        
        // Test 1: All activities
        const allQuery = await DefaultActivity.find({});
        console.log(`Test 1 - All activities: ${allQuery.length}`);
        
        // Test 2: Active activities only
        const activeQuery = await DefaultActivity.find({ is_active: true });
        console.log(`Test 2 - Active activities: ${activeQuery.length}`);
        
        // Test 3: Inactive activities
        const inactiveQuery = await DefaultActivity.find({ is_active: false });
        console.log(`Test 3 - Inactive activities: ${inactiveQuery.length}`);
        
        // Test 4: With populate
        const populatedQuery = await DefaultActivity.find({}).populate('created_by');
        console.log(`Test 4 - With populate: ${populatedQuery.length}`);
        
        // Test 5: With sort
        const sortedQuery = await DefaultActivity.find({}).sort({ activity_name: 1 });
        console.log(`Test 5 - With sort: ${sortedQuery.length}`);

        console.log('\n✅ Database debug complete');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the debug
if (require.main === module) {
    debugActivities().catch(console.error);
}

module.exports = { debugActivities };