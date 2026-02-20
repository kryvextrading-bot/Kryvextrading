/**
 * Test User Trade Outcomes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NDM2NywiZXhwIjoyMDg2NTYwMzY3fQ.qmrMKGJrj8tDyLMs3eLauZ5n9iMACLLut4hA2KNlh5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsers() {
  console.log('🧪 Testing trade outcomes for different users...\n');

  try {
    // Test regular user (should lose)
    const regularUserId = '00000000-0000-0000-0000-000000000000';
    const { data: regularResult } = await supabase
      .rpc('check_trade_outcome', {
        p_user_id: regularUserId,
        p_trade_type: 'spot'
      });
    console.log('👤 Regular user outcome:', regularResult ? 'WIN' : 'LOSE');

    // Test force win user (should win)
    const forceWinUserId = '6ef846d4-8edb-42f0-b386-08bdc67d93eb';
    const { data: forceWinResult } = await supabase
      .rpc('check_trade_outcome', {
        p_user_id: forceWinUserId,
        p_trade_type: 'spot'
      });
    console.log('👑 Force win user outcome:', forceWinResult ? 'WIN' : 'LOSE');

    // Test different trade types for force win user
    const tradeTypes = ['spot', 'futures', 'options', 'arbitrage'];
    console.log('\n🎯 Testing all trade types for force win user:');
    
    for (const tradeType of tradeTypes) {
      const { data: result } = await supabase
        .rpc('check_trade_outcome', {
          p_user_id: forceWinUserId,
          p_trade_type: tradeType
        });
      console.log(`   ${tradeType}: ${result ? 'WIN' : 'LOSE'}`);
    }

    console.log('\n✅ Testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsers();
