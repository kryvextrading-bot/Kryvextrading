// Test script to verify real-time admin dashboard functionality
console.log('🧪 Testing Admin Dashboard Real-time Functionality...\n');

// Test 1: Check if frontend is accessible
console.log('1. Testing frontend accessibility...');
fetch('http://localhost:8082/')
  .then(response => {
    if (response.ok) {
      console.log('✅ Frontend is accessible on http://localhost:8082');
    } else {
      console.log('❌ Frontend not accessible');
    }
  })
  .catch(error => {
    console.log('❌ Frontend connection error:', error.message);
  });

// Test 2: Check if backend API is accessible
console.log('\n2. Testing backend API...');
fetch('http://localhost:3001/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend API is accessible:', data);
  })
  .catch(error => {
    console.log('❌ Backend API connection error:', error.message);
  });

// Test 3: Check admin dashboard data endpoints
console.log('\n3. Testing admin data endpoints...');
Promise.all([
  fetch('http://localhost:3001/api/users').then(r => r.json()),
  fetch('http://localhost:3001/api/transactions').then(r => r.json()),
  fetch('http://localhost:3001/api/dashboard/stats').then(r => r.json())
])
  .then(([users, transactions, stats]) => {
    console.log('✅ Admin data endpoints working:');
    console.log(`   - Users: ${users.length} found`);
    console.log(`   - Transactions: ${transactions.length} found`);
    console.log(`   - Stats:`, stats);
  })
  .catch(error => {
    console.log('❌ Admin data endpoints error:', error.message);
  });

// Test 4: Instructions for manual testing
console.log('\n4. Manual Testing Instructions:');
console.log('   - Open http://localhost:8082 in browser');
console.log('   - Login as admin: admin@swan-ira.com / admin123');
console.log('   - Navigate to Admin Dashboard');
console.log('   - Look for:');
console.log('     * "Live Updates Active" status indicator');
console.log('     * Real-time notifications appearing');
console.log('     * Stats updating automatically');
console.log('     * New transactions appearing in Transaction Management');

console.log('\n🎯 Test completed! Check browser for real-time updates.');
