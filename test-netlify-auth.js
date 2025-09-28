// Test authentication on deployed site
// Run this in browser console on your Netlify site

async function testAuth() {
  console.log('🔍 Testing Authentication...\n');

  // Check if Supabase is loaded
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in the browser console');
    return;
  }

  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!hasUrl || !hasKey) {
    console.error('❌ Missing environment variables!');
    console.log('VITE_SUPABASE_URL present:', hasUrl);
    console.log('VITE_SUPABASE_ANON_KEY present:', hasKey);
    console.log('\nFIX: Add these in Netlify Dashboard > Site Settings > Environment Variables');
    return;
  }

  console.log('✅ Environment variables are set');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

  // Test 2: Try to create a test user
  console.log('\n2. Testing signup...');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Import Supabase from the app
    const { supabase } = await import('/src/lib/supabase.ts');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ Signup failed:', error.message);

      if (error.message.includes('not authorized')) {
        console.log('\nFIX: In Supabase Dashboard:');
        console.log('1. Go to Authentication > URL Configuration');
        console.log('2. Add your Netlify URL to Site URL');
        console.log('3. Add your Netlify URL to Redirect URLs');
      }

      if (error.message.includes('Email domain')) {
        console.log('\nFIX: Email domain might be restricted');
        console.log('Check Authentication > Settings in Supabase');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User:', data.user?.email);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Test 3: Check current session
  console.log('\n3. Checking current session...');
  try {
    const { supabase } = await import('/src/lib/supabase.ts');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ Active session found:', session.user.email);
    } else {
      console.log('ℹ️ No active session');
    }
  } catch (err) {
    console.error('❌ Session check failed:', err.message);
  }
}

// Run the test
testAuth();