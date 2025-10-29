const http = require('http');

async function checkServerHealth() {
  console.log('🔍 Testing server health...\n');
  
  const tests = [
    { name: 'Basic Health Check', path: '/health' },
    { name: 'Cache Statistics', path: '/api/cache/stats' },
    { name: 'VAPID Key', path: '/api/notifications/vapid-key' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await makeRequest(test.path);
      
      if (result.statusCode === 200) {
        console.log(`✅ ${test.name}: SUCCESS`);
        if (test.path === '/health') {
          try {
            const health = JSON.parse(result.data);
            console.log(`   Status: ${health.status}`);
            console.log(`   Database: ${health.services?.database || 'unknown'}`);
            console.log(`   Redis: ${health.services?.redis || 'unknown'}`);
            console.log(`   Cache Keys: ${health.cache?.keys || 'N/A'}`);
          } catch (e) {
            console.log(`   Raw response: ${result.data.substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`❌ ${test.name}: HTTP ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    console.log('');
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
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

// Wait a moment for server to start, then test
setTimeout(() => {
  checkServerHealth().then(() => {
    console.log('🎉 Health check completed!');
  }).catch((error) => {
    console.error('❌ Health check failed:', error);
  });
}, 3000);

console.log('⏳ Waiting for server to start...');