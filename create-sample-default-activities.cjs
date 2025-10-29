const { MongoClient } = require('mongodb');

async function createSampleDefaultActivities() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('tourlicity');
    
    console.log('🔍 Creating Sample Default Activities...\n');
    
    const sampleActivities = [
      {
        activity_name: 'City Walking Tour',
        activity_description: 'Explore the historic city center with a local guide',
        category: 'Sightseeing',
        duration: '2 hours',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        activity_name: 'Local Food Tasting',
        activity_description: 'Sample traditional local cuisine and delicacies',
        category: 'Food & Drink',
        duration: '1.5 hours',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        activity_name: 'Museum Visit',
        activity_description: 'Visit the local history and culture museum',
        category: 'Culture',
        duration: '2.5 hours',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        activity_name: 'Scenic Viewpoint',
        activity_description: 'Visit the best viewpoint for panoramic city views',
        category: 'Sightseeing',
        duration: '1 hour',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        activity_name: 'Shopping District Tour',
        activity_description: 'Explore local markets and shopping areas',
        category: 'Shopping',
        duration: '2 hours',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      }
    ];
    
    // Check if activities already exist
    const existingCount = await db.collection('defaultactivities').countDocuments();
    console.log(`📊 Current default activities in database: ${existingCount}`);
    
    if (existingCount < 5) {
      const result = await db.collection('defaultactivities').insertMany(sampleActivities);
      console.log(`✅ Created ${result.insertedCount} new default activities`);
      
      // List all activities
      const allActivities = await db.collection('defaultactivities').find({}).toArray();
      console.log(`\n📋 Total activities now: ${allActivities.length}`);
      allActivities.forEach((activity, i) => {
        console.log(`   ${i + 1}. ${activity.activity_name}`);
      });
    } else {
      console.log('✅ Sufficient default activities already exist');
      
      // List existing activities
      const allActivities = await db.collection('defaultactivities').find({}).toArray();
      console.log(`\n📋 Existing activities: ${allActivities.length}`);
      allActivities.forEach((activity, i) => {
        console.log(`   ${i + 1}. ${activity.activity_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createSampleDefaultActivities();