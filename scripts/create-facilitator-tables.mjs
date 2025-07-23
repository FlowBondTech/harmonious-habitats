#!/usr/bin/env node

// Create Facilitator Database Tables using SQL commands
// Run with: node scripts/create-facilitator-tables.mjs

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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// SQL to create the tables
const createTablesSQL = `
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

-- Create RLS policies for facilitator_availability
DROP POLICY IF EXISTS "Users can manage their own facilitator availability" ON public.facilitator_availability;
CREATE POLICY "Users can manage their own facilitator availability" ON public.facilitator_availability
    FOR ALL USING (auth.uid() = facilitator_id);

DROP POLICY IF EXISTS "Public can view active facilitator availability" ON public.facilitator_availability;
CREATE POLICY "Public can view active facilitator availability" ON public.facilitator_availability
    FOR SELECT USING (is_active = true);

-- Create RLS policies for facilitator_specialties
DROP POLICY IF EXISTS "Users can manage their own facilitator specialties" ON public.facilitator_specialties;
CREATE POLICY "Users can manage their own facilitator specialties" ON public.facilitator_specialties
    FOR ALL USING (auth.uid() = facilitator_id);

DROP POLICY IF EXISTS "Public can view facilitator specialties" ON public.facilitator_specialties;
CREATE POLICY "Public can view facilitator specialties" ON public.facilitator_specialties
    FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.facilitator_availability TO authenticated;
GRANT ALL ON public.facilitator_specialties TO authenticated;
GRANT SELECT ON public.facilitator_availability TO anon;
GRANT SELECT ON public.facilitator_specialties TO anon;
`;

async function createTables() {
  console.log('🔧 Creating facilitator tables via REST API...');
  console.log('📡 Connected to:', supabaseUrl);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        query: createTablesSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create tables:', response.status, errorText);
      
      console.log('\n💡 Alternative approach:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL from fix_facilitator_tables.sql');
      console.log('4. Run the script manually');
      
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Tables created successfully:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    
    console.log('\n💡 Manual approach required:');
    console.log('1. Go to your Supabase dashboard SQL Editor');
    console.log('2. Copy the contents of fix_facilitator_tables.sql');
    console.log('3. Paste and run the SQL script');
    
    return false;
  }
}

async function main() {
  const success = await createTables();
  
  if (success) {
    console.log('\n🎉 Database setup completed!');
    console.log('📱 Run the check script to verify: node scripts/check-db.mjs');
  } else {
    console.log('\n⚠️  Automatic creation failed. Manual setup required.');
  }
}

main();