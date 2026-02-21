// Simple wallet test - v2
console.log('Testing wallet data flow...');

// Test direct database query
async function testDirectQuery() {
  try {
    // Use the new Supabase package
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('No user found');
      return { balances: {}, locks: [], stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} } };
    }
    
    // Query wallet balances
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
    return result;
    
  } catch (error) {
    console.error('Query error:', error);
    return { balances: {}, locks: [], stats: { activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} } };
  }
}

// Run the test
testDirectQuery().then(result => {
  console.log('Test completed');
  console.log('Result:', result);
});
