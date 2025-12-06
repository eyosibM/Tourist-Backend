const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateVisibilityField() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const customToursCollection = db.collection('customtours');

    console.log('\n📊 Checking existing documents...');
    const totalDocs = await customToursCollection.countDocuments();
    console.log(`Total custom tours: ${totalDocs}`);

    const docsWithOldField = await customToursCollection.countDocuments({ viewAccessibility: { $exists: true } });
    console.log(`Documents with viewAccessibility field: ${docsWithOldField}`);

    if (docsWithOldField === 0) {
      console.log('✅ No documents need migration');
      await mongoose.connection.close();
      return;
    }

    console.log('\n🔄 Starting migration...');

    // Migrate viewAccessibility to visibility with proper capitalization
    const result = await customToursCollection.updateMany(
      { viewAccessibility: { $exists: true } },
      [
        {
          $set: {
            visibility: {
              $cond: {
                if: { $eq: ['$viewAccessibility', 'public'] },
                then: 'Public',
                else: 'Private'
              }
            }
          }
        },
        {
          $unset: 'viewAccessibility'
        }
      ]
    );

    console.log(`✅ Migration complete!`);
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const docsWithNewField = await customToursCollection.countDocuments({ visibility: { $exists: true } });
    const docsStillWithOldField = await customToursCollection.countDocuments({ viewAccessibility: { $exists: true } });
    
    console.log(`Documents with visibility field: ${docsWithNewField}`);
    console.log(`Documents still with viewAccessibility field: ${docsStillWithOldField}`);

    if (docsStillWithOldField === 0) {
      console.log('✅ All documents successfully migrated!');
    } else {
      console.log('⚠️ Some documents still have the old field');
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration script completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateVisibilityField();
