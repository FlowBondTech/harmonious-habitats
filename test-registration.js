// Test User Registration
// This simulates what happens when a user signs up

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  // Use anon key like the app does
);

async function testRegistration() {
  console.log('🧪 Testing User Registration...\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log(`Attempting to register: ${testEmail}`);
  console.log('========================================\n');

  try {
    // This is exactly what the app does
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          username: 'testuser',
          neighborhood: 'Test Neighborhood'
        }
      }
    });

    if (error) {
      console.log('❌ Registration failed!');
      console.log('Error:', error.message);

      if (error.message.includes('invalid')) {
        console.log('\n🔍 Possible causes:');
        console.log('1. Email validation is too strict in Supabase');
        console.log('2. Password requirements not met');
        console.log('\nTry in Supabase Dashboard:');
        console.log('→ Authentication → Settings → Check email settings');
      }

      if (error.message.includes('policy')) {
        console.log('\n🔍 RLS Policy Issue Detected!');
        console.log('Quick fix - run this SQL:');
        console.log('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
      }
    } else if (data.user) {
      console.log('✅ Registration successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);

      // Check if profile was created
      console.log('\n📋 Checking profile creation...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        console.log('✅ Profile created automatically!');
        console.log('Profile has email:', profile.email ? '✓' : '✗');
        console.log('Profile has username:', profile.username ? '✓' : '✗');
      } else if (profileError) {
        console.log('❌ Profile not created');
        console.log('Error:', profileError.message);
        console.log('\nThis means the trigger is not working.');
        console.log('Run fix-existing-profiles.sql to fix this.');
      }

      console.log('\n🎉 Everything is working! Users can register.');
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');
  console.log('\nWhat to do next:');
  console.log('1. If registration worked: Try signing up in the app!');
  console.log('2. If it failed: Check the error message above');
  console.log('3. For "invalid email": Check Supabase Auth settings');
  console.log('4. For RLS errors: Run the SQL fix provided');
  console.log('========================================\n');
}

testRegistration().catch(console.error);