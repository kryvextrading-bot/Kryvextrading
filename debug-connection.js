// Debug Supabase Connection
import { createClient } from '@supabase/supabase-js'

console.log('=== Supabase Connection Debug ===');

// Test direct connection
const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseAnonKey = 'sb_publishable_xhmrUNQOfyYeqX44jlSAKA_HVQpKndg';

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
const testConnection = async () => {
  try {
    console.log('Testing connection...');
    
    // Test basic auth
    const { data, error } = await supabase.auth.getSession();
    console.log('Session result:', { data, error });
    
    // Test users table access
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .single();
    
    console.log('Users table access:', { users, usersError });
    
    if (usersError) {
      console.error('Users table error:', usersError);
    } else {
      console.log('✅ Users table accessible, count:', users);
    }
    
  } catch (err) {
    console.error('Connection test failed:', err);
  }
};

testConnection();
