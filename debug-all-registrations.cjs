const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugAllRegistrations() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    console.log('🔍 Debugging All Registrations Data...\n');

    // Check registrations collection
    console.log('1. Checking registrations collection...');
    const registrationsCollection = mongoose.connection.db.collection('registrations');
    const registrationsCount = await registrationsCollection.countDocuments();
    console.log(`   Total registrations in database: ${registrationsCount}`);

    if (registrationsCount > 0) {
      const sampleRegistrations = await registrationsCollection.find({}).limit(3).toArray();
      console.log('   Sample registrations:');
      sampleRegistrations.forEach((reg, index) => {
        console.log(`   ${index + 1}. ID: ${reg._id}, Status: ${reg.status}, Tourist: ${reg.tourist_id}, Tour: ${reg.custom_tour_id}`);
      });
    }

    // Check users collection
    console.log('\n2. Checking users collection...');
    const usersCollection = mongoose.connection.db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    console.log(`   Total users in database: ${usersCount}`);

    if (usersCount > 0) {
      const sampleUsers = await usersCollection.find({}).limit(3).toArray();
      console.log('   Sample users:');
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user._id}, Email: ${user.email}, Type: ${user.user_type}, Name: ${user.first_name} ${user.last_name}`);
      });
    }

    // Check custom tours collection
    console.log('\n3. Checking customtours collection...');
    const toursCollection = mongoose.connection.db.collection('customtours');
    const toursCount = await toursCollection.countDocuments();
    console.log(`   Total custom tours in database: ${toursCount}`);

    if (toursCount > 0) {
      const sampleTours = await toursCollection.find({}).limit(3).toArray();
      console.log('   Sample tours:');
      sampleTours.forEach((tour, index) => {
        console.log(`   ${index + 1}. ID: ${tour._id}, Name: ${tour.tour_name}, Provider: ${tour.provider_id}, Status: ${tour.status}`);
      });
    }

    // Check providers collection
    console.log('\n4. Checking providers collection...');
    const providersCollection = mongoose.connection.db.collection('providers');
    const providersCount = await providersCollection.countDocuments();
    console.log(`   Total providers in database: ${providersCount}`);

    if (providersCount > 0) {
      const sampleProviders = await providersCollection.find({}).limit(3).toArray();
      console.log('   Sample providers:');
      sampleProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ID: ${provider._id}, Name: ${provider.provider_name}, Status: ${provider.status}`);
      });
    }

    // Check system admin user
    console.log('\n5. Checking system admin user...');
    const systemAdmin = await usersCollection.findOne({ user_type: 'system_admin' });
    if (systemAdmin) {
      console.log(`   System admin found: ${systemAdmin.email} (${systemAdmin.first_name} ${systemAdmin.last_name})`);
    } else {
      console.log('   No system admin user found');
    }

    // Check registration status distribution
    if (registrationsCount > 0) {
      console.log('\n6. Registration status distribution...');
      const statusCounts = await registrationsCollection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      statusCounts.forEach(status => {
        console.log(`   ${status._id || 'undefined'}: ${status.count}`);
      });
    }

    // Check for any data relationships
    if (registrationsCount > 0) {
      console.log('\n7. Checking data relationships...');
      const registrationWithDetails = await registrationsCollection.aggregate([
        { $limit: 1 },
        {
          $lookup: {
            from: 'users',
            localField: 'tourist_id',
            foreignField: '_id',
            as: 'tourist'
          }
        },
        {
          $lookup: {
            from: 'customtours',
            localField: 'custom_tour_id',
            foreignField: '_id',
            as: 'tour'
          }
        }
      ]).toArray();

      if (registrationWithDetails.length > 0) {
        const reg = registrationWithDetails[0];
        console.log(`   Registration ${reg._id}:`);
        console.log(`     Tourist found: ${reg.tourist.length > 0 ? 'Yes' : 'No'}`);
        console.log(`     Tour found: ${reg.tour.length > 0 ? 'Yes' : 'No'}`);
        if (reg.tourist.length > 0) {
          console.log(`     Tourist: ${reg.tourist[0].first_name} ${reg.tourist[0].last_name} (${reg.tourist[0].email})`);
        }
        if (reg.tour.length > 0) {
          console.log(`     Tour: ${reg.tour[0].tour_name}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAllRegistrations();