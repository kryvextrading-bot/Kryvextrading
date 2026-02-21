// Browser-compatible wallet test
console.log('Testing wallet data flow...');

// Test direct database query using dynamic import
async function testDirectQuery() {
  try {
    // Dynamic import for browser compatibility
    const supabaseModule = await import('./lib/supabase.js');
    const { supabase } = supabaseModule.default;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('No user found');
      return { balances: {}, locks: [], stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} } };
    }
    
    // Query wallet balances directly
    const { data: balances } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id)
      .limit(10);
    
    console.log('Query result:', balances);
    console.log('Number of balances:', balances.length);
    
    // Process results
    const result = {
      balances: {},
      locks: [],
      stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} }
    };
    
    if (balances && balances.length > 0) {
      balances.forEach((balance, index) => {
        result.balances[balance.asset] = {
          asset: balance.asset,
          available: Number(balance.available) || 0,
          locked: Number(balance.locked) || 0,
          total: Number(balance.total) || 0
        };
      });
    }
    
    console.log('Final result:', result);
    console.log('Test completed');
    return result;
    
  } catch (error) {
    console.error('Query error:', error);
    console.log('Test completed');
    return { balances: {}, locks: [], stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} } };
  }
}

// Run the test
testDirectQuery().then(result => {
  console.log('Test completed');
  console.log('Result:', result);
});
