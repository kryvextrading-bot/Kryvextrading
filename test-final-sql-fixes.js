// Final test to verify all SQL fixes work correctly
// Run this in browser console after executing both SQL scripts

async function testFinalSQLFixes() {
  try {
    console.log('🔧 Testing final SQL fixes...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test 1: Storage bucket access
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
      console.error('❌ deposit-proofs bucket still missing');
      console.error('🔧 Solution: Manually create bucket in Supabase Dashboard > Storage');
      return;
    }
    
    // Test 2: File upload (without actually uploading)
    console.log('📤 Testing file upload permissions...');
    const testFileName = `${user.id}/test-${Date.now()}.jpg`;
    
    // Just test if we can generate a signed URL (tests RLS)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('deposit-proofs')
      .createSignedUrl(testFileName, 60000); // 60 seconds expiry
    
    if (signedUrlError) {
      console.error('❌ Signed URL error:', signedUrlError);
      if (signedUrlError.message?.includes('permission denied')) {
        console.error('🔒 Storage RLS issue still exists');
      }
      return;
    }
    
    console.log('✅ Signed URL generated (RLS working):', signedUrlData.signedUrl);
    
    // Test 3: Deposit request creation
    console.log('💾 Testing deposit request creation...');
    const testRequest = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || null,
      amount: 50.00,
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
      console.error('❌ Deposit request failed:', requestError);
      
      if (requestError.code === '42501') {
        console.error('🔒 RLS permission issue still exists');
        console.error('🔧 Solutions:');
        console.error('  1. Run fix-deposit-rls.sql in Supabase SQL editor');
        console.error('  2. Check user has is_admin = true in user_metadata');
        console.error('  3. Ensure JWT token contains proper claims');
      } else if (requestError.message?.includes('must be owner of table buckets')) {
        console.error('🔒 Storage bucket permission issue');
        console.error('🔧 Solutions:');
        console.error('  1. Run create-storage-bucket.sql in Supabase SQL editor');
        console.error('  2. Check service_role key usage');
        console.error('  3. Or create bucket manually in Supabase Dashboard');
      }
      
      return;
    }
    
    console.log('✅ Deposit request created successfully!');
    console.log('Request details:', {
      id: requestData.id,
      user_id: requestData.user_id,
      status: requestData.status,
      created_at: requestData.created_at
    });
    
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

// Instructions for user
console.log('📋 INSTRUCTIONS FOR FIXING SQL ERRORS:');
console.log('');
console.log('1️⃣ STORAGE BUCKET PERMISSION ERROR:');
console.log('   Error: "must be owner of table buckets"');
console.log('   Solutions:');
console.log('   A) Run create-storage-bucket.sql in Supabase SQL editor');
console.log('   B) Create bucket manually in Supabase Dashboard > Storage');
console.log('   C) Use service_role key for storage operations');
console.log('');
console.log('2️⃣ RLS POLICY SYNTAX ERROR:');
console.log('   Error: "operator does not exist: text ->>"');
console.log('   Solutions:');
console.log('   A) Use fix-deposit-rls.sql (corrected syntax)');
console.log('   B) Check JWT claims are properly formatted');
console.log('   C) Ensure user_metadata.is_admin = true for admin users');
console.log('');
console.log('🚀 Run the final test:');
console.log('   testFinalSQLFixes()');

// Run the test
await testFinalSQLFixes();
