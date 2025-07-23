#!/usr/bin/env node

// Database Manager - Direct database operations from Claude
// Run with: node scripts/db-manager.mjs [command] [args...]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
let supabaseUrl, supabaseAnonKey, supabaseServiceKey, databaseUrl;

try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]?.trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1]?.trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1]?.trim();
    }
    if (line.startsWith('DATABASE_URL=')) {
      databaseUrl = line.split('=')[1]?.trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

// Initialize Supabase client with best available key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const isAdmin = !!supabaseServiceKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Database connection:', isAdmin ? 'Admin (Service Role)' : 'Public (Anon Key)');
console.log('📡 Connected to:', supabaseUrl);

// Database operations
const dbOps = {
  // Create tables
  async createTables() {
    console.log('🔧 Creating facilitator tables...');
    
    const queries = [
      // Create facilitator_availability table
      `CREATE TABLE IF NOT EXISTS public.facilitator_availability (
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
      )`,
      
      // Create facilitator_specialties table
      `CREATE TABLE IF NOT EXISTS public.facilitator_specialties (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        facilitator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        specialty TEXT NOT NULL,
        category TEXT NOT NULL,
        experience_years INTEGER DEFAULT 0,
        UNIQUE(facilitator_id, specialty)
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_facilitator_availability_facilitator_id ON public.facilitator_availability(facilitator_id)`,
      `CREATE INDEX IF NOT EXISTS idx_facilitator_availability_is_active ON public.facilitator_availability(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_facilitator_id ON public.facilitator_specialties(facilitator_id)`,
      `CREATE INDEX IF NOT EXISTS idx_facilitator_specialties_category ON public.facilitator_specialties(category)`,
      
      // Enable RLS
      `ALTER TABLE public.facilitator_availability ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.facilitator_specialties ENABLE ROW LEVEL SECURITY`,
    ];
    
    if (isAdmin) {
      try {
        for (const query of queries) {
          const { error } = await supabase.rpc('exec_sql', { query });
          if (error) throw error;
        }
        
        // Create RLS policies
        await this.createPolicies();
        
        console.log('✅ Tables created successfully!');
        return true;
      } catch (error) {
        console.error('❌ Error creating tables with RPC:', error.message);
        console.log('💡 Try using the manual SQL approach instead.');
        return false;
      }
    } else {
      console.log('⚠️  Need Service Role Key for table creation');
      console.log('💡 Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
      return false;
    }
  },
  
  // Create RLS policies
  async createPolicies() {
    const policies = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "Users can manage their own facilitator availability" ON public.facilitator_availability`,
      `DROP POLICY IF EXISTS "Public can view active facilitator availability" ON public.facilitator_availability`,
      `DROP POLICY IF EXISTS "Users can manage their own facilitator specialties" ON public.facilitator_specialties`,
      `DROP POLICY IF EXISTS "Public can view facilitator specialties" ON public.facilitator_specialties`,
      
      // Create new policies
      `CREATE POLICY "Users can manage their own facilitator availability" ON public.facilitator_availability
        FOR ALL USING (auth.uid() = facilitator_id)`,
      `CREATE POLICY "Public can view active facilitator availability" ON public.facilitator_availability
        FOR SELECT USING (is_active = true)`,
      `CREATE POLICY "Users can manage their own facilitator specialties" ON public.facilitator_specialties
        FOR ALL USING (auth.uid() = facilitator_id)`,
      `CREATE POLICY "Public can view facilitator specialties" ON public.facilitator_specialties
        FOR SELECT USING (true)`,
    ];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { query: policy });
      if (error) console.warn('Policy warning:', error.message);
    }
  },
  
  // Check table status
  async checkTables() {
    console.log('🔍 Checking table status...');
    
    const tables = ['facilitator_availability', 'facilitator_specialties'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible (${data?.length || 0} records)`);
      }
    }
  },
  
  // Direct SQL execution (requires service role)
  async sql(query) {
    if (!isAdmin) {
      console.log('⚠️  SQL execution requires Service Role Key');
      return false;
    }
    
    console.log('🔧 Executing SQL...');
    console.log('📝 Query:', query);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.error('❌ SQL Error:', error.message);
        return false;
      }
      
      console.log('✅ SQL executed successfully');
      if (data) console.log('📊 Result:', data);
      return true;
    } catch (error) {
      console.error('❌ Execution failed:', error.message);
      return false;
    }
  },
  
  // List tables
  async listTables() {
    console.log('📋 Listing database tables...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      });
      
      if (error) throw error;
      
      console.log('📦 Public tables:');
      data.forEach(row => console.log(`  - ${row.table_name}`));
    } catch (error) {
      console.error('❌ Could not list tables:', error.message);
    }
  },
  
  // Show connection info
  async info() {
    console.log('ℹ️  Database Connection Info:');
    console.log('  URL:', supabaseUrl);
    console.log('  Auth Level:', isAdmin ? 'Admin (Service Role)' : 'Public (Anon)');
    console.log('  Can Create Tables:', isAdmin ? 'Yes' : 'No');
    console.log('  Can Execute SQL:', isAdmin ? 'Yes' : 'No');
    
    if (!isAdmin) {
      console.log('\n💡 To enable admin features:');
      console.log('1. Go to Supabase Dashboard > Settings > API');
      console.log('2. Copy your "service_role" key');
      console.log('3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    }
  }
};

// Command line interface
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'create':
  case 'create-tables':
    await dbOps.createTables();
    break;
    
  case 'check':
  case 'status':
    await dbOps.checkTables();
    break;
    
  case 'sql':
    if (!args[0]) {
      console.log('Usage: node scripts/db-manager.mjs sql "your query here"');
      process.exit(1);
    }
    await dbOps.sql(args[0]);
    break;
    
  case 'tables':
  case 'list':
    await dbOps.listTables();
    break;
    
  case 'info':
    await dbOps.info();
    break;
    
  default:
    console.log('🛠️  Database Manager Commands:');
    console.log('  create       - Create facilitator tables');
    console.log('  check        - Check table status');
    console.log('  sql "query"  - Execute SQL (requires service key)');
    console.log('  tables       - List all tables');
    console.log('  info         - Show connection info');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/db-manager.mjs check');
    console.log('  node scripts/db-manager.mjs create');
    console.log('  node scripts/db-manager.mjs sql "SELECT version()"');
    break;
}

export { dbOps };