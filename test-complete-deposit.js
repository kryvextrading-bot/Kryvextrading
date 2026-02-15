// Test the complete deposit functionality after fixing storage and RLS issues
// Run this in the browser console when logged in

async function testCompleteDepositFlow() {
  try {
    console.log('🚀 Testing complete deposit flow after fixes...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test 1: Check if storage bucket exists
    console.log('📦 Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Bucket access error:', bucketError);
      return;
    }
    
    const depositProofsBucket = buckets?.find(b => b.name === 'deposit-proofs');
    if (depositProofsBucket) {
      console.log('✅ deposit-proofs bucket exists:', depositProofsBucket);
    } else {
      console.error('❌ deposit-proofs bucket NOT found - need to run create-storage-bucket.sql');
      return;
    }
    
    // Test 2: Create a test file upload
    console.log('📤 Testing file upload...');
    const testFile = new File(['test content for deposit proof'], 'test-deposit-proof.jpg', { 
      type: 'image/jpeg' 
    });
    
    const fileName = `${user.id}/test-${Date.now()}-${testFile.name}`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('deposit-proofs')
      .upload(fileName, testFile, {
        contentType: testFile.type,
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('❌ File upload test failed:', uploadError);
      console.error('Details:', {
        message: uploadError.message,
        code: uploadError.code
      });
      return;
    }
    
    console.log('✅ File uploaded successfully:', uploadData);
    
    // Test 3: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('deposit-proofs')
      .getPublicUrl(fileName);
    
    console.log('✅ Public URL generated:', publicUrlData.publicUrl);
    
    // Test 4: Create deposit request with file
    console.log('💾 Testing deposit request creation...');
    const testDepositData = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || null,
      amount: 25.50,
      currency: 'USDT',
      network: 'ERC20',
      address: '0x1234567890123456789012345678901234567890', // Platform address
      status: 'Pending',
      proof_url: publicUrlData.publicUrl,
      proof_file_name: testFile.name
    };
    
    const { data: depositData, error: depositError } = await supabase
      .from('deposit_requests')
      .insert([testDepositData])
      .select()
      .single();
    
    if (depositError) {
      console.error('❌ Deposit request creation failed:', depositError);
      console.error('Error details:', {
        message: depositError.message,
        details: depositError.details,
        hint: depositError.hint,
        code: depositError.code
      });
      
      // Check if it's an RLS issue
      if (depositError.code === '42501' || depositError.message?.includes('permission denied')) {
        console.error('🔒 This is likely an RLS (Row Level Security) issue.');
        console.error('🔧 Solution: Run fix-deposit-rls.sql in Supabase SQL editor');
      }
      
      return;
    }
    
    console.log('✅ Deposit request created successfully:', depositData);
    
    // Test 5: Fetch the deposit request back
    console.log('🔍 Testing deposit request fetch...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', depositData.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Fetch test failed:', fetchError);
    } else {
      console.log('✅ Deposit request fetched successfully:', fetchData);
    }
    
    // Test 6: Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    // Delete the file
    const { error: deleteFileError } = await supabase.storage
      .from('deposit-proofs')
      .remove([fileName]);
    
    if (deleteFileError) {
      console.error('❌ File deletion failed:', deleteFileError);
    } else {
      console.log('✅ Test file deleted');
    }
    
    // Delete the deposit request
    const { error: deleteRequestError } = await supabase
      .from('deposit_requests')
      .delete()
      .eq('id', depositData.id);
    
    if (deleteRequestError) {
      console.error('❌ Deposit request deletion failed:', deleteRequestError);
    } else {
      console.log('✅ Test deposit request deleted');
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('📋 Summary:');
    console.log('  ✅ Storage bucket: deposit-proofs exists and accessible');
    console.log('  ✅ File upload: Working with proper RLS policies');
    console.log('  ✅ Deposit requests: RLS policies allow user inserts');
    console.log('  ✅ Public URLs: Generated correctly');
    console.log('  ✅ Complete flow: From upload to database insertion');
    
  } catch (error) {
    console.error('💥 Test failed with unexpected error:', error);
  }
}

// Run the complete test
console.log('🧪 Starting comprehensive deposit functionality test...');
await testCompleteDepositFlow();
