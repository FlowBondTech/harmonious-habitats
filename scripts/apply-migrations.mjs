#!/usr/bin/env node

/**
 * Apply pending migrations to Supabase
 * Usage: node scripts/apply-migrations.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// Function to execute SQL using Supabase REST API
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

// Apply a migration file
async function applyMigration(filename) {
  console.log(`\n📄 Applying: ${filename}`);

  const filepath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  try {
    await executeSql(sql);
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply: ${filename}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Applying pending migrations to Supabase...\n');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Error: Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  // Get all SQL files in migrations directory
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  No migration files found');
    process.exit(0);
  }

  console.log(`Found ${files.length} migration file(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  // Apply migrations that need to be applied
  const migrationsToApply = [
    '20251011000001_add_duration_to_events.sql',
    '20251103_event_registry_system.sql'
  ];

  console.log('\n🎯 Applying specific migrations:');
  migrationsToApply.forEach(f => console.log(`  - ${f}`));

  let allSucceeded = true;
  for (const filename of migrationsToApply) {
    if (files.includes(filename)) {
      const success = await applyMigration(filename);
      if (!success) {
        allSucceeded = false;
        break;
      }
    } else {
      console.log(`⚠️  Migration not found: ${filename}`);
    }
  }

  if (allSucceeded) {
    console.log('\n✅ All migrations applied successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your Supabase schema cache (it may take a moment)');
    console.log('   2. Try creating an event again');
  } else {
    console.log('\n❌ Some migrations failed to apply');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
