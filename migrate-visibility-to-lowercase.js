const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateVisibilityToLowercase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const customToursCollection = db.collection('customtours');

    console.log('\n📊 Checking existing documents...');
    const totalDocs = await customToursCollection.countDocuments();
    console.log(`Total custom tours: ${totalDocs}`);

    const docsWithCapitalizedVisibility = await customToursCollection.countDocuments({ 
      visibility: { $in: ['Public', 'Private'] } 
    });
    console.log(`Documents with capitalized visibility: ${docsWithCapitalizedVisibility}`);

    if (docsWithCapitalizedVisibility === 0) {
      console.log('✅ No documents need migration');
      await mongoose.connection.close();
      return;
    }

    console.log('\n🔄 Starting migration...');

    // Convert Public -> public
    const publicResult = await customToursCollection.updateMany(
      { visibility: 'Public' },
      { $set: { visibility: 'public' } }
    );
    console.log(`✅ Converted 'Public' to 'public': ${publicResult.modifiedCount} documents`);

    // Convert Private -> private
    const privateResult = await customToursCollection.updateMany(
      { visibility: 'Private' },
      { $set: { visibility: 'private' } }
    );
    console.log(`✅ Converted 'Private' to 'private': ${privateResult.modifiedCount} documents`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const docsWithLowercaseVisibility = await customToursCollection.countDocuments({ 
      visibility: { $in: ['public', 'private'] } 
    });
    const docsStillCapitalized = await customToursCollection.countDocuments({ 
      visibility: { $in: ['Public', 'Private'] } 
    });
    
    console.log(`Documents with lowercase visibility: ${docsWithLowercaseVisibility}`);
    console.log(`Documents still capitalized: ${docsStillCapitalized}`);

    if (docsStillCapitalized === 0) {
      console.log('✅ All documents successfully migrated!');
    } else {
      console.log('⚠️ Some documents still have capitalized visibility');
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration script completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateVisibilityToLowercase();
