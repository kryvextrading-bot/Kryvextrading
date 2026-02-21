// Script to check active trades and create test data if needed
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using hardcoded values for testing)
const supabase = createClient(
  'https://your-project.supabase.co', // Replace with your actual URL
  'your-anon-key' // Replace with your actual anon key
);

async function checkActiveTrades() {
  try {
    console.log('🔍 Checking for active trades...');
    
    // Check all trades with their statuses
    const { data: allTrades, error: allError } = await supabase
      .from('options_orders')
      .select('id, status, created_at, completed_at, pnl')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ Error fetching all trades:', allError);
      return;
    }
    
    console.log('📊 All recent trades:');
    allTrades.forEach(trade => {
      console.log(`  - ID: ${trade.id}, Status: ${trade.status}, PnL: ${trade.pnl}, Created: ${trade.created_at}, Completed: ${trade.completed_at}`);
    });
    
    // Check specifically for active trades
    const { data: activeTrades, error: activeError } = await supabase
      .from('options_orders')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (activeError) {
      console.error('❌ Error fetching active trades:', activeError);
      return;
    }
    
    console.log(`\n🎯 Active trades found: ${activeTrades.length}`);
    
    if (activeTrades.length === 0) {
      console.log('⚠️ No active trades found. Creating a test active trade...');
      
      // Create a test active trade
      const testTrade = {
        id: 'test-active-' + Date.now(),
        user_id: '6ef846d4-8edb-42f0-b386-08bdc67d93eb', // Using your user ID
        symbol: 'BTCUSDT',
        direction: 'UP',
        stake: 100,
        entry_price: 67000,
        expiry_price: null,
        profit: null,
        fee: 0.15,
        duration: 60,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        status: 'ACTIVE',
        payout_rate: 0.176,
        fluctuation_range: 0.01,
        created_at: new Date().toISOString(),
        completed_at: null,
        pnl: null,
        metadata: {
          isTest: true,
          createdAt: new Date().toISOString()
        }
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('options_orders')
        .insert(testTrade);
      
      if (insertError) {
        console.error('❌ Error creating test trade:', insertError);
      } else {
        console.log('✅ Test active trade created:', insertData);
        console.log('🕐 This trade will expire in 1 minute');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in checkActiveTrades:', error);
  }
}

checkActiveTrades();
