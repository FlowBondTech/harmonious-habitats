#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Profiles Table...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProfilesTable() {
  try {
    // Test 1: Check if profiles table exists
    console.log('1️⃣  Checking if profiles table exists...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ Profiles table does not exist!');
        console.log('   Need to create the table structure.');
        return false;
      } else {
        console.log('⚠️  Error checking table:', tableError.message);
      }
    } else {
      console.log('✅ Profiles table exists');
    }

    // Test 2: Check table structure
    console.log('\n2️⃣  Checking table columns...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'profiles'
    }).single();

    if (columnsError) {
      // Try alternative method
      const { data: sample, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(0);

      if (!sampleError) {
        console.log('✅ Table structure is accessible');
      } else {
        console.log('⚠️  Could not determine table structure');
      }
    } else {
      console.log('✅ Table columns:', columns);
    }

    // Test 3: Check RLS policies
    console.log('\n3️⃣  Checking RLS policies...');

    // Try to insert a test profile
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: insertTest, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        console.log('ℹ️  Test profile already exists');
      } else if (insertError.message.includes('violates')) {
        console.log('⚠️  RLS policies may be blocking inserts');
      } else {
        console.log('⚠️  Insert test failed:', insertError.message);
      }
    } else {
      console.log('✅ Can insert into profiles table');

      // Clean up test data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testProfilesTable().then((exists) => {
  if (!exists) {
    console.log('\n📝 The profiles table needs to be created.');
    console.log('You can use the Supabase dashboard or run the SQL migrations.');
  }
  process.exit(0);
});