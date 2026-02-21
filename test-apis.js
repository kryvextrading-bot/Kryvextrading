// Test script to debug API issues
console.log('🔍 Testing API Keys...');

// Test Alpha Vantage
async function testAlphaVantage() {
  const ALPHA_VANTAGE_KEY = '0MNHI3Z9NJB7M9G8';
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${ALPHA_VANTAGE_KEY}`;
  
  try {
    console.log('🔄 Testing Alpha Vantage...');
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ Alpha Vantage working!');
    } else {
      console.log('❌ Alpha Vantage failed');
    }
  } catch (error) {
    console.error('❌ Alpha Vantage error:', error);
  }
}

// Test Twelve Data
async function testTwelveData() {
  const TWELVE_DATA_KEY = '13267ae110b74bc2bf628ac97c338550';
  const url = `https://api.twelvedata.com/price?symbol=BTC/USD&apikey=${TWELVE_DATA_KEY}`;
  
  try {
    console.log('🔄 Testing Twelve Data...');
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ Twelve Data working!');
    } else {
      console.log('❌ Twelve Data failed');
    }
  } catch (error) {
    console.error('❌ Twelve Data error:', error);
  }
}

// Test CoinGecko
async function testCoinGecko() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
  
  try {
    console.log('🔄 Testing CoinGecko...');
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ CoinGecko working!');
    } else {
      console.log('❌ CoinGecko failed');
    }
  } catch (error) {
    console.error('❌ CoinGecko error:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 API TESTS STARTING 🧪');
  
  await testAlphaVantage();
  await testTwelveData();
  await testCoinGecko();
  
  console.log('🧪 API TESTS COMPLETE 🧪');
  console.log('='.repeat(50));
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  runTests();
}
