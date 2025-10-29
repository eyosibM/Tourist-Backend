const http = require('http');

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData
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

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testNewEndpoints() {
  console.log('🧪 Testing New API Endpoints...\n');

  const tests = [
    { name: 'Health Check', path: '/health' },
    { name: 'Reviews (Public)', path: '/api/reviews' },
    { name: 'Locations Search', path: '/api/locations' },
    { name: 'Bookings Availability', path: '/api/bookings/availability' },
    { name: 'Payments (No Auth)', path: '/api/payments' },
    { name: 'VAPID Key', path: '/api/notifications/vapid-key' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await testEndpoint(test.path);
      
      if (result.statusCode === 200) {
        console.log(`✅ ${test.name}: SUCCESS (${result.statusCode})`);
      } else if (result.statusCode === 401) {
        console.log(`🔒 ${test.name}: AUTH REQUIRED (${result.statusCode}) - Expected`);
      } else if (result.statusCode === 404) {
        console.log(`❓ ${test.name}: NOT FOUND (${result.statusCode})`);
      } else {
        console.log(`⚠️  ${test.name}: ${result.statusCode}`);
        if (result.data) {
          try {
            const parsed = JSON.parse(result.data);
            console.log(`   Error: ${parsed.error || 'Unknown error'}`);
          } catch {
            console.log(`   Raw: ${result.data.substring(0, 100)}...`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎉 Endpoint testing completed!');
}

testNewEndpoints().catch(console.error);