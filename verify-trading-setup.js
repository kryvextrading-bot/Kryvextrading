// Trading Control System Verification Script
// This script checks if all components are properly set up

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODQzNjcsImV4cCI6MjA4NjU2MDM2N30.3wWHnzdc8bkQeq2zjK2PX9CaYR-mXcoZbijLhhZf_qY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NDM2NywiZXhwIjoyMDg2NTYwMzY3fQ.qmrMKGJrj8tDyLMs3eLauZ5n9iMACLLut4hA2KNlh5A';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Trading Control System Verification\n');

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName}: NOT FOUND - ${error.message}`);
      return false;
    }
    
    console.log(`✅ Table ${tableName}: EXISTS`);
    return true;
  } catch (error) {
    console.log(`❌ Table ${tableName}: ERROR - ${error.message}`);
    return false;
  }
}

async function checkFunction(functionName) {
  try {
    const { data, error } = await supabase
      .rpc(functionName, {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_trade_type: 'spot'
      });
    
    if (error) {
      console.log(`❌ Function ${functionName}: NOT FOUND - ${error.message}`);
      return false;
    }
    
    console.log(`✅ Function ${functionName}: EXISTS`);
    return true;
  } catch (error) {
    console.log(`❌ Function ${functionName}: ERROR - ${error.message}`);
    return false;
  }
}

async function checkUsersTable() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .limit(3);
    
    if (error) {
      console.log(`❌ Users table access: FAILED - ${error.message}`);
      return false;
    }
    
    console.log(`✅ Users table: ACCESSIBLE (${data.length} users found)`);
    data.forEach(user => {
      console.log(`   - ${user.email} (Admin: ${user.is_admin})`);
    });
    return true;
  } catch (error) {
    console.log(`❌ Users table access: ERROR - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('📋 Checking Database Tables...\n');
  
  const tables = [
    'trade_outcomes',
    'trade_windows', 
    'trading_settings',
    'trading_admin_audit'
  ];
  
  let tableResults = [];
  for (const table of tables) {
    tableResults.push(await checkTable(table));
  }
  
  console.log('\n🔧 Checking Database Functions...\n');
  
  const functions = [
    'check_trade_outcome',
    'log_trading_admin_action'
  ];
  
  let functionResults = [];
  for (const func of functions) {
    functionResults.push(await checkFunction(func));
  }
  
  console.log('\n👥 Checking Users Table...\n');
  
  const usersOk = await checkUsersTable();
  
  console.log('\n📊 Summary:\n');
  
  const allTablesOk = tableResults.every(r => r);
  const allFunctionsOk = functionResults.every(r => r);
  
  console.log(`Tables: ${allTablesOk ? '✅ All OK' : '❌ Some missing'}`);
  console.log(`Functions: ${allFunctionsOk ? '✅ All OK' : '❌ Some missing'}`);
  console.log(`Users: ${usersOk ? '✅ Accessible' : '❌ Not accessible'}`);
  
  if (allTablesOk && allFunctionsOk && usersOk) {
    console.log('\n🎉 Trading Control System is FULLY SET UP and ready to use!');
  } else {
    console.log('\n⚠️  Trading Control System needs setup.');
    console.log('💡 Run the trading-control-setup.sql script in Supabase SQL Editor');
  }
  
  console.log('\n🔗 Next Steps:');
  console.log('1. If setup is needed: Open Supabase Dashboard > SQL Editor');
  console.log('2. Copy and paste the contents of database-scripts/trading-control-setup.sql');
  console.log('3. Run the script to create all tables and functions');
  console.log('4. Access the Trading Admin Panel at /admin/trading-admin');
}

main().catch(console.error);
