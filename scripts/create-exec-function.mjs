#!/usr/bin/env node

// Create a custom SQL execution function in Supabase
// This will allow us to run SQL directly from Claude

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
let supabaseUrl, supabaseServiceKey;

try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]?.trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1]?.trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔗 Creating SQL execution function...');

// Create the RPC function manually using the existing migration system
const createFunctionSQL = `
-- Create a custom SQL execution function
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE query;
    GET DIAGNOSTICS result = ROW_COUNT;
    RETURN json_build_object('success', true, 'rows_affected', result);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;
`;

async function createFunction() {
  console.log('💡 Since we can\'t execute SQL directly, here are two options:');
  console.log('');
  console.log('📋 Option 1: Manual SQL (Recommended)');
  console.log('1. Go to your Supabase Dashboard SQL Editor');
  console.log('2. Copy and paste this SQL:');
  console.log('');
  console.log('--- SQL TO RUN IN SUPABASE ---');
  console.log(createFunctionSQL);
  console.log('--- END SQL ---');
  console.log('');
  console.log('3. After running that, run: node scripts/create-tables-direct.mjs');
  console.log('');
  
  console.log('📋 Option 2: Just create the tables directly');
  console.log('Copy the SQL from our previous attempt and run it in Supabase SQL Editor');
  
  return false;
}

await createFunction();