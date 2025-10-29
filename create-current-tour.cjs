const { MongoClient } = require('mongodb');

async function createCurrentTour() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('tourlicity');
    
    console.log('🔍 Creating a Currently Running Tour...\n');
    
    // Get the existing provider and tour template
    const provider = await db.collection('providers').findOne();
    const template = await db.collection('tourtemplates').findOne();
    const user = await db.collection('users').findOne({ user_type: 'system_admin' });
    
    if (!provider || !template || !user) {
      console.log('❌ Missing required data (provider, template, or user)');
      return;
    }
    
    // Create a tour that's currently running (started yesterday, ends in 5 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1); // Started yesterday
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5); // Ends in 5 days
    
    const currentTour = {
      provider_id: provider._id,
      tour_template_id: template._id,
      tour_name: 'Current Active Tour - City Explorer',
      start_date: startDate,
      end_date: endDate,
      status: 'published',
      viewAccessibility: 'public',
      join_code: 'ACTIVE2025',
      max_tourists: 20,
      remaining_tourists: 15,
      group_chat_link: 'https://chat.example.com/active-tour',
      features_media: [],
      features_image: null,
      teaser_images: [],
      web_links: [],
      created_by: user._id,
      created_date: new Date(),
      updated_date: new Date()
    };
    
    const result = await db.collection('customtours').insertOne(currentTour);
    console.log('✅ Created currently running tour:');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Name: ${currentTour.tour_name}`);
    console.log(`   Start Date: ${startDate.toDateString()}`);
    console.log(`   End Date: ${endDate.toDateString()}`);
    console.log(`   Status: ${currentTour.status}`);
    
    // Verify the tour is considered active
    const isCurrentlyRunning = startDate <= today && endDate >= today;
    const isPublished = currentTour.status === 'published';
    console.log(`   Should be Active: ${isPublished && isCurrentlyRunning} ✅`);
    
    // Also create a registration for this tour to show tourist count
    const tourist = await db.collection('users').findOne({ user_type: 'tourist' });
    if (tourist) {
      const registration = {
        custom_tour_id: result.insertedId,
        tourist_id: tourist._id,
        provider_id: provider._id,
        status: 'approved',
        tourist_first_name: tourist.first_name,
        tourist_last_name: tourist.last_name,
        tourist_email: tourist.email,
        tour_name: currentTour.tour_name,
        created_by: tourist._id,
        created_date: new Date(),
        updated_date: new Date()
      };
      
      await db.collection('registrations').insertOne(registration);
      console.log('✅ Created registration for the active tour');
    }
    
    console.log('\n🎉 Dashboard should now show:');
    console.log('   Active Tours: 1 (or more)');
    console.log('   Total Tourists: 1 (or more)');
    console.log('   Provider Admins: 1');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createCurrentTour();