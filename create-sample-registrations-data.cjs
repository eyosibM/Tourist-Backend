const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function createSampleRegistrationsData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Creating Sample Registrations Data...\n');

    // Get existing data
    const usersCollection = mongoose.connection.db.collection('users');
    const providersCollection = mongoose.connection.db.collection('providers');
    const toursCollection = mongoose.connection.db.collection('customtours');
    const registrationsCollection = mongoose.connection.db.collection('registrations');

    // Get the system admin and provider
    const systemAdmin = await usersCollection.findOne({ user_type: 'system_admin' });
    const provider = await providersCollection.findOne({});

    if (!systemAdmin || !provider) {
      console.log('❌ Missing system admin or provider. Cannot create sample data.');
      return;
    }

    console.log(`✅ Found system admin: ${systemAdmin.email}`);
    console.log(`✅ Found provider: ${provider.provider_name}\n`);

    // 1. Create sample tourists
    console.log('1. Creating sample tourists...');
    const tourists = [
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'tourist',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'tourist',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'mike.johnson@example.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        user_type: 'tourist',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'sarah.wilson@example.com',
        first_name: 'Sarah',
        last_name: 'Wilson',
        user_type: 'tourist',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'david.brown@example.com',
        first_name: 'David',
        last_name: 'Brown',
        user_type: 'tourist',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      }
    ];

    await usersCollection.insertMany(tourists);
    console.log(`✅ Created ${tourists.length} sample tourists`);

    // 2. Create sample custom tours
    console.log('\n2. Creating sample custom tours...');
    const tours = [
      {
        _id: new mongoose.Types.ObjectId(),
        tour_name: 'Lagos City Explorer',
        description: 'Discover the vibrant culture and history of Lagos',
        start_date: '2025-12-01',
        end_date: '2025-12-05',
        max_tourists: 20,
        remaining_tourists: 15,
        price_per_person: 150000,
        provider_id: provider._id,
        created_by: systemAdmin._id,
        status: 'published',
        visibility: 'Public',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tour_name: 'Abuja Heritage Tour',
        description: 'Explore the capital city and its landmarks',
        start_date: '2025-11-15',
        end_date: '2025-11-18',
        max_tourists: 15,
        remaining_tourists: 10,
        price_per_person: 120000,
        provider_id: provider._id,
        created_by: systemAdmin._id,
        status: 'published',
        visibility: 'Public',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tour_name: 'Calabar Cultural Experience',
        description: 'Immerse yourself in Calabar culture and traditions',
        start_date: '2025-12-20',
        end_date: '2025-12-25',
        max_tourists: 25,
        remaining_tourists: 20,
        price_per_person: 200000,
        provider_id: provider._id,
        created_by: systemAdmin._id,
        status: 'published',
        visibility: 'Public',
        is_active: true,
        created_date: new Date(),
        updated_date: new Date()
      }
    ];

    await toursCollection.insertMany(tours);
    console.log(`✅ Created ${tours.length} sample custom tours`);

    // 3. Create sample registrations with different statuses
    console.log('\n3. Creating sample registrations...');
    const registrations = [
      // Pending registrations
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[0]._id,
        custom_tour_id: tours[0]._id,
        provider_id: provider._id,
        status: 'pending',
        registration_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[1]._id,
        custom_tour_id: tours[1]._id,
        provider_id: provider._id,
        status: 'pending',
        registration_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      // Approved registrations
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[2]._id,
        custom_tour_id: tours[0]._id,
        provider_id: provider._id,
        status: 'approved',
        registration_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // approved 3 days ago
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[3]._id,
        custom_tour_id: tours[2]._id,
        provider_id: provider._id,
        status: 'approved',
        registration_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // approved 4 days ago
      },
      // Rejected registration
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[4]._id,
        custom_tour_id: tours[1]._id,
        provider_id: provider._id,
        status: 'rejected',
        registration_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        created_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // rejected 4 days ago
      },
      // Additional approved registration
      {
        _id: new mongoose.Types.ObjectId(),
        tourist_id: tourists[0]._id,
        custom_tour_id: tours[2]._id,
        provider_id: provider._id,
        status: 'approved',
        registration_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updated_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // approved 1 day ago
      }
    ];

    await registrationsCollection.insertMany(registrations);
    console.log(`✅ Created ${registrations.length} sample registrations`);

    // 4. Display summary
    console.log('\n📊 Sample Data Summary:');
    console.log(`   Tourists: ${tourists.length}`);
    console.log(`   Custom Tours: ${tours.length}`);
    console.log(`   Registrations: ${registrations.length}`);
    
    const statusCounts = registrations.reduce((acc, reg) => {
      acc[reg.status] = (acc[reg.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n   Registration Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });

    console.log('\n✅ Sample data created successfully!');
    console.log('\n🎯 You can now:');
    console.log('   1. Visit http://localhost:3000/allregistrations to see the system admin view');
    console.log('   2. Test approval/rejection of pending registrations');
    console.log('   3. View registration statistics and management features');
    console.log('   4. Test the search and filtering functionality');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleRegistrationsData();