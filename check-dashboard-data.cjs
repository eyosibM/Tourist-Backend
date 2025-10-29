const { MongoClient } = require('mongodb');

async function checkDashboardData() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('tourlicity');
    
    console.log('🔍 Checking Dashboard Data...\n');
    
    // Check collections and their counts
    const collections = [
      'customtours',
      'tourtemplates', 
      'users',
      'registrations',
      'providers'
    ];
    
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`📊 ${collectionName}: ${count} documents`);
      
      if (count > 0) {
        // Show sample data
        const sample = await db.collection(collectionName).findOne();
        console.log(`   Sample fields: ${Object.keys(sample).join(', ')}`);
        
        if (collectionName === 'customtours') {
          const activeTours = await db.collection(collectionName).countDocuments({ is_active: true });
          console.log(`   Active tours: ${activeTours}`);
          
          // Check the actual tour data
          const tour = await db.collection('customtours').findOne();
          console.log('   Tour details:');
          console.log(`     Name: ${tour.tour_name}`);
          console.log(`     Status: ${tour.status}`);
          console.log(`     Start Date: ${tour.start_date}`);
          console.log(`     End Date: ${tour.end_date}`);
          console.log(`     Provider ID: ${tour.provider_id}`);
          
          // Check if tour should be considered active
          const today = new Date();
          const startDate = new Date(tour.start_date);
          const endDate = new Date(tour.end_date);
          const isCurrentlyRunning = startDate <= today && endDate >= today;
          const isPublished = tour.status === 'published';
          
          console.log(`     Is Published: ${isPublished}`);
          console.log(`     Is Currently Running: ${isCurrentlyRunning}`);
          console.log(`     Should be Active: ${isPublished && isCurrentlyRunning}`);
        }
        
        if (collectionName === 'users') {
          const tourists = await db.collection(collectionName).countDocuments({ user_type: 'tourist' });
          const providerAdmins = await db.collection(collectionName).countDocuments({ user_type: 'provider_admin' });
          const systemAdmins = await db.collection(collectionName).countDocuments({ user_type: 'system_admin' });
          console.log(`   Tourists: ${tourists}`);
          console.log(`   Provider Admins: ${providerAdmins}`);
          console.log(`   System Admins: ${systemAdmins}`);
        }
        
        console.log('');
      }
    }
    
    // Check what the current user should see
    const currentUser = await db.collection('users').findOne({ email: 'opeyemioladejobi@gmail.com' });
    if (currentUser) {
      console.log('🔍 Current user context:');
      console.log(`   User Type: ${currentUser.user_type}`);
      console.log(`   Provider ID: ${currentUser.provider_id || 'None'}`);
      
      if (currentUser.user_type === 'provider_admin' && currentUser.provider_id) {
        // Check provider-specific data
        const providerTours = await db.collection('customtours').countDocuments({ 
          provider_id: currentUser.provider_id 
        });
        console.log(`   Provider's tours: ${providerTours}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDashboardData();