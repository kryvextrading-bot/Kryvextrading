/**
 * Check Existing Users in Database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZ2YWNzZnhmcHd1ZWtlbmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NDM2NywiZXhwIjoyMDg2NTYwMzY3fQ.qmrMKGJrj8tDyLMs3eLauZ5n9iMACLLut4hA2KNlh5A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('👥 Checking existing users in database...\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, is_admin, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Found', users.length, 'users:');
  users.forEach((user, i) => {
    console.log(`${i+1}. Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Admin: ${user.is_admin ? 'YES' : 'NO'}`);
    console.log(`   ID: ${user.id}`);
    console.log('');
  });
  
  console.log('🔑 Login Credentials:');
  console.log('For testing, you can use any existing user email with password: "password123"');
  console.log('');
  console.log('📝 If users need passwords set, run this SQL in Supabase:');
  console.log('UPDATE auth.users SET encrypted_password = crypt("password123", gen_salt("bf", 8)) WHERE email IN (SELECT email FROM users);');
}

checkUsers();
