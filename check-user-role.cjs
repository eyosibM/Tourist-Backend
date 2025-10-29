const { MongoClient } = require('mongodb');

async function checkUserRole() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('tourlicity');
    
    console.log('🔍 Checking User Role...\n');
    
    const userEmail = 'opeyemioladejobi@gmail.com';
    const user = await db.collection('users').findOne({ email: userEmail });
    
    if (user) {
      console.log('✅ Found user:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   User Type: ${user.user_type}`);
      console.log(`   Provider ID: ${user.provider_id || 'None'}`);
      console.log(`   Created: ${user.created_date}`);
      console.log('');
      
      // Check what roles are allowed for default activities
      console.log('🔍 Default Activities API requires: system_admin OR provider_admin');
      console.log(`   Current user type: ${user.user_type}`);
      
      const hasAccess = user.user_type === 'system_admin' || user.user_type === 'provider_admin';
      console.log(`   Has access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
      
      if (!hasAccess) {
        console.log('\n💡 Solution: Update user role to provider_admin or system_admin');
        console.log('   Would you like me to update the user role? (This is just a suggestion)');
      }
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserRole();