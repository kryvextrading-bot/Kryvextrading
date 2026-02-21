// Debug script to test expiration manually
// Open browser console and run this to manually trigger expiration

console.log('🔍 Debug: Testing manual expiration...');

// Find the active trade card
const activeTradeCard = document.querySelector('[data-component-name="ActiveTradeCard"]');
if (activeTradeCard) {
  console.log('✅ Found active trade card:', activeTradeCard);
  
  // Try to extract the trade ID (might be in React internals)
  const reactKey = Object.keys(activeTradeCard).find(key => key.startsWith('__react'));
  if (reactKey) {
    console.log('🔍 React key found:', reactKey);
    const reactInstance = activeTradeCard[reactKey];
    console.log('🔍 React instance:', reactInstance);
  }
} else {
  console.log('❌ No active trade card found');
}

// Check for any active orders in the page
const timerElements = document.querySelectorAll('.animate-pulse');
console.log(`🕐 Found ${timerElements.length} timer elements with animate-pulse class`);

timerElements.forEach((el, index) => {
  console.log(`Timer ${index + 1}:`, el.textContent);
});

console.log('💡 To manually test expiration, you can:');
console.log('1. Open React DevTools');
console.log('2. Find the TradingPage component');
console.log('3. Look for handleOrderExpire function');
console.log('4. Call it with the trade ID');
