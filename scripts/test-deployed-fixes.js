#!/usr/bin/env node

/**
 * Test script for deployed fixes
 * Tests root route, health endpoints, and Redis connection handling
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TESTS = [
  {
    name: 'Root Route Test',
    path: '/',
    expectedStatus: 200,
    expectedContent: 'Welcome to Tourlicity API Backend'
  },
  {
    name: 'Health Check Test',
    path: '/health',
    expectedStatus: 200,
    expectedContent: 'status'
  },
  {
    name: 'Detailed Health Test',
    path: '/health/detailed',
    expectedStatus: 200,
    expectedContent: 'database'
  },
  {
    name: 'API Documentation Test',
    path: '/api-docs/',
    expectedStatus: 200,
    expectedContent: 'swagger-ui'
  },
  {
    name: 'API Endpoint Test',
    path: '/api/auth/profile',
    expectedStatus: 401, // Should require auth
    expectedContent: 'token'
  }
];

/**
 * Make HTTP request
 */
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Run a single test
 */
async function runTest(baseUrl, test) {
  const url = baseUrl + test.path;
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await makeRequest(url);
    
    // Check status code
    const statusMatch = response.status === test.expectedStatus;
    console.log(`   Status: ${response.status} ${statusMatch ? '✅' : '❌'} (expected ${test.expectedStatus})`);
    
    // Check content
    const contentMatch = response.body.includes(test.expectedContent);
    console.log(`   Content: ${contentMatch ? '✅' : '❌'} (looking for "${test.expectedContent}")`);
    
    // Show response preview
    const preview = response.body.substring(0, 200);
    console.log(`   Preview: ${preview}${response.body.length > 200 ? '...' : ''}`);
    
    return {
      name: test.name,
      url,
      passed: statusMatch && contentMatch,
      status: response.status,
      expectedStatus: test.expectedStatus,
      contentMatch,
      response: response.body
    };
    
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
    return {
      name: test.name,
      url,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Test Redis connection handling
 */
async function testRedisHandling() {
  console.log('\n🔧 Testing Redis Connection Handling...');
  
  // This would typically be done by checking logs or monitoring
  // For now, we'll just verify the notification service doesn't crash
  try {
    const url = `${BASE_URL}/api/notifications`;
    const response = await makeRequest(url);
    
    console.log(`   Notifications endpoint: ${response.status >= 200 && response.status < 500 ? '✅' : '❌'}`);
    console.log(`   Status: ${response.status}`);
    
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    console.log(`   Redis test error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Testing Deployed Fixes');
  console.log('========================');
  
  const results = [];
  
  // Test production deployment
  console.log(`\n📡 Testing Production: ${BASE_URL}`);
  for (const test of TESTS) {
    const result = await runTest(BASE_URL, test);
    results.push({ ...result, environment: 'production' });
  }
  
  // Test Redis handling
  const redisResult = await testRedisHandling();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\nProduction Tests: ${passed}/${total} passed`);
  console.log(`Redis Handling: ${redisResult ? '✅' : '❌'}`);
  
  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} - ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  const failedTests = results.filter(r => !r.passed);
  
  if (failedTests.length === 0 && redisResult) {
    console.log('   ✅ All tests passed! Deployment fixes are working correctly.');
  } else {
    if (failedTests.length > 0) {
      console.log('   ⚠️  Some tests failed. Check the following:');
      failedTests.forEach(test => {
        console.log(`     - ${test.name}: ${test.error || 'Status/content mismatch'}`);
      });
    }
    
    if (!redisResult) {
      console.log('   ⚠️  Redis connection handling may need attention');
    }
  }
  
  return {
    totalTests: total,
    passedTests: passed,
    redisHandling: redisResult,
    allPassed: passed === total && redisResult
  };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runTest, testRedisHandling };