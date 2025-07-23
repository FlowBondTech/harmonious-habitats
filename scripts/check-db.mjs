#!/usr/bin/env node

// Check Facilitator Database Tables
// Run with: node scripts/check-db.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env file
let supabaseUrl, supabaseAnonKey;

try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('🔍 Checking facilitator tables...');
  console.log('📡 Connected to:', supabaseUrl);
  
  // Test facilitator_availability table
  console.log('\n📋 Testing facilitator_availability table:');
  const { data: availabilityData, error: availabilityError } = await supabase
    .from('facilitator_availability')
    .select('id')
    .limit(1);
  
  if (availabilityError) {
    console.error('❌ facilitator_availability error:', availabilityError.message);
    console.error('   Code:', availabilityError.code);
    console.error('   Details:', availabilityError.details);
  } else {
    console.log('✅ facilitator_availability table accessible');
    console.log('   Records found:', availabilityData?.length || 0);
  }
  
  // Test facilitator_specialties table
  console.log('\n📋 Testing facilitator_specialties table:');
  const { data: specialtiesData, error: specialtiesError } = await supabase
    .from('facilitator_specialties')
    .select('id')
    .limit(1);
  
  if (specialtiesError) {
    console.error('❌ facilitator_specialties error:', specialtiesError.message);
    console.error('   Code:', specialtiesError.code);
    console.error('   Details:', specialtiesError.details);
  } else {
    console.log('✅ facilitator_specialties table accessible');
    console.log('   Records found:', specialtiesData?.length || 0);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const tablesWorking = !availabilityError && !specialtiesError;
  if (tablesWorking) {
    console.log('🎉 All required facilitator tables are working!');
    console.log('📱 The facilitator features should work in your app now.');
  } else {
    console.log('⚠️  Some tables are having issues.');
    console.log('💡 The tables likely need to be created in your database.');
    
    if (availabilityError?.code === '42P01' || specialtiesError?.code === '42P01') {
      console.log('');
      console.log('🔧 Tables do not exist. Next steps:');
      console.log('1. Go to your Supabase dashboard SQL Editor');
      console.log('2. Copy and paste the contents of one of these files:');
      console.log('   - fix_facilitator_tables.sql (comprehensive fix)');
      console.log('   - supabase/migrations/20250122000001_add_facilitator_availability.sql (migration)');
      console.log('3. Run the SQL script');
      console.log('4. Run this check again');
    }
  }
}

async function main() {
  try {
    await checkTables();
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

main();