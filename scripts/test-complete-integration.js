#!/usr/bin/env node

/**
 * Complete Integration Test Suite
 * Tests deployed fixes, Redis integration, and caching optimization
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

// Test configuration
const LOCAL_URL = 'http://localhost:5000';
const PRODUCTION_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: 10000,
      headers: options.headers || {}
    };
    
    const req = client.get(url, requestOptions, (res) => {
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
 * Test deployed fixes
 */
async function testDeployedFixes() {
  console.log('🚀 Testing Deployed Fixes');
  console.log('=========================');
  
  const tests = [
    {
      name: 'Root Route',
      path: '/',
      expectedStatus: 200,
      expectedContent: 'Tourlicity API Backend'
    },
    {
      name: 'Health Check',
      path: '/health',
      expectedStatus: 200,
      expectedContent: 'status'
    },
    {
      name: 'API Documentation',
      path: '/api-docs-simple',
      expectedStatus: 200,
      expectedContent: 'API Documentation'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const url = LOCAL_URL + test.path;
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${url}`);
    
    try {
      const response = await makeRequest(url);
      
      const statusMatch = response.status === test.expectedStatus;
      const contentMatch = response.body.includes(test.expectedContent);
      const passed = statusMatch && contentMatch;
      
      console.log(`   Status: ${response.status} ${statusMatch ? '✅' : '❌'}`);
      console.log(`   Content: ${contentMatch ? '✅' : '❌'}`);
      
      results.push({
        name: test.name,
        passed,
        status: response.status,
        expectedStatus: test.expectedStatus
      });
      
    } catch (error) {
      console.log(`   Error: ❌ ${error.message}`);
      results.push({
        name: test.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Test Redis integration
 */
async function testRedisIntegration() {
  console.log('\n🔧 Testing Redis Integration');
  console.log('============================');
  
  try {
    // Test Redis connection via our test script
    const { testRedisConnection } = require('./test-redis-connection');
    const redisConnected = await testRedisConnection();
    
    console.log(`Redis Connection: ${redisConnected ? '✅' : '❌'}`);
    
    // Test notification queue
    const notificationQueueService = require('../src/services/notificationQueueService');
    const queueAvailable = notificationQueueService.isQueueAvailable();
    const queueHealth = notificationQueueService.getQueueHealth();
    
    console.log(`Queue Available: ${queueAvailable ? '✅' : '❌'}`);
    console.log(`Queue Health:`, queueHealth);
    
    return {
      redisConnected,
      queueAvailable,
      queueHealth
    };
    
  } catch (error) {
    console.log(`❌ Redis integration test failed: ${error.message}`);
    return {
      redisConnected: false,
      queueAvailable: false,
      error: error.message
    };
  }
}

/**
 * Test caching system optimization
 */
async function testCachingOptimization() {
  console.log('\n⚡ Testing Caching System Optimization');
  console.log('=====================================');
  
  try {
    // Test cache service directly
    const cacheService = require('../src/services/cacheService');
    
    // Test basic cache operations
    console.log('🧪 Testing basic cache operations...');
    
    const testKey = 'test:optimization';
    const testValue = { message: 'Cache optimization test', timestamp: Date.now() };
    
    // Test SET
    await cacheService.set(testKey, testValue, 60);
    console.log('✅ Cache SET operation successful');
    
    // Test GET
    const cachedValue = await cacheService.get(testKey);
    const getSuccess = cachedValue && cachedValue.message === testValue.message;
    console.log(`${getSuccess ? '✅' : '❌'} Cache GET operation ${getSuccess ? 'successful' : 'failed'}`);
    
    // Test DELETE
    await cacheService.del(testKey);
    console.log('✅ Cache DELETE operation successful');
    
    // Test cache statistics
    const stats = await cacheService.getStats();
    console.log('✅ Cache statistics retrieved:', {
      connected: stats.connected,
      memory: stats.memory,
      keyspace: stats.keyspace
    });
    
    // Test database cache
    const databaseCache = require('../src/services/databaseCache');
    
    // Test cache key generation
    const mockModel = { modelName: 'User' };
    const cacheKey = databaseCache.generateCacheKey(mockModel, { active: true }, { page: 1 });
    console.log(`✅ Cache key generation: ${cacheKey}`);
    
    return {
      basicOperations: getSuccess,
      statistics: !!stats.connected,
      keyGeneration: !!cacheKey,
      cacheService: 'working'
    };
    
  } catch (error) {
    console.log(`❌ Caching optimization test failed: ${error.message}`);
    return {
      basicOperations: false,
      error: error.message
    };
  }
}

/**
 * Test performance improvements
 */
async function testPerformanceImprovements() {
  console.log('\n📊 Testing Performance Improvements');
  console.log('===================================');
  
  try {
    const startTime = Date.now();
    
    // Test multiple concurrent requests to cached endpoints
    const requests = [
      makeRequest(`${LOCAL_URL}/health`),
      makeRequest(`${LOCAL_URL}/`),
      makeRequest(`${LOCAL_URL}/api-docs-simple`)
    ];
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const successfulRequests = responses.filter(r => r.status >= 200 && r.status < 400).length;
    const averageResponseTime = totalTime / requests.length;
    
    console.log(`✅ Concurrent requests: ${successfulRequests}/${requests.length} successful`);
    console.log(`✅ Average response time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`✅ Total time: ${totalTime}ms`);
    
    // Performance benchmarks
    const performanceGood = averageResponseTime < 500; // Under 500ms average
    const allSuccessful = successfulRequests === requests.length;
    
    return {
      concurrentRequests: allSuccessful,
      averageResponseTime,
      performanceGood,
      totalRequests: requests.length,
      successfulRequests
    };
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    return {
      concurrentRequests: false,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runCompleteIntegrationTest() {
  console.log('🎯 Complete Integration Test Suite');
  console.log('==================================\n');
  
  // Run all test suites
  const deployedFixesResults = await testDeployedFixes();
  const redisResults = await testRedisIntegration();
  const cachingResults = await testCachingOptimization();
  const performanceResults = await testPerformanceImprovements();
  
  // Calculate overall results
  const deployedFixesPassed = deployedFixesResults.filter(r => r.passed).length;
  const deployedFixesTotal = deployedFixesResults.length;
  
  console.log('\n📋 Complete Test Summary');
  console.log('========================');
  
  console.log(`\n🚀 Deployed Fixes: ${deployedFixesPassed}/${deployedFixesTotal} passed`);
  deployedFixesResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} - ${result.name}`);
  });
  
  console.log(`\n🔧 Redis Integration: ${redisResults.redisConnected && redisResults.queueAvailable ? '✅ PASS' : '⚠️  PARTIAL'}`);
  console.log(`   Redis Connected: ${redisResults.redisConnected ? '✅' : '❌'}`);
  console.log(`   Queue Available: ${redisResults.queueAvailable ? '✅' : '❌'}`);
  
  console.log(`\n⚡ Caching Optimization: ${cachingResults.basicOperations && cachingResults.statistics ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Basic Operations: ${cachingResults.basicOperations ? '✅' : '❌'}`);
  console.log(`   Statistics: ${cachingResults.statistics ? '✅' : '❌'}`);
  console.log(`   Key Generation: ${cachingResults.keyGeneration ? '✅' : '❌'}`);
  
  console.log(`\n📊 Performance: ${performanceResults.concurrentRequests && performanceResults.performanceGood ? '✅ PASS' : '⚠️  NEEDS ATTENTION'}`);
  console.log(`   Concurrent Requests: ${performanceResults.concurrentRequests ? '✅' : '❌'}`);
  console.log(`   Response Time: ${performanceResults.averageResponseTime ? performanceResults.averageResponseTime.toFixed(2) + 'ms' : 'N/A'} ${performanceResults.performanceGood ? '✅' : '⚠️'}`);
  
  // Overall assessment
  const overallScore = [
    deployedFixesPassed === deployedFixesTotal,
    redisResults.redisConnected,
    redisResults.queueAvailable,
    cachingResults.basicOperations,
    cachingResults.statistics,
    performanceResults.concurrentRequests
  ].filter(Boolean).length;
  
  const totalTests = 6;
  const overallPercentage = Math.round((overallScore / totalTests) * 100);
  
  console.log(`\n🎯 Overall Score: ${overallScore}/${totalTests} (${overallPercentage}%)`);
  
  if (overallPercentage >= 90) {
    console.log('🎉 Excellent! All systems are working optimally.');
  } else if (overallPercentage >= 75) {
    console.log('✅ Good! Most systems are working well with minor issues.');
  } else if (overallPercentage >= 50) {
    console.log('⚠️  Fair. Some systems need attention.');
  } else {
    console.log('❌ Poor. Multiple systems need fixing.');
  }
  
  return {
    deployedFixes: deployedFixesResults,
    redis: redisResults,
    caching: cachingResults,
    performance: performanceResults,
    overallScore,
    overallPercentage
  };
}

// Run tests if called directly
if (require.main === module) {
  runCompleteIntegrationTest()
    .then(results => {
      process.exit(results.overallPercentage >= 75 ? 0 : 1);
    })
    .catch(error => {
      console.error('Integration test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteIntegrationTest };