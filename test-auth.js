// Quick test to verify Supabase auth is working
const SUPABASE_URL = 'https://vcbhqzwrmahdmfeamgtl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYmhxendybWFoZG1mZWFtZ3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIzNjMsImV4cCI6MjA3NDQ4ODM2M30.eeQo663Wa52xJ7mHmIQdhdxBNQBAzkRio0_pX4zx6yc';

async function testAuth() {
  console.log('Testing Supabase Auth...\n');

  try {
    // Test auth health endpoint
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('Auth Health Check:');
    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.log('Response:', text);
    } else {
      console.log('✅ Auth endpoint is accessible');
    }

    // Parse the JWT to show the issue
    const [, payload] = SUPABASE_ANON_KEY.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

    console.log('\n⚠️  JWT Token Analysis:');
    console.log('Issued at:', new Date(decoded.iat * 1000).toISOString());
    console.log('Expires:', new Date(decoded.exp * 1000).toISOString());
    console.log('Current time:', new Date().toISOString());

    if (decoded.iat * 1000 > Date.now()) {
      console.log('\n❌ ERROR: Token was issued in the future! This token is invalid.');
      console.log('You need to regenerate your Supabase API keys.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();