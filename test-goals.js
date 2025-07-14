const { exec } = require('child_process');
const https = require('https');

// Configuration
const BASE_URL = 'https://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Helper function to make HTTPS requests
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url.replace(BASE_URL, ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false // For self-signed certificate
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body
          });
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

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123'
};

const testGoal = {
  user_id: '', // Will be set after user creation
  name: 'Save 1000 SUI',
  description: 'Save up 1000 SUI tokens',
  status: 'active',
  progress: 25,
  coin: 'Sui',
  coin_symbol: 'SUI',
  current_amount: 250,
  target_amount: 1000,
  target_date: null,
  wallet_id: null,
  wallet_address: null,
  wallet_chain: null,
  goal_type: 'regular',
  parent_goal_id: null,
  is_aggregate: false,
  milestones: [],
  notes: 'Save up 1000 SUI tokens'
};

const testGoal2 = {
  user_id: '', // Will be set after user creation
  name: 'Invest in USDC',
  description: 'Build a USDC investment portfolio',
  status: 'active',
  progress: 25,
  coin: 'USD Coin',
  coin_symbol: 'USDC',
  current_amount: 500,
  target_amount: 2000,
  target_date: null,
  wallet_id: null,
  wallet_address: null,
  wallet_chain: null,
  goal_type: 'parent',
  parent_goal_id: null,
  is_aggregate: true,
  milestones: [],
  notes: 'Build a USDC investment portfolio'
};

