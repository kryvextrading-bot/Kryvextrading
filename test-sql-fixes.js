// Quick test to verify the SQL fixes work
// Run this in browser console after executing the SQL scripts

async function testSQLFixes() {
  try {
    console.log('🔧 Testing SQL fixes for storage and RLS...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    // Test 1: Check if storage bucket exists
    console.log('📦 Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Bucket error:', bucketError);
      return;
    }
    
    const depositBucket = buckets?.find(b => b.name === 'deposit-proofs');
    if (depositBucket) {
      console.log('✅ deposit-proofs bucket exists');
    } else {
      console.error('❌ deposit-proofs bucket still missing - run create-storage-bucket.sql');
      return;
    }
    
    // Test 2: Check if we can create a deposit request
    console.log('💾 Testing deposit request creation...');
    const testRequest = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || null,
      amount: 10.00,
      currency: 'USDT',
      network: 'ERC20',
      address: '0x1234567890123456789012345678901234567890',
      status: 'Pending'
    };
    
    const { data: requestData, error: requestError } = await supabase
      .from('deposit_requests')
      .insert([testRequest])
      .select()
      .single();
    
    if (requestError) {
      console.error('❌ Deposit request still failed:', requestError);
      
      if (requestError.code === '42501') {
        console.error('🔒 RLS permission issue still exists');
        console.error('🔧 Check if fix-deposit-rls.sql was executed correctly');
        console.error('🔧 Verify user has is_admin = true in user_metadata');
      }
      
      return;
    }
    
    console.log('✅ Deposit request created successfully!');
    console.log('Request ID:', requestData.id);
    console.log('User ID:', requestData.user_id);
    console.log('Status:', requestData.status);
    
    // Clean up
    await supabase
      .from('deposit_requests')
      .delete()
      .eq('id', requestData.id);
    
    console.log('🧹 Test data cleaned up');
    console.log('🎉 All SQL fixes working correctly!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
console.log('🧪 Testing SQL fixes for storage and RLS...');
await testSQLFixes();
