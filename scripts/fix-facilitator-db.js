#!/usr/bin/env node

// Fix Facilitator Database Tables
// Run with: node scripts/fix-facilitator-db.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', tableName)
    .eq('table_schema', 'public');
  
  if (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
  
  return data && data.length > 0;
}

async function createFacilitatorTables() {
  console.log('🔧 Creating facilitator tables...');
  
  const createTableSQL = `
    -- Create facilitator_availability table
    CREATE TABLE IF NOT EXISTS public.facilitator_availability (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        facilitator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT false NOT NULL,
        timezone TEXT DEFAULT 'UTC' NOT NULL,
        weekly_schedule JSONB DEFAULT '{}'::jsonb NOT NULL,
        minimum_notice_hours INTEGER DEFAULT 24 NOT NULL,
        maximum_advance_days INTEGER DEFAULT 90 NOT NULL,
        default_event_duration INTEGER DEFAULT 60 NOT NULL,
        pricing JSONB DEFAULT '{}'::jsonb NOT NULL,
        location_preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
        
        UNIQUE(facilitator_id)
    );

    -- Create facilitator_specialties table
    CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        facilitator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        specialty TEXT NOT NULL,
        category TEXT NOT NULL,
        experience_years INTEGER DEFAULT 0 NOT NULL,
        
        UNIQUE(facilitator_id, specialty)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON public.facilitator_availability(facilitator_id);
    CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON public.facilitator_availability(is_active);
    CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON public.facilitator_specialties(facilitator_id);
    CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON public.facilitator_specialties(category);

    -- Enable RLS
    ALTER TABLE public.facilitator_availability ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.facilitator_specialties ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    DROP POLICY IF EXISTS "Users can manage their own facilitator availability" ON public.facilitator_availability;
    CREATE POLICY "Users can manage their own facilitator availability" ON public.facilitator_availability
        FOR ALL USING (auth.uid() = facilitator_id);

    DROP POLICY IF EXISTS "Public can view active facilitator availability" ON public.facilitator_availability;
    CREATE POLICY "Public can view active facilitator availability" ON public.facilitator_availability
        FOR SELECT USING (is_active = true);

    DROP POLICY IF EXISTS "Users can manage their own facilitator specialties" ON public.facilitator_specialties;
    CREATE POLICY "Users can manage their own facilitator specialties" ON public.facilitator_specialties
        FOR ALL USING (auth.uid() = facilitator_id);

    DROP POLICY IF EXISTS "Public can view facilitator specialties" ON public.facilitator_specialties;
    CREATE POLICY "Public can view facilitator specialties" ON public.facilitator_specialties
        FOR SELECT USING (true);
  `;

  const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
  
  if (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
  
  console.log('✅ Tables created successfully');
  return true;
}

async function testTables() {
  console.log('🧪 Testing table access...');
  
  // Test facilitator_availability
  const { error: availabilityError } = await supabase
    .from('facilitator_availability')
    .select('id')
    .limit(1);
  
  if (availabilityError) {
    console.error('❌ Error accessing facilitator_availability:', availabilityError.message);
    return false;
  }
  
  // Test facilitator_specialties
  const { error: specialtiesError } = await supabase
    .from('facilitator_specialties')
    .select('id')
    .limit(1);
  
  if (specialtiesError) {
    console.error('❌ Error accessing facilitator_specialties:', specialtiesError.message);
    return false;
  }
  
  console.log('✅ All tables accessible');
  return true;
}

async function main() {
  console.log('🚀 Starting facilitator database setup...');
  console.log('📡 Connecting to:', supabaseUrl);
  
  try {
    // Check if tables exist
    const availabilityExists = await checkTableExists('facilitator_availability');
    const specialtiesExists = await checkTableExists('facilitator_specialties');
    
    console.log('📋 Table status:');
    console.log('  facilitator_availability:', availabilityExists ? '✅ exists' : '❌ missing');
    console.log('  facilitator_specialties:', specialtiesExists ? '✅ exists' : '❌ missing');
    
    if (!availabilityExists || !specialtiesExists) {
      console.log('🔧 Creating missing tables...');
      await createFacilitatorTables();
    } else {
      console.log('✅ All tables already exist');
    }
    
    // Test table access
    const testResult = await testTables();
    
    if (testResult) {
      console.log('🎉 Database setup completed successfully!');
      console.log('📱 You can now use the facilitator features in the app');
    } else {
      console.log('❌ Database setup failed - check the errors above');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

main();