const { MongoClient } = require('mongodb');

async function debugCalendarEntries() {
  const client = new MongoClient('mongodb://localhost:27017', {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    const db = client.db('tourlicity');
    
    console.log('🔍 Debugging Tour Template Calendar Entries...\n');
    
    // Check all collections first
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    // Find the tour template by the ID from the logs
    const templateId = '68fa84f054d0c7798d289745';
    const { ObjectId } = require('mongodb');
    
    let template;
    try {
      template = await db.collection('tourtemplates').findOne({ _id: new ObjectId(templateId) });
    } catch (error) {
      console.log('Trying string ID...');
      template = await db.collection('tourtemplates').findOne({ _id: templateId });
    }
    
    if (!template) {
      // Try finding any template
      const templates = await db.collection('tourtemplates').find({}).toArray();
      console.log(`Found ${templates.length} tour templates total`);
      if (templates.length > 0) {
        template = templates[0];
        console.log('Using first available template');
      } else {
        console.log('❌ No tour template found');
        return;
      }
    }
    
    console.log('✅ Found tour template:');
    console.log(`   ID: ${template._id}`);
    console.log(`   Name: ${template.template_name}`);
    console.log(`   Start Date: ${template.start_date}`);
    console.log(`   End Date: ${template.end_date}\n`);
    
    // Find calendar entries for this template
    const entries = await db.collection('calendarentries').find({
      tour_template_id: template._id.toString()
    }).toArray();
    
    console.log(`📅 Found ${entries.length} calendar entries:`);
    entries.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.activity}`);
      console.log(`      Date: ${entry.entry_date} (Type: ${typeof entry.entry_date})`);
      console.log(`      Time: ${entry.start_time || 'Not set'}`);
      console.log(`      Description: ${entry.activity_description || 'None'}`);
      console.log('');
    });
    
    // Check date parsing
    console.log('🔍 Date parsing analysis:');
    console.log(`   Template start_date: ${template.start_date} (Type: ${typeof template.start_date})`);
    console.log(`   Template end_date: ${template.end_date} (Type: ${typeof template.end_date})`);
    
    if (entries.length > 0) {
      const firstEntry = entries[0];
      console.log(`   First entry date: ${firstEntry.entry_date} (Type: ${typeof firstEntry.entry_date})`);
      
      // Test date comparison
      const entryDateString = firstEntry.entry_date.substring(0, 10);
      console.log(`   Entry date string (first 10 chars): ${entryDateString}`);
      
      // Check if entry date falls within template range
      const templateStart = new Date(template.start_date);
      const templateEnd = new Date(template.end_date);
      const entryDate = new Date(firstEntry.entry_date);
      
      console.log(`   Template range: ${templateStart.toDateString()} to ${templateEnd.toDateString()}`);
      console.log(`   Entry date: ${entryDate.toDateString()}`);
      console.log(`   Entry within range: ${entryDate >= templateStart && entryDate <= templateEnd}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugCalendarEntries();