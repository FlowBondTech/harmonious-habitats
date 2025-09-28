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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseAnonKey?.substring(0, 20)}...`);
console.log('━'.repeat(50));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n1️⃣  Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.log('❌ Connection failed:', healthError.message);
    } else {
      console.log('✅ Connection successful!');
      console.log(`   Found ${healthCheck} user profiles`);
    }

    // Test 2: Check auth status
    console.log('\n2️⃣  Testing authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('❌ Auth check failed:', authError.message);
    } else if (session) {
      console.log('✅ Authenticated as:', session.user.email);
    } else {
      console.log('ℹ️  No active session (anonymous access)');
    }

    // Test 3: List available tables
    console.log('\n3️⃣  Checking database tables...');
    const tables = [
      'profiles',
      'events',
      'spaces',
      'neighborhoods',
      'messages',
      'notifications',
      'event_participants',
      'space_applications',
      'space_bookings'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} records`);
      }
    }

    // Test 4: Test real-time capabilities
    console.log('\n4️⃣  Testing real-time subscription...');
    const channel = supabase.channel('test-channel');

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        console.log('   📨 Real-time event received:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Real-time subscription active');
          // Clean up
          setTimeout(() => {
            channel.unsubscribe();
            console.log('   🔌 Unsubscribed from real-time');
          }, 1000);
        }
      });

    // Test 5: Check RLS policies
    console.log('\n5️⃣  Testing Row Level Security...');
    const { data: publicEvents, error: rlsError } = await supabase
      .from('events')
      .select('id, title, start_time')
      .limit(3);

    if (rlsError) {
      console.log('   ⚠️  RLS may be blocking access:', rlsError.message);
    } else {
      console.log(`   ✅ RLS allows reading ${publicEvents?.length || 0} events`);
      if (publicEvents && publicEvents.length > 0) {
        console.log('   Sample events:');
        publicEvents.forEach(event => {
          console.log(`     - ${event.title} (${new Date(event.start_time).toLocaleDateString()})`);
        });
      }
    }

    console.log('\n' + '━'.repeat(50));
    console.log('✨ Database connection test complete!');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testConnection().then(() => process.exit(0));