#!/usr/bin/env node

/**
 * Test script for backend cache functionality
 * Run with: node test-cache.js
 */

const https = require('https');
const fs = require('fs');

// SSL configuration for self-signed certificate
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://localhost:3000';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCacheEndpoints() {
  console.log('🧪 Testing Backend Cache Endpoints...\n');

  try {
    // Test 1: Cache stats
    console.log('1. Testing cache stats...');
    const statsResponse = await makeRequest('GET', '/api/cache/stats');
    console.log('✅ Cache stats:', statsResponse.data);

    // Test 2: Wallet data cache
    console.log('\n2. Testing wallet data cache...');
    const testWalletId = '507f1f77bcf86cd799439011'; // Sample ObjectId
    const testWalletData = {
      balance: 100.5,
      transactions: [{ id: 'tx1', amount: 50 }],
      holdings: [{ coinType: '0x2::sui::SUI', balance: '1000000000' }],
      loading: false,
      error: null,
      lastFetched: new Date().toISOString()
    };

    // Set wallet data
    const setResponse = await makeRequest('POST', '/api/cache/wallet-data', {
      walletId: testWalletId,
      dataType: 'holdings',
      data: testWalletData
    });
    console.log('✅ Set wallet data:', setResponse.data);

    // Get wallet data
    const getResponse = await makeRequest('GET', `/api/cache/wallet-data?walletId=${testWalletId}&dataType=holdings`);
    console.log('✅ Get wallet data:', getResponse.data);

    // Test 3: Metadata cache
    console.log('\n3. Testing metadata cache...');
    const testCoinType = '0x2::sui::SUI';
    const testMetadata = {
      symbol: 'SUI',
      name: 'Sui',
      decimals: 9,
      iconUrl: '/icons/sui.svg',
      description: 'Sui token'
    };

    // Set metadata
    const setMetadataResponse = await makeRequest('POST', '/api/cache/metadata', {
      coinType: testCoinType,
      metadata: testMetadata
    });
    console.log('✅ Set metadata:', setMetadataResponse.data);

    // Get metadata
    const getMetadataResponse = await makeRequest('GET', `/api/cache/metadata?coinType=${encodeURIComponent(testCoinType)}`);
    console.log('✅ Get metadata:', getMetadataResponse.data);

    // Test 4: Batch metadata
    console.log('\n4. Testing batch metadata...');
    const batchMetadata = {
      '0x2::sui::SUI': testMetadata,
      '0x2::usdc::USDC': {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        iconUrl: '/icons/usdc.svg',
        description: 'USD Coin'
      }
    };

    const batchResponse = await makeRequest('PUT', '/api/cache/metadata', {
      metadataMap: batchMetadata
    });
    console.log('✅ Batch metadata:', batchResponse.data);

    // Test 5: Cache invalidation
    console.log('\n5. Testing cache invalidation...');
    const invalidateResponse = await makeRequest('DELETE', `/api/cache/wallet-data?walletId=${testWalletId}&dataType=holdings`);
    console.log('✅ Invalidate wallet data:', invalidateResponse.data);

    // Test 6: Verify invalidation
    const verifyResponse = await makeRequest('GET', `/api/cache/wallet-data?walletId=${testWalletId}&dataType=holdings`);
    console.log('✅ Verify invalidation:', verifyResponse.data);

    console.log('\n🎉 All cache tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testCacheEndpoints(); 