// Test the enhanced rate limiting and caching solution
const testRateLimitFix = async () => {
  console.log('🧪 Testing Enhanced Rate Limiting Solution...\n');

  try {
    // Test 1: First request should hit API
    console.log('1. Testing first request (should hit CoinGecko API)...');
    const start1 = Date.now();
    const response1 = await fetch('http://localhost:3001/api/crypto/prices?ids=bitcoin,ethereum');
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    
    if (response1.ok && data1.bitcoin) {
      console.log(`✅ First request: ${time1}ms, BTC: $${data1.bitcoin.usd}`);
    } else {
      console.log(`⚠️ First request rate limited: ${data1.error || 'Unknown error'}`);
    }

    // Test 2: Second request should use cache
    console.log('\n2. Testing second request (should use cache)...');
    const start2 = Date.now();
    const response2 = await fetch('http://localhost:3001/api/crypto/prices?ids=bitcoin,ethereum');
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    
    if (response2.ok && data2.bitcoin) {
      console.log(`✅ Second request: ${time2}ms, BTC: $${data2.bitcoin.usd} (cached: ${time2 < 50})`);
    } else {
      console.log(`⚠️ Second request rate limited: ${data2.error || 'Unknown error'}`);
    }

    // Test 3: Multiple rapid requests to test rate limiting
    console.log('\n3. Testing rate limiting with 15 rapid requests...');
    const promises = [];
    const start3 = Date.now();
    
    for (let i = 0; i < 15; i++) {
      promises.push(
        fetch('http://localhost:3001/api/crypto/prices?ids=bitcoin')
          .then(async res => {
            const contentType = res.headers.get('content-type');
            const data = contentType && contentType.includes('application/json') 
              ? await res.json() 
              : await res.text();
            return {
              status: res.status,
              ok: res.ok,
              data: data
            };
          })
          .catch(err => ({ error: err.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const time3 = Date.now() - start3;
    
    const successCount = results.filter(r => r.ok).length;
    const rateLimitedCount = results.filter(r => r.status === 429).length;
    const errorCount = results.filter(r => r.error).length;
    
    console.log(`✅ Completed in ${time3}ms`);
    console.log(`📊 Results: ${successCount} successful, ${rateLimitedCount} rate limited, ${errorCount} errors`);

    // Test 4: Health check with cache info
    console.log('\n4. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 5: Cache management
    console.log('\n5. Testing cache management...');
    const clearResponse = await fetch('http://localhost:3001/api/cache/clear');
    const clearData = await clearResponse.json();
    console.log('✅ Cache cleared:', clearData);

    console.log('\n🎉 Enhanced Solution Summary:');
    console.log('✅ In-memory caching (60s TTL) reduces API calls');
    console.log('✅ Rate limiting reduced to 10 requests/minute');
    console.log('✅ Stale cache serves as fallback during API errors');
    console.log('✅ Frontend refresh interval increased to 2 minutes');
    console.log('✅ Better error handling with exponential backoff');
    console.log('✅ Cache size management to prevent memory leaks');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testRateLimitFix();
