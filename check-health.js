const http = require('http');

function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          resolve(healthData);
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  try {
    console.log('🔍 Checking server health...');
    const health = await checkHealth();
    console.log('📊 Health Status:');
    console.log(JSON.stringify(health, null, 2));
    
    if (health.services) {
      console.log('\n📋 Summary:');
      console.log(`Status: ${health.status}`);
      console.log(`Database: ${health.services.database}`);
      console.log(`Redis: ${health.services.redis}`);
      console.log(`Cache Keys: ${health.cache?.keys || 'N/A'}`);
      console.log(`Uptime: ${Math.round(health.uptime)} seconds`);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

main();