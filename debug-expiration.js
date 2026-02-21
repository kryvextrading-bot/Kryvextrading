// Debug script to test order expiration logic
console.log('Testing order expiration flow...');

// Simulate the key parts of the expiration logic
const mockTrade = {
  id: 'test-order-123',
  endTime: Date.now() / 1000 + 5, // 5 seconds from now
  duration: 60,
  status: 'ACTIVE'
};

console.log('Mock trade created:', mockTrade);

// Simulate the countdown completion
setTimeout(() => {
  console.log('⏰ Timer expired! Trade should move from active to completed');
  console.log('Current time:', Date.now() / 1000);
  console.log('Trade end time:', mockTrade.endTime);
  console.log('Should trigger handleOrderExpire with orderId:', mockTrade.id);
}, 6000); // Wait 6 seconds

console.log('Debug script loaded. Check console in 6 seconds...');
