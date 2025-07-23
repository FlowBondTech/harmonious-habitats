#!/usr/bin/env node

// Create Tables Directly - Uses Supabase REST API to create tables
// Run with: node scripts/create-tables-direct.mjs

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
  console.error('❌ Missing Supabase service role key');
  process.exit(1);
}

console.log('🔗 Admin connection to:', supabaseUrl);

// SQL to create tables
const sql = `
-- Create facilitator_availability table
CREATE TABLE IF NOT EXISTS public.facilitator_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    weekly_schedule JSONB DEFAULT '{"monday":[],"tuesday":[],"wednesday":[],"thursday":[],"friday":[],"saturday":[],"sunday":[]}'::jsonb,
    minimum_notice_hours INTEGER DEFAULT 24,
    maximum_advance_days INTEGER DEFAULT 90,
    default_event_duration INTEGER DEFAULT 60,
    pricing JSONB DEFAULT '{}'::jsonb,
    location_preferences JSONB DEFAULT '{}'::jsonb,
    UNIQUE(facilitator_id)
);

-- Create facilitator_specialties table
CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    specialty TEXT NOT NULL,
    category TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    UNIQUE(facilitator_id, specialty)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON public.facilitator_availability(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON public.facilitator_availability(is_active);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON public.facilitator_specialties(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON public.facilitator_specialties(category);

-- Enable Row Level Security
ALTER TABLE public.facilitator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_specialties ENABLE ROW LEVEL SECURITY;

-- Create security policies
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.facilitator_availability TO authenticated;
GRANT ALL ON public.facilitator_specialties TO authenticated;
GRANT SELECT ON public.facilitator_availability TO anon;
GRANT SELECT ON public.facilitator_specialties TO anon;

SELECT 'Tables created successfully!' as result;
`;

async function createTables() {
  console.log('🔧 Creating facilitator tables via HTTP API...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.text();
    console.log('✅ Tables created successfully!');
    console.log('📊 Response:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error.message);
    
    console.log('\n💡 Alternative: Run this SQL manually in Supabase Dashboard:');
    console.log('---');
    console.log(sql);
    console.log('---');
    
    return false;
  }
}

const success = await createTables();

if (success) {
  console.log('\n🎉 Database setup completed!');
  console.log('📱 The facilitator features should now work in your app');
  console.log('🧪 Test with: node scripts/db-manager.mjs check');
} else {
  console.log('\n⚠️  Please run the SQL manually in your Supabase dashboard');
}