// Test scenarios
async function runTests() {
  console.log('🚀 Starting Goals API Tests...\n');

  let userId = '';
  let goalId = '';
  let goalId2 = '';

  try {
    // Test 1: Create a test user
    console.log('📝 Test 1: Creating test user...');
    const userResponse = await makeRequest('POST', `${API_BASE}/auth/register`, testUser);
    console.log(`Status: ${userResponse.status}`);
    console.log('Response:', JSON.stringify(userResponse.data, null, 2));
    
    if (userResponse.status === 201) {
      userId = userResponse.data.data.id;
      testGoal.user_id = userId;
      testGoal2.user_id = userId;
      console.log(`✅ User created with ID: ${userId}\n`);
    } else {
      console.log('❌ Failed to create user\n');
      return;
    }

    // Test 2: Create first goal
    console.log('🎯 Test 2: Creating first goal...');
    const goalResponse = await makeRequest('POST', `${API_BASE}/goals`, testGoal);
    console.log(`Status: ${goalResponse.status}`);
    console.log('Response:', JSON.stringify(goalResponse.data, null, 2));
    
    if (goalResponse.status === 201) {
      goalId = goalResponse.data.data.id;
      console.log(`✅ Goal created with ID: ${goalId}\n`);
    } else {
      console.log('❌ Failed to create goal\n');
      return;
    }

    // Test 3: Create second goal
    console.log('🎯 Test 3: Creating second goal...');
    const goalResponse2 = await makeRequest('POST', `${API_BASE}/goals`, testGoal2);
    console.log(`Status: ${goalResponse2.status}`);
    console.log('Response:', JSON.stringify(goalResponse2.data, null, 2));
    
    if (goalResponse2.status === 201) {
      goalId2 = goalResponse2.data.data.id;
      console.log(`✅ Second goal created with ID: ${goalId2}\n`);
    } else {
      console.log('❌ Failed to create second goal\n');
    }

    // Test 4: Get goal by ID
    console.log('🔍 Test 4: Getting goal by ID...');
    const getGoalResponse = await makeRequest('GET', `${API_BASE}/goals/${goalId}`);
    console.log(`Status: ${getGoalResponse.status}`);
    console.log('Response:', JSON.stringify(getGoalResponse.data, null, 2));
    console.log(getGoalResponse.status === 200 ? '✅ Goal retrieved successfully\n' : '❌ Failed to get goal\n');

    // Test 5: Get user goals
    console.log('👤 Test 5: Getting user goals...');
    const userGoalsResponse = await makeRequest('GET', `${API_BASE}/goals/user/${userId}`);
    console.log(`Status: ${userGoalsResponse.status}`);
    console.log('Response:', JSON.stringify(userGoalsResponse.data, null, 2));
    console.log(userGoalsResponse.status === 200 ? '✅ User goals retrieved successfully\n' : '❌ Failed to get user goals\n');

    // Test 6: Update goal
    console.log('✏️ Test 6: Updating goal...');
    const updateData = {
      name: 'Save 1500 SUI (Updated)',
      current_amount: 500
    };
    const updateResponse = await makeRequest('PUT', `${API_BASE}/goals/${goalId}`, updateData);
    console.log(`Status: ${updateResponse.status}`);
    console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    console.log(updateResponse.status === 200 ? '✅ Goal updated successfully\n' : '❌ Failed to update goal\n');

    // Test 7: Get goal progress
    console.log('📊 Test 7: Getting goal progress...');
    const progressResponse = await makeRequest('GET', `${API_BASE}/goals/${goalId}/progress`);
    console.log(`Status: ${progressResponse.status}`);
    console.log('Response:', JSON.stringify(progressResponse.data, null, 2));
    console.log(progressResponse.status === 200 ? '✅ Goal progress retrieved successfully\n' : '❌ Failed to get goal progress\n');

    // Test 8: Update goal progress
    console.log('📈 Test 8: Updating goal progress...');
    const progressUpdateData = {
      current_amount: 750
    };
    const progressUpdateResponse = await makeRequest('PUT', `${API_BASE}/goals/${goalId}/progress`, progressUpdateData);
    console.log(`Status: ${progressUpdateResponse.status}`);
    console.log('Response:', JSON.stringify(progressUpdateResponse.data, null, 2));
    console.log(progressUpdateResponse.status === 200 ? '✅ Goal progress updated successfully\n' : '❌ Failed to update goal progress\n');

    // Test 9: Get all goals (admin)
    console.log('📋 Test 9: Getting all goals...');
    const allGoalsResponse = await makeRequest('GET', `${API_BASE}/goals`);
    console.log(`Status: ${allGoalsResponse.status}`);
    console.log('Response:', JSON.stringify(allGoalsResponse.data, null, 2));
    console.log(allGoalsResponse.status === 200 ? '✅ All goals retrieved successfully\n' : '❌ Failed to get all goals\n');

    // Test 10: Health check
    console.log('🏥 Test 10: Goals health check...');
    const healthResponse = await makeRequest('GET', `${API_BASE}/goals/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    console.log(healthResponse.status === 200 ? '✅ Goals health check successful\n' : '❌ Goals health check failed\n');

    // Test 11: Error handling - Invalid goal ID
    console.log('🚫 Test 11: Testing invalid goal ID...');
    const invalidGoalResponse = await makeRequest('GET', `${API_BASE}/goals/invalid-id`);
    console.log(`Status: ${invalidGoalResponse.status}`);
    console.log('Response:', JSON.stringify(invalidGoalResponse.data, null, 2));
    console.log(invalidGoalResponse.status === 500 ? '✅ Invalid goal ID handled correctly\n' : '❌ Invalid goal ID not handled correctly\n');

    // Test 12: Error handling - Missing required fields
    console.log('🚫 Test 12: Testing missing required fields...');
    const invalidGoalData = {
      user_id: userId,
      name: 'Invalid Goal',
      // Missing coin, coin_symbol, current_amount, target_amount, goal_type
    };
    const invalidDataResponse = await makeRequest('POST', `${API_BASE}/goals`, invalidGoalData);
    console.log(`Status: ${invalidDataResponse.status}`);
    console.log('Response:', JSON.stringify(invalidDataResponse.data, null, 2));
    console.log(invalidDataResponse.status === 400 ? '✅ Missing fields handled correctly\n' : '❌ Missing fields not handled correctly\n');

    // Test 13: Error handling - Invalid goal type
    console.log('🚫 Test 13: Testing invalid goal type...');
    const invalidTypeData = {
      ...testGoal,
      goal_type: 'invalid_type'
    };
    const invalidTypeResponse = await makeRequest('POST', `${API_BASE}/goals`, invalidTypeData);
    console.log(`Status: ${invalidTypeResponse.status}`);
    console.log('Response:', JSON.stringify(invalidTypeResponse.data, null, 2));
    console.log(invalidTypeResponse.status === 400 ? '✅ Invalid goal type handled correctly\n' : '❌ Invalid goal type not handled correctly\n');

    // Test 14: Error handling - Current amount exceeds target
    console.log('🚫 Test 14: Testing current amount exceeds target...');
    const invalidAmountData = {
      ...testGoal,
      current_amount: 2000,
      target_amount: 1000
    };
    const invalidAmountResponse = await makeRequest('POST', `${API_BASE}/goals`, invalidAmountData);
    console.log(`Status: ${invalidAmountResponse.status}`);
    console.log('Response:', JSON.stringify(invalidAmountResponse.data, null, 2));
    console.log(invalidAmountResponse.status === 400 ? '✅ Invalid amount handled correctly\n' : '❌ Invalid amount not handled correctly\n');

    // Test 15: Delete second goal
    console.log('🗑️ Test 15: Deleting second goal...');
    const deleteResponse = await makeRequest('DELETE', `${API_BASE}/goals/${goalId2}`);
    console.log(`Status: ${deleteResponse.status}`);
    console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
    console.log(deleteResponse.status === 200 ? '✅ Goal deleted successfully\n' : '❌ Failed to delete goal\n');

    // Test 16: Verify goal was deleted
    console.log('🔍 Test 16: Verifying goal was deleted...');
    const verifyDeleteResponse = await makeRequest('GET', `${API_BASE}/goals/${goalId2}`);
    console.log(`Status: ${verifyDeleteResponse.status}`);
    console.log('Response:', JSON.stringify(verifyDeleteResponse.data, null, 2));
    console.log(verifyDeleteResponse.status === 404 ? '✅ Goal deletion verified\n' : '❌ Goal still exists\n');

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
runTests(); 