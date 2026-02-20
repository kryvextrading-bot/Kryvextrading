/**
 * Check Database Alignment with Options Trading System
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NDM2NywiZXhwIjoyMDg2NTYwMzY3fQ.qmrMKGJrj8tDyLMs3eLauZ5n9iMACLLut4hA2KNlh5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseAlignment() {
  console.log('🔍 Checking database alignment with new options trading system...\n');

  try {
    // 1. Check trading_settings table
    console.log('📊 Trading Settings:');
    const { data: settings, error: settingsError } = await supabase
      .from('trading_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ Settings error:', settingsError.message);
    } else {
      console.log('✅ Current settings:', settings[0]);
      console.log('📝 Options default:', settings[0]?.options_default);
    }

    // 2. Check if we need to update options_default to 'win' for testing
    console.log('\n🎯 Testing options trade outcome:');
    const { data: optionsResult, error: optionsError } = await supabase
      .rpc('check_trade_outcome', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_trade_type: 'options'
      });
    
    if (optionsError) {
      console.log('❌ Options test error:', optionsError.message);
    } else {
      console.log('✅ Options outcome for regular user:', optionsResult ? 'WIN' : 'LOSE');
    }

    // 3. Check force win user outcome
    const forceWinUserId = '6ef846d4-8edb-42f0-b386-08bdc67d93eb';
    const { data: forceWinResult, error: forceWinError } = await supabase
      .rpc('check_trade_outcome', {
        p_user_id: forceWinUserId,
        p_trade_type: 'options'
      });
    
    if (forceWinError) {
      console.log('❌ Force win user test error:', forceWinError.message);
    } else {
      console.log('✅ Options outcome for force win user:', forceWinResult ? 'WIN' : 'LOSE');
    }

    // 4. Check recent transactions to see if options are being recorded
    console.log('\n💰 Recent transactions:');
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'option')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (txError) {
      console.log('❌ Transactions error:', txError.message);
    } else {
      console.log('✅ Found', transactions.length, 'option transactions');
      transactions.forEach((tx, i) => {
        console.log(`   ${i+1}. Amount: $${tx.amount}, Payout: $${tx.price || 0}, Status: ${tx.status}`);
      });
    }

    console.log('\n🎯 Database alignment check complete!');

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkDatabaseAlignment();
