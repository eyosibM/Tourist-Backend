#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests Redis connectivity and basic operations
 */

require('dotenv').config();
const Redis = require('ioredis');

async function testRedisConnection() {
  console.log('🔧 Testing Redis Connection');
  console.log('===========================');
  
  const redisUrl = process.env.REDIS_URL;
  console.log(`Redis URL: ${redisUrl ? redisUrl.replace(/:[^:@]*@/, ':***@') : 'Not configured'}`);
  
  if (!redisUrl) {
    console.log('❌ REDIS_URL not configured in environment');
    return false;
  }
  
  let redis;
  
  try {
    console.log('\n⏳ Connecting to Redis...');
    
    // Create Redis connection
    redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      showFriendlyErrorStack: true
    });
    
    // Test connection
    await redis.connect();
    console.log('✅ Redis connection established');
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test SET operation
    await redis.set('test:connection', 'success', 'EX', 60);
    console.log('✅ SET operation successful');
    
    // Test GET operation
    const value = await redis.get('test:connection');
    console.log(`✅ GET operation successful: ${value}`);
    
    // Test DELETE operation
    await redis.del('test:connection');
    console.log('✅ DELETE operation successful');
    
    // Test Redis info
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    console.log(`✅ Redis version: ${version}`);
    
    // Test memory usage
    const memory = await redis.info('memory');
    const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1];
    console.log(`✅ Memory usage: ${usedMemory}`);
    
    console.log('\n🎉 All Redis tests passed!');
    return true;
    
  } catch (error) {
    console.log(`❌ Redis connection failed: ${error.message}`);
    
    // Provide specific error guidance
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS resolution failed - check the hostname');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Connection refused - check if Redis server is running');
    } else if (error.message.includes('WRONGPASS')) {
      console.log('💡 Authentication failed - check username/password');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout - check network connectivity');
    }
    
    return false;
    
  } finally {
    if (redis) {
      await redis.disconnect();
      console.log('🔌 Redis connection closed');
    }
  }
}

// Test Redis with notification queue service
async function testNotificationQueue() {
  console.log('\n🔔 Testing Notification Queue Service');
  console.log('=====================================');
  
  try {
    const notificationQueueService = require('../src/services/notificationQueueService');
    
    // Check if queue is initialized
    if (notificationQueueService.isQueueAvailable()) {
      console.log('✅ Notification queue is available');
      
      // Test adding a job (this won't actually send)
      const testJob = {
        type: 'email',
        to: 'test@example.com',
        subject: 'Test notification',
        message: 'This is a test'
      };
      
      await notificationQueueService.addNotificationJob(testJob);
      console.log('✅ Test notification job added to queue');
      
      return true;
    } else {
      console.log('⚠️  Notification queue not available (fallback mode)');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Notification queue test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Redis Integration Test Suite');
  console.log('================================\n');
  
  const redisConnected = await testRedisConnection();
  const queueWorking = await testNotificationQueue();
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Redis Connection: ${redisConnected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Notification Queue: ${queueWorking ? '✅ PASS' : '⚠️  FALLBACK'}`);
  
  if (redisConnected && queueWorking) {
    console.log('\n🎉 Redis is fully integrated and working!');
  } else if (redisConnected && !queueWorking) {
    console.log('\n⚠️  Redis connected but queue service needs attention');
  } else {
    console.log('\n❌ Redis integration needs fixing');
  }
  
  return { redisConnected, queueWorking };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.redisConnected ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testRedisConnection, testNotificationQueue, runAllTests };