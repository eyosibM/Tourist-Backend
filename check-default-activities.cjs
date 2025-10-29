const { MongoClient } = require('mongodb');

async function checkDefaultActivities() {
  const client = new MongoClient('mongodb://localhost:27017', {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });
  
  try {
    console.log('🔍 Checking Default Activities in Database...\n');
    
    await client.connect();
    const db = client.db('tourlicity');
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Check for default activities
    const activitiesCollection = collections.find(col => 
      col.name.toLowerCase().includes('activit')
    );
    
    if (activitiesCollection) {
      console.log(`✅ Found activities collection: ${activitiesCollection.name}`);
      
      const activities = await db.collection(activitiesCollection.name).find({}).toArray();
      console.log(`📊 Found ${activities.length} activities in database`);
      
      if (activities.length > 0) {
        console.log('\n📋 Activities:');
        activities.forEach((activity, i) => {
          console.log(`   ${i + 1}. ${activity.activity_name || activity.name || 'Unnamed'}`);
          console.log(`      ID: ${activity._id}`);
          console.log(`      Active: ${activity.is_active !== false ? 'Yes' : 'No'} (value: ${activity.is_active}, type: ${typeof activity.is_active})`);
          console.log('');
        });
      } else {
        console.log('\n❌ No activities found in database');
        console.log('💡 You may need to create some default activities first');
      }
    } else {
      console.log('❌ No activities collection found');
      console.log('💡 The default activities collection may not exist yet');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDefaultActivities();