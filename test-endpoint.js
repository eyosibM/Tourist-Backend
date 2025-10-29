const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    console.log(`Testing: http://localhost:5000${path}`);
    
    const req = http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
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
  const endpoints = ['/health', '/api/cache/stats'];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`✅ ${endpoint}: ${result.statusCode}`);
      if (result.data) {
        try {
          const parsed = JSON.parse(result.data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch {
          console.log('Raw response:', result.data.substring(0, 200));
        }
      }
    } catch (error) {
      console.error(`❌ ${endpoint}: ${error.message}`);
    }
    console.log('---');
  }
}

main();