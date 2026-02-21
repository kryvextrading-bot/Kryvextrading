// Debug script to test wallet data flow
console.log('🔍 Testing wallet data flow...');

// Test 1: Check if user exists and has data
async function testUserData() {
  try {
    const { supabase } = require('./lib/supabase');
    
    // Get current user (you'll need to replace with actual user ID)
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    // Test wallet balances query
    console.log('🔄 Testing wallet balances query...');
    const { data: balances } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id);
      .limit(10);
      .order('created_at', { ascending: false });
    
    console.log('📊 Wallet balances query result:', balances);
    console.log('📊 Number of balances:', balances.length);
    
    if (balances.length === 0) {
      console.log('⚠️ No wallet balances found for user');
    } else {
      console.log('✅ Found wallet balances, processing...');
      
      balances.forEach((balance, index) => {
        console.log(`💰 Balance ${index + 1}:`, {
          asset: balance.asset,
          available: balance.available,
          locked: balance.locked,
          total: balance.total
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing user data:', error);
  }
}

// Test 2: Check API response structure
async function testAPIResponse() {
  console.log('🔄 Testing API response structure...');
  
  // Simulate what the service should return
  const mockResponse = {
    balances: {
      'USDT': { available: 1000, locked: 0, total: 1000 },
      'BTC': { available: 0.5, locked: 0, total: 0.5 }
    },
    locks: [],
    stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} }
  };
  
  console.log('✅ Mock API response structure:', mockResponse);
  return mockResponse;
}

// Test 3: Check if the issue is in the service or the hook
async function testServiceIntegration() {
  console.log('🔄 Testing service integration...');
  
  try {
    const { unifiedWalletService } = require('./services/unified-wallet-service');
    
    // Test the service directly
    const result = await unifiedWalletService.refreshAllWalletData('test-user-id');
    
    console.log('📊 Service result:', result);
    console.log('📊 Result type:', typeof result);
    console.log('📊 Result keys:', Object.keys(result || {}));
    
    if (result && typeof result === 'object') {
      console.log('✅ Service returned object with keys:', Object.keys(result));
      
      if (result.balances && Object.keys(result.balances).length > 0) {
        console.log('✅ Service has balance data');
      } else {
        console.log('⚠️ Service returned empty balances');
      }
      
      if (result.locks && Array.isArray(result.locks)) {
        console.log('✅ Service has locks array:', result.locks.length);
      } else {
        console.log('⚠️ Service returned invalid locks');
      }
    } else {
      console.log('❌ Service returned invalid result');
    }
  } catch (error) {
    console.error('❌ Service integration error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 WALLET DATA DEBUG TESTS STARTING 🧪');
  
  await testUserData();
  await testAPIResponse();
  await testServiceIntegration();
  
  console.log('🧪 WALLET DATA DEBUG TESTS COMPLETE 🧪');
  console.log('='.repeat(50));
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  runTests();
}
