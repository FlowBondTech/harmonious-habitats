// Test Profile Creation Script
// Run this with: node test-profile-creation.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role for testing
);

async function testProfileCreation() {
  console.log('🔍 Testing Profile Creation...\n');

  // 1. First check current RLS policies
  console.log('1. Checking current RLS policies...');
  try {
    const { data: policies, error } = await supabase
      .rpc('get_policies_for_table', { table_name: 'profiles' })
      .single();

    if (!error && policies) {
      console.log('Found policies:', policies);
    }
  } catch (e) {
    // This RPC might not exist, that's OK
  }

  // 2. Test creating a profile directly (as service role)
  console.log('\n2. Testing direct profile creation (service role)...');
  const testUserId = 'test-' + Date.now();
  const testEmail = `test${Date.now()}@example.com`;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        username: 'testuser',
        full_name: 'Test User',
        holistic_interests: [],
        rating: 0,
        total_reviews: 0,
        verified: false,
        discovery_radius: 10
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create profile:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Profile created successfully:', data);

      // Clean up test profile
      await supabase.from('profiles').delete().eq('id', testUserId);
      console.log('🧹 Test profile cleaned up');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // 3. Check if the profiles table has proper columns
  console.log('\n3. Checking profiles table structure...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    if (!error) {
      console.log('✅ Profiles table is accessible');
    } else {
      console.error('❌ Cannot access profiles table:', error.message);
    }
  } catch (err) {
    console.error('❌ Error checking table:', err);
  }

  // 4. Test with anon key (simulating client-side)
  console.log('\n4. Testing with anon key (client simulation)...');
  const anonSupabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await anonSupabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Anon users can read profiles');
    } else {
      console.error('❌ Anon users cannot read profiles:', error.message);
    }
  } catch (err) {
    console.error('❌ Error with anon access:', err);
  }

  console.log('\n========================================');
  console.log('RECOMMENDED NEXT STEPS:');
  console.log('========================================');
  console.log('1. Run the simple-rls-fix.sql in Supabase');
  console.log('2. Try registering a new user in the app');
  console.log('3. Check Supabase logs for any errors');
  console.log('4. If still failing, temporarily disable RLS:');
  console.log('   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
  console.log('========================================\n');
}

testProfileCreation().catch(console.error);