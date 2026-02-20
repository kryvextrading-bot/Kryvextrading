// Test script to debug the deposit endpoint
// Run with: node test-api.js

const testDeposit = async () => {
  try {
    console.log('🧪 Testing deposit endpoint...');
    
    // Test 1: Basic GET request to verify server is working
    console.log('\n1️⃣ Testing GET /api/test');
    const testResponse = await fetch('http://localhost:3001/api/test');
    console.log('Status:', testResponse.status);
    const testResult = await testResponse.json();
    console.log('Response:', testResult);
    
    // Test 2: Basic POST request to verify POST works
    console.log('\n2️⃣ Testing POST /api/test-post');
    const postTestResponse = await fetch('http://localhost:3001/api/test-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'data',
        timestamp: new Date().toISOString()
      })
    });
    console.log('Status:', postTestResponse.status);
    const postTestResult = await postTestResponse.json();
    console.log('Response:', postTestResult);
    
    // Test 3: Test the actual deposit endpoint with JSON (not FormData)
    console.log('\n3️⃣ Testing POST /api/wallet/deposit with JSON');
    const depositResponse = await fetch('http://localhost:3001/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-testing'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'USDT',
        network: 'TRC20',
        address: 'test-address-123',
        userId: '1',
        userEmail: 'test@example.com',
        userName: 'Test User'
      })
    });
    console.log('Status:', depositResponse.status);
    console.log('Status Text:', depositResponse.statusText);
    
    const depositText = await depositResponse.text();
    console.log('Response:', depositText);
    
    // Test 4: Test the deposit endpoint with FormData (as it should be)
    console.log('\n4️⃣ Testing POST /api/wallet/deposit with FormData');
    const formData = new FormData();
    formData.append('amount', '100');
    formData.append('currency', 'USDT');
    formData.append('network', 'TRC20');
    formData.append('address', 'test-address-123');
    formData.append('userId', '1');
    formData.append('userEmail', 'test@example.com');
    formData.append('userName', 'Test User');
    
    const formDataResponse = await fetch('http://localhost:3001/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token-for-testing'
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData
    });
    console.log('Status:', formDataResponse.status);
    console.log('Status Text:', formDataResponse.statusText);
    
    const formDataText = await formDataResponse.text();
    console.log('Response:', formDataText);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Full error:', error);
  }
};

// Run the tests
testDeposit();
