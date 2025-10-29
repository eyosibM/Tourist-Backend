const { exec } = require('child_process');
const mongoose = require('mongoose');

async function restartServer() {
  console.log('🔄 Restarting server with fresh connections...');
  
  try {
    // Close any existing mongoose connections
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing existing MongoDB connections...');
      await mongoose.disconnect();
      console.log('✅ MongoDB connections closed');
    }
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🚀 Starting server...');
    
    // Start the server
    const serverProcess = exec('node src/server.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Server error:', error);
        return;
      }
      if (stderr) {
        console.error('Server stderr:', stderr);
        return;
      }
      console.log('Server stdout:', stdout);
    });
    
    // Handle server output
    serverProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    // Handle process exit
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping server...');
      serverProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Restart failed:', error);
    process.exit(1);
  }
}

restartServer();