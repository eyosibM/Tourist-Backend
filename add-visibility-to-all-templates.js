// Migration script to add visibility field to all existing templates
const mongoose = require('mongoose');
require('dotenv').config();

async function addVisibilityToTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all templates that don't have a visibility field
    const result = await mongoose.connection.db.collection('tourtemplates').updateMany(
      { visibility: { $exists: false } },
      { $set: { visibility: 'Public' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} templates with default visibility`);

    // Verify all templates now have visibility
    const templates = await mongoose.connection.db.collection('tourtemplates').find(
      {},
      { projection: { template_name: 1, visibility: 1 } }
    ).toArray();

    console.log('\n📋 All templates:');
    templates.forEach(t => {
      console.log(`  - ${t.template_name}: ${t.visibility}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Migration complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addVisibilityToTemplates();
