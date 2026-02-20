// Paste this in your browser console on the trading site to refresh admin status
// This will force the AuthContext to fetch the latest user data

(async () => {
  try {
    // Get the current React component tree
    const authContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.rendererFiber?.current?.memoizedState?.memoizedState?.find(s => s.memoizedState?.refreshUser);
    
    if (authContext && authContext.memoizedState?.refreshUser) {
      console.log('Refreshing user data...');
      await authContext.memoizedState.refreshUser();
      console.log('User data refreshed! Please refresh the page.');
      
      // Force page reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('Could not find refreshUser function. Please try logging out and back in.');
    }
  } catch (error) {
    console.error('Error refreshing user data:', error);
    console.log('Please try logging out and logging back in.');
  }
})();
