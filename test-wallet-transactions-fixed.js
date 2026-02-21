/**
 * Test script to verify wallet transaction fixes
 */

import { unifiedWalletService } from './src/services/unified-wallet-service-v2';

async function testWalletTransactions() {
  console.log('🧪 Testing wallet transaction fixes...');
  
  // Test user ID (replace with actual user ID from your database)
  const testUserId = '9b952c90-6b06-4c9c-9a1e-c8b4610804e2';
  const testAsset = 'USD';
  const testAmount = 100;
  const testReference = 'test-transfer-' + Date.now();

  try {
    // Test 1: Get current balances
    console.log('\n📊 Getting current balances...');
    const balances = await unifiedWalletService.getBalances(testUserId);
    console.log('Current balances:', balances);

    // Test 2: Transfer from funding to trading
    console.log('\n💸 Testing transfer to trading...');
    const transferResult = await unifiedWalletService.transferToTrading(
      testUserId,
      testAsset,
      testAmount,
      testReference
    );
    console.log('Transfer result:', transferResult);

    if (transferResult.success) {
      console.log('✅ Transfer successful! Testing transfer back...');
      
      // Test 3: Transfer back from trading to funding
      const transferBackResult = await unifiedWalletService.transferToFunding(
        testUserId,
        testAsset,
        testAmount,
        testReference + '-back'
      );
      console.log('Transfer back result:', transferBackResult);
      
      if (transferBackResult.success) {
        console.log('✅ All tests passed! Wallet transactions are working correctly.');
      } else {
        console.error('❌ Transfer back failed:', transferBackResult.error);
      }
    } else {
      console.error('❌ Initial transfer failed:', transferResult.error);
    }

    // Test 4: Get transaction history
    console.log('\n📜 Getting transaction history...');
    const history = await unifiedWalletService.getTransactionHistory(testUserId, 5);
    console.log('Recent transactions:', history);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWalletTransactions();
