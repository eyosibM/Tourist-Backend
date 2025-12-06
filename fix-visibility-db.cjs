// Script to manually update visibility in database
const mongoose = require('mongoose');

async function fixVisibility() {
  try {
    // Connect directly to production MongoDB
    const mongoUri = 'mongodb://admin:tourlicity2024@51.20.34.93:27017/tourlicity?authSource=admin';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Update the specific template
    const result = await mongoose.connection.db.collection('tourtemplates').updateOne(
      { _id: new mongoose.Types.ObjectId('692ef4c858760fc46904510d') },
      { $set: { visibility: 'Private' } }
    );

    console.log('Update result:', result);

    // Verify the update
    const template = await mongoose.connection.db.collection('tourtemplates').findOne(
      { _id: new mongoose.Types.ObjectId('692ef4c858760fc46904510d') },
      { projection: { template_name: 1, visibility: 1, updated_date: 1 } }
    );

    console.log('Template after update:', template);

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVisibility();
