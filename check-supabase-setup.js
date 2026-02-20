/**
 * Check and Setup Supabase Trading Control Tables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NDM2NywiZXhwIjoyMDg2NTYwMzY3fQ.qmrMKGJrj8tDyLMs3eLauZ5n9iMACLLut4hA2KNlh5A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Setup...\n');

  try {
    // 1. Check if trading_settings table exists
    console.log('📊 Checking trading_settings table...');
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('trading_settings')
        .select('*')
        .limit(1);
      
      if (settingsError) {
        console.log('❌ trading_settings table error:', settingsError.message);
        console.log('🔧 Need to create trading_settings table');
      } else {
        console.log('✅ trading_settings table exists');
        console.log('📝 Current settings:', settings);
      }
    } catch (err) {
      console.log('❌ trading_settings table not found');
    }

    // 2. Check if trade_outcomes table exists
    console.log('\n🎯 Checking trade_outcomes table...');
    try {
      const { data: outcomes, error: outcomesError } = await supabase
        .from('trade_outcomes')
        .select('*')
        .limit(1);
      
      if (outcomesError) {
        console.log('❌ trade_outcomes table error:', outcomesError.message);
        console.log('🔧 Need to create trade_outcomes table');
      } else {
        console.log('✅ trade_outcomes table exists');
        console.log('📝 Current outcomes:', outcomes);
      }
    } catch (err) {
      console.log('❌ trade_outcomes table not found');
    }

    // 3. Check if trade_windows table exists
    console.log('\n⏰ Checking trade_windows table...');
    try {
      const { data: windows, error: windowsError } = await supabase
        .from('trade_windows')
        .select('*')
        .limit(1);
      
      if (windowsError) {
        console.log('❌ trade_windows table error:', windowsError.message);
        console.log('🔧 Need to create trade_windows table');
      } else {
        console.log('✅ trade_windows table exists');
        console.log('📝 Current windows:', windows);
      }
    } catch (err) {
      console.log('❌ trade_windows table not found');
    }

    // 4. Check if check_trade_outcome function exists
    console.log('\n🎲 Checking check_trade_outcome function...');
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('check_trade_outcome', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_trade_type: 'spot'
        });
      
      if (functionError) {
        console.log('❌ check_trade_outcome function error:', functionError.message);
        console.log('🔧 Need to create check_trade_outcome function');
      } else {
        console.log('✅ check_trade_outcome function exists');
        console.log('📝 Function result:', functionResult);
      }
    } catch (err) {
      console.log('❌ check_trade_outcome function not found');
    }

    // 5. Check existing users
    console.log('\n👥 Checking existing users...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, is_admin')
        .limit(5);
      
      if (usersError) {
        console.log('❌ Users table error:', usersError.message);
      } else {
        console.log('✅ Found', users.length, 'users');
        users.forEach(user => {
          console.log(`   👤 ${user.email} ${user.is_admin ? '(ADMIN)' : '(USER)'}`);
        });
      }
    } catch (err) {
      console.log('❌ Users table not found');
    }

    console.log('\n🎯 Database check complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. If tables are missing, run the trading-control-setup.sql script');
    console.log('2. Update trading_settings to set default outcomes');
    console.log('3. Add user-specific trade outcomes if needed');
    console.log('4. Test the check_trade_outcome function');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if Supabase URL is correct');
    console.log('2. Verify service role key has proper permissions');
    console.log('3. Ensure Supabase project is active');
  }
}

checkDatabase();
