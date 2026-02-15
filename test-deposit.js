// Test the new Supabase deposit functionality
// Run this in the browser console when logged in

async function testDepositRequest() {
  try {
    console.log('🧪 Testing Supabase deposit request...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test deposit request data
    const testDepositData = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
      amount: 100,
      currency: 'USDT',
      network: 'ERC20',
      address: '0x1234567890123456789012345678901234567890',
      status: 'Pending'
    };
    
    console.log('📝 Creating deposit request:', testDepositData);
    
    // Insert directly into Supabase
    const { data, error } = await supabase
      .from('deposit_requests')
      .insert(testDepositData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating deposit request:', error);
      return;
    }
    
    console.log('✅ Deposit request created successfully:', data);
    
    // Clean up - delete the test request
    await supabase
      .from('deposit_requests')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test deposit request cleaned up');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testDepositRequest();
