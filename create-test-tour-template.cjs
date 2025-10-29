const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define TourTemplate schema (simplified)
const tourTemplateSchema = new mongoose.Schema({
  template_name: { type: String, required: true },
  description: String,
  duration_days: Number,
  max_participants: Number,
  price_per_person: Number,
  difficulty_level: String,
  location: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true },
  created_date: { type: Date, default: Date.now }
});

const TourTemplate = mongoose.model('TourTemplate', tourTemplateSchema);

async function createTestTourTemplate() {
  try {
    console.log('🔍 Checking for existing tour templates...');
    
    // Check if tour template already exists
    const existingTemplate = await TourTemplate.findOne({ template_name: 'Test Tour Template' });
    
    if (existingTemplate) {
      console.log('✅ Tour template already exists:', {
        id: existingTemplate._id,
        name: existingTemplate.template_name,
        description: existingTemplate.description,
        duration: existingTemplate.duration_days,
        active: existingTemplate.is_active
      });
    } else {
      console.log('❌ No test tour template found. Creating one...');
      
      // Get the test user ID
      const User = mongoose.model('User', new mongoose.Schema({
        email: String,
        first_name: String,
        last_name: String,
        user_type: String
      }));
      
      const testUser = await User.findOne({ email: 'opeyemioladejobi@gmail.com' });
      if (!testUser) {
        console.log('❌ Test user not found. Please run create-test-user.cjs first.');
        return;
      }
      
      const testTemplate = new TourTemplate({
        template_name: 'Test Tour Template',
        description: 'This is a test tour template for document upload testing. It includes various activities and locations for comprehensive testing of the tour template document system.',
        duration_days: 5,
        max_participants: 20,
        price_per_person: 299.99,
        difficulty_level: 'moderate',
        location: 'Lagos, Nigeria',
        created_by: testUser._id,
        is_active: true
      });
      
      await testTemplate.save();
      console.log('✅ Test tour template created:', {
        id: testTemplate._id,
        name: testTemplate.template_name,
        description: testTemplate.description,
        duration: testTemplate.duration_days,
        price: testTemplate.price_per_person,
        location: testTemplate.location
      });
    }
    
    // List all tour templates
    console.log('\n🗂️ All tour templates in database:');
    const allTemplates = await TourTemplate.find({}).select('template_name description duration_days is_active created_by');
    allTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.template_name} - ${template.duration_days} days - ${template.is_active ? 'Active' : 'Inactive'}`);
    });
    
    if (allTemplates.length === 0) {
      console.log('   No tour templates found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestTourTemplate();