// Comprehensive test for the deposit functionality matching your exact table structure
// Run this in the browser console when logged in

async function testDepositRequestWithTableStructure() {
  try {
    console.log('🧪 Testing deposit request with exact table structure...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test data matching your exact table structure
    const testDepositData = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || null,
      amount: 100.50,
      currency: 'USDT',
      network: 'ERC20',
      address: '0x1234567890123456789012345678901234567890',
      status: 'Pending', // Matches your check constraint
      proof_url: null,
      proof_file_name: null,
      admin_notes: null,
      processed_by: null,
      processed_at: null
    };
    
    console.log('📝 Creating deposit request with exact structure:', testDepositData);
    
    // Insert directly into Supabase
    const { data, error } = await supabase
      .from('deposit_requests')
      .insert(testDepositData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating deposit request:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }
    
    console.log('✅ Deposit request created successfully:', data);
    console.log('📊 Request details:', {
      id: data.id,
      user_id: data.user_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      created_at: data.created_at
    });
    
    // Test fetching the request back
    console.log('🔍 Testing fetch...');
    const { data: fetchedData, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching deposit request:', fetchError);
    } else {
      console.log('✅ Deposit request fetched successfully:', fetchedData);
    }
    
    // Test updating status (simulating admin approval)
    console.log('🔄 Testing status update...');
    const { data: updatedData, error: updateError } = await supabase
      .from('deposit_requests')
      .update({
        status: 'Approved',
        admin_notes: 'Test approval',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating deposit request:', updateError);
    } else {
      console.log('✅ Deposit request updated successfully:', updatedData);
    }
    
    // Clean up - delete the test request
    console.log('🧹 Cleaning up test data...');
    await supabase
      .from('deposit_requests')
      .delete()
      .eq('id', data.id);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Also test the deposit service directly
async function testDepositService() {
  try {
    console.log('🧪 Testing deposit service...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    // Create a mock file for testing
    const mockFile = new File(['test content'], 'test-proof.jpg', { type: 'image/jpeg' });
    
    const result = await depositService.createDepositRequest({
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || null,
      amount: 50.25,
      currency: 'USDT',
      network: 'TRC20',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      status: 'Pending'
    }, mockFile);
    
    if (result.success) {
      console.log('✅ Deposit service test successful:', result.data);
      
      // Clean up
      await supabase
        .from('deposit_requests')
        .delete()
        .eq('id', result.data!.id);
        
      console.log('🧹 Test data cleaned up');
    } else {
      console.error('❌ Deposit service test failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Deposit service test failed:', error);
  }
}

// Run both tests
console.log('🚀 Starting comprehensive deposit tests...');
await testDepositRequestWithTableStructure();
await testDepositService();
