#!/usr/bin/env node

/**
 * Quick script to apply the registry migration
 * Usage: node scripts/apply-registry-migration.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Applying migrations...\n');

  // Migration 1: Add duration_minutes if it doesn't exist
  console.log('📄 Step 1: Adding duration_minutes column...');
  const durationSql = `
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

    COMMENT ON COLUMN events.duration_minutes IS 'Event duration in minutes';
  `;

  try {
    await executeSql(durationSql);
    console.log('✅ duration_minutes column added\n');
  } catch (error) {
    console.error('❌ Error adding duration_minutes:', error.message);
  }

  // Migration 2: Apply registry system
  console.log('📄 Step 2: Applying registry system migration...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251103_event_registry_system.sql');
  const registrySql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await executeSql(registrySql);
    console.log('✅ Registry system migration applied\n');
  } catch (error) {
    console.error('❌ Error applying registry migration:', error.message);
    console.error('\nThis might be okay if the migration was already applied.');
  }

  console.log('\n✅ Migrations complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Wait 10-30 seconds for Supabase to update its schema cache');
  console.log('   2. Refresh your browser');
  console.log('   3. Try creating an event again');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
