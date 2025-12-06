/**
 * Migration script to convert visibility values from capitalized to lowercase
 * Run this after updating the model enum values
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixVisibilityCase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Fix TourTemplate visibility
    console.log('\n📋 Fixing TourTemplate visibility values...');
    const templateResult = await db.collection('tourtemplates').updateMany(
      { visibility: { $in: ['Public', 'Private'] } },
      [
        {
          $set: {
            visibility: {
              $cond: {
                if: { $eq: ['$visibility', 'Public'] },
                then: 'public',
                else: 'private'
              }
            }
          }
        }
      ]
    );
    console.log(`✅ Updated ${templateResult.modifiedCount} tour templates`);

    // Fix CustomTour visibility (if any have capitalized values)
    console.log('\n📋 Fixing CustomTour visibility values...');
    const tourResult = await db.collection('customtours').updateMany(
      { visibility: { $in: ['Public', 'Private'] } },
      [
        {
          $set: {
            visibility: {
              $cond: {
                if: { $eq: ['$visibility', 'Public'] },
                then: 'public',
                else: 'private'
              }
            }
          }
        }
      ]
    );
    console.log(`✅ Updated ${tourResult.modifiedCount} custom tours`);

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const templatesWithCapitalized = await db.collection('tourtemplates').countDocuments({
      visibility: { $in: ['Public', 'Private'] }
    });
    const toursWithCapitalized = await db.collection('customtours').countDocuments({
      visibility: { $in: ['Public', 'Private'] }
    });

    if (templatesWithCapitalized === 0 && toursWithCapitalized === 0) {
      console.log('✅ All visibility values successfully converted to lowercase');
    } else {
      console.log(`⚠️ Warning: ${templatesWithCapitalized} templates and ${toursWithCapitalized} tours still have capitalized values`);
    }

    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixVisibilityCase();
