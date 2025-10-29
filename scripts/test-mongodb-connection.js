const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Try to connect with minimal settings
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 1,
      maxIdleTimeMS: 5000,
    });
    
    console.log('✅ MongoDB Connected successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();