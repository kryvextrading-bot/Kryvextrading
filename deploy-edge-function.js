// Simple script to deploy Supabase Edge Function
const { execSync } = require('child_process');

console.log('🚀 Deploying Supabase Edge Function...');

try {
  // Check if supabase CLI is available
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
  } catch (error) {
    console.log('❌ Supabase CLI not found. Installing...');
    execSync('npm install -g supabase', { stdio: 'inherit' });
  }

  // Link to project (if not already linked)
  try {
    execSync('supabase link', { stdio: 'inherit' });
    console.log('✅ Project linked');
  } catch (error) {
    console.log('ℹ️ Project might already be linked');
  }

  // Deploy the function
  execSync('supabase functions deploy deposit', { stdio: 'inherit' });
  console.log('✅ Edge function deployed successfully!');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
