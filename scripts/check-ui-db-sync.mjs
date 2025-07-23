#!/usr/bin/env node

// Check UI data elements against database schema
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

// UI Data Elements found in the code
const UI_DATA_ELEMENTS = {
  profiles: {
    // Basic info
    full_name: 'text',
    username: 'text',
    bio: 'text',
    neighborhood: 'text',
    avatar_url: 'text',
    discovery_radius: 'number',
    holistic_interests: 'array',
    
    // Personal info (Settings page)
    date_of_birth: 'date',
    gender: 'text',
    phone_number: 'text',
    address: 'text',
    city: 'text',
    zip_code: 'text',
    
    // Email preferences (Settings page)
    email_preferences: 'jsonb',
    weekly_digest: 'boolean',
    event_reminders: 'boolean',
    new_member_spotlights: 'boolean',
    space_availability: 'boolean',
    tips_resources: 'boolean',
    email_frequency: 'text',
    
    // Social media (Settings page)
    social_media: 'jsonb',
    instagram: 'text',
    facebook: 'text',
    linkedin: 'text',
    twitter: 'text',
    sharing_preferences: 'jsonb',
    auto_share_events: 'boolean',
    share_achievements: 'boolean',
    allow_friend_discovery: 'boolean',
    
    // Interests (Settings page)
    additional_interests: 'array',
    involvement_level: 'text',
    other_interests: 'text',
    
    // Mobile notifications (Settings page)
    mobile_notifications: 'jsonb',
    push_notifications: 'jsonb',
    quiet_hours: 'jsonb',
    notification_sound: 'text',
    
    // Profile page stats (currently hardcoded)
    events_attended_count: 'number',
    hours_contributed: 'number',
    neighbors_met_count: 'number',
    community_rating: 'number',
    
    // Activity tracking
    recent_activities: 'jsonb',
    achievements: 'jsonb',
    
    // Privacy settings
    profile_visibility: 'text',
    share_activity_data: 'boolean',
    analytics_enabled: 'boolean'
  }
};

// Check database schema
async function checkDatabaseSchema() {
  console.log('📊 Checking database schema vs UI data elements...\n');
  
  // Get current columns in profiles table
  const { data: columns, error } = await supabase.rpc('query_sql', {
    query: `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `
  });
  
  if (error) {
    console.error('❌ Error querying database:', error);
    return;
  }
  
  const existingColumns = new Map();
  if (columns?.data) {
    columns.data.forEach(col => {
      existingColumns.set(col.column_name, col.data_type);
    });
  }
  
  console.log('📋 Current profile columns:', existingColumns.size);
  console.log('🎨 UI data elements:', Object.keys(UI_DATA_ELEMENTS.profiles).length);
  console.log('\n🔍 Analysis:\n');
  
  const missing = [];
  const existing = [];
  const typesMismatch = [];
  
  // Check each UI element
  for (const [field, expectedType] of Object.entries(UI_DATA_ELEMENTS.profiles)) {
    if (existingColumns.has(field)) {
      existing.push(field);
      // Check type compatibility
      const dbType = existingColumns.get(field);
      if (!isTypeCompatible(expectedType, dbType)) {
        typesMismatch.push({ field, expected: expectedType, actual: dbType });
      }
    } else {
      missing.push({ field, type: expectedType });
    }
  }
  
  // Display results
  console.log(`✅ Existing fields (${existing.length}):`);
  existing.forEach(f => console.log(`   - ${f}`));
  
  console.log(`\n❌ Missing fields (${missing.length}):`);
  missing.forEach(({ field, type }) => console.log(`   - ${field} (${type})`));
  
  if (typesMismatch.length > 0) {
    console.log(`\n⚠️  Type mismatches (${typesMismatch.length}):`);
    typesMismatch.forEach(({ field, expected, actual }) => 
      console.log(`   - ${field}: expected ${expected}, got ${actual}`)
    );
  }
  
  // Generate SQL for missing fields
  if (missing.length > 0) {
    console.log('\n📝 SQL to add missing fields:\n');
    console.log('-- Add missing columns to profiles table');
    missing.forEach(({ field, type }) => {
      const sqlType = getSQLType(type);
      console.log(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${field} ${sqlType};`);
    });
  }
}

// Helper to check type compatibility
function isTypeCompatible(expected, actual) {
  const typeMap = {
    'text': ['text', 'character varying'],
    'number': ['integer', 'numeric', 'double precision'],
    'boolean': ['boolean'],
    'date': ['date', 'timestamp with time zone'],
    'array': ['ARRAY', 'jsonb'],
    'jsonb': ['jsonb']
  };
  
  const compatibleTypes = typeMap[expected] || [];
  return compatibleTypes.some(t => actual.toLowerCase().includes(t.toLowerCase()));
}

// Helper to get SQL type
function getSQLType(jsType) {
  const typeMap = {
    'text': 'TEXT',
    'number': 'INTEGER',
    'boolean': 'BOOLEAN DEFAULT false',
    'date': 'DATE',
    'array': 'TEXT[]',
    'jsonb': 'JSONB DEFAULT \'{}\'::jsonb'
  };
  
  return typeMap[jsType] || 'TEXT';
}

// Run the check
checkDatabaseSchema().catch(console.error);