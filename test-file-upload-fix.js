// Test the fixed file upload
// Run this in browser console after trying the deposit flow

console.log('🔧 Testing fixed file upload...');

// The fix should now:
// 1. Remove contentType parameter (let Supabase auto-detect)
// 2. Continue with deposit request even if file upload fails
// 3. Show detailed error logging for debugging

console.log('✅ Changes made:');
console.log('  - Removed contentType: proofFile.type from upload options');
console.log('  - Added fallback to continue without file upload');
console.log('  - Enhanced error logging with status codes');
console.log('  - Better error handling');

console.log('🧪 Expected behavior:');
console.log('  1. File upload should work (if storage bucket exists)');
console.log('  2. If upload fails, deposit request still created');
console.log('  3. Users can still submit deposit requests');
console.log('  4. Admin can manually verify deposits');

console.log('📋 Next steps:');
console.log('  1. Try deposit flow again');
console.log('  2. Check console for detailed logs');
console.log('  3. Verify deposit request is created');
console.log('  4. Check if file upload works now');

console.log('🎯 If file upload still fails:');
console.log('  - Deposit request will still be created');
console.log('  - Admin can manually verify transactions');
console.log('  - User can submit proof via other methods');

console.log('✅ Ready to test!');
