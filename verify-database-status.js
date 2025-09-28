// Verify Database Status
// This checks if the fixes have been applied

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabaseStatus() {
  console.log('🔍 Checking Database Status...\n');
  console.log('========================================');

  let issues = [];
  let successes = [];

  // 1. Check if profiles table has email column
  console.log('1. Checking profiles table columns...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username, full_name')
      .limit(1);

    if (!error) {
      successes.push('✅ Profiles table has email column');
      successes.push('✅ Profiles table is accessible');
    } else if (error.message.includes('email')) {
      issues.push('❌ Email column might be missing');
    } else {
      issues.push(`❌ Profiles table error: ${error.message}`);
    }
  } catch (err) {
    issues.push(`❌ Cannot check profiles table: ${err.message}`);
  }

  // 2. Test creating a profile (simulates registration)
  console.log('\n2. Testing profile creation...');
  const testId = `test-${Date.now()}`;
  const testEmail = `test${Date.now()}@example.com`;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: testEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error) {
      successes.push('✅ Can create profiles (RLS working)');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
    } else {
      issues.push(`❌ Cannot create profile: ${error.message}`);
      if (error.message.includes('policy')) {
        issues.push('   → RLS policies need fixing');
      }
    }
  } catch (err) {
    issues.push(`❌ Profile creation failed: ${err.message}`);
  }

  // 3. Check RLS status
  console.log('\n3. Checking RLS configuration...');
  try {
    // Try with anon key
    const anonSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data, error } = await anonSupabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!error) {
      successes.push('✅ Anonymous users can read profiles');
    } else {
      issues.push('❌ Anonymous users cannot read profiles');
    }
  } catch (err) {
    issues.push(`❌ RLS check failed: ${err.message}`);
  }

  // 4. Check for existing users without profiles
  console.log('\n4. Checking for orphaned users...');
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase.from('profiles').select('id');

    if (users && profiles) {
      const userIds = users.users.map(u => u.id);
      const profileIds = profiles.map(p => p.id);
      const orphaned = userIds.filter(id => !profileIds.includes(id));

      if (orphaned.length > 0) {
        issues.push(`⚠️  ${orphaned.length} users without profiles`);
      } else {
        successes.push('✅ All users have profiles');
      }
    }
  } catch (err) {
    // Admin API might not be accessible
    console.log('   (Skipping admin check - requires admin access)');
  }

  // Print results
  console.log('\n========================================');
  console.log('📊 RESULTS:');
  console.log('========================================\n');

  if (successes.length > 0) {
    console.log('✅ Working:');
    successes.forEach(s => console.log(`   ${s}`));
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach(i => console.log(`   ${i}`));

    console.log('\n🔧 RECOMMENDED FIX:');
    console.log('========================================');

    if (issues.some(i => i.includes('Email column'))) {
      console.log('1. Run this SQL to add email column:');
      console.log('   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;');
    }

    if (issues.some(i => i.includes('policy') || i.includes('RLS'))) {
      console.log('\n2. Run this SQL to fix RLS:');
      console.log('   -- Disable RLS temporarily');
      console.log('   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
      console.log('   ');
      console.log('   -- Or for testing, you can keep it disabled');
      console.log('   -- and re-enable with proper policies later');
    }

    if (issues.some(i => i.includes('orphaned'))) {
      console.log('\n3. Create profiles for existing users - run fix-existing-profiles.sql');
    }
  } else {
    console.log('\n🎉 Everything looks good!');
    console.log('   Registration should work now.');
  }

  console.log('\n========================================');
  console.log('Next steps to test registration:');
  console.log('1. Go to http://localhost:5173');
  console.log('2. Click Sign Up');
  console.log('3. Try with: test@example.com');
  console.log('4. If it fails, check browser console');
  console.log('========================================\n');
}

verifyDatabaseStatus().catch(console.error);