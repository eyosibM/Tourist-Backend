// Script to manually set Test Tour Template to Private
const mongoose = require('mongoose');
require('dotenv').config();

async function setTestTemplatePrivate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update the Test Tour Template to Private
    const result = await mongoose.connection.db.collection('tourtemplates').updateOne(
      { template_name: 'Test Tour Template' },
      { $set: { visibility: 'Private' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} template(s)`);

    // Verify the update
    const template = await mongoose.connection.db.collection('tourtemplates').findOne(
      { template_name: 'Test Tour Template' },
      { projection: { template_name: 1, visibility: 1, updated_date: 1 } }
    );

    console.log('\n📋 Test Tour Template:');
    console.log(template);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setTestTemplatePrivate();
