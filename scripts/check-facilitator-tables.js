#!/usr/bin/env node

// Check Facilitator Database Tables
// Run with: node scripts/check-facilitator-tables.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
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
  
  // Test facilitator_availability_overrides table (if it exists)
  console.log('\n📋 Testing facilitator_availability_overrides table:');
  const { data: overridesData, error: overridesError } = await supabase
    .from('facilitator_availability_overrides')
    .select('id')
    .limit(1);
  
  if (overridesError) {
    console.error('❌ facilitator_availability_overrides error:', overridesError.message);
    console.error('   Code:', overridesError.code);
  } else {
    console.log('✅ facilitator_availability_overrides table accessible');
    console.log('   Records found:', overridesData?.length || 0);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const tablesWorking = !availabilityError && !specialtiesError;
  if (tablesWorking) {
    console.log('🎉 All required facilitator tables are working!');
    console.log('📱 The facilitator features should work in your app now.');
  } else {
    console.log('⚠️  Some tables are having issues.');
    console.log('💡 You may need to run the migration in your Supabase dashboard.');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration from: supabase/migrations/20250122000001_add_facilitator_availability.sql');
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