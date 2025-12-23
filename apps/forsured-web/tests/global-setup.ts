/**
 * Playwright Global Setup
 * 
 * Automatically waits for required services (Supabase, Mailpit) to be ready
 * before running any tests. This ensures tests don't fail due to services
 * still starting up.
 * 
 * Services checked:
 * - Supabase API (http://localhost:54321)
 * - Supabase Auth (via API health check)
 * - Mailpit (http://127.0.0.1:54324)
 * - Database schema (required tables exist)
 */

import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.test file for test environment variables
const envPath = path.resolve(__dirname, '../../.env.test');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fs3W0YpN81IU';
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://127.0.0.1:54324';

interface ServiceCheck {
  name: string;
  url: string;
  check: () => Promise<boolean>;
}

/**
 * Check if Supabase API is ready
 */
async function checkSupabaseAPI(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if Supabase Auth is ready
 */
async function checkSupabaseAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
    });
    return response.ok || response.status === 404; // 404 is OK, means auth is running
  } catch {
    return false;
  }
}

/**
 * Check if Mailpit is ready
 */
async function checkMailpit(): Promise<boolean> {
  try {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for a service to be ready with exponential backoff
 */
async function waitForService(
  name: string,
  check: () => Promise<boolean>,
  maxRetries = 30,
  initialDelay = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    if (await check()) {
      console.log(`✓ ${name} is ready`);
      return;
    }

    const delay = initialDelay * Math.pow(1.5, i);
    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting for ${name}... (attempt ${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `❌ ${name} is not ready after ${maxRetries} attempts. ` +
    `Please ensure services are running:\n` +
    `  - Supabase: pnpm supa start\n` +
    `  - Check status: pnpm supa status`
  );
}

/**
 * Verify required database tables exist
 * 
 * This ensures migrations have been applied before tests run.
 * Tests should fail if the database schema is incomplete.
 */
async function verifyDatabaseSchema(): Promise<void> {
  console.log('🔍 Verifying database schema...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Required tables that must exist for tests to pass
  const requiredTables = [
    { schema: 'forsured', table: 'approvals' },
    { schema: 'forsured', table: 'relationships' },
  ];
  
  const missingTables: string[] = [];
  
  for (const { schema, table } of requiredTables) {
    try {
      // Try to query the table (limit 0 to avoid fetching data)
      const { error } = await supabase
        .schema(schema)
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        // Check if error is "table does not exist"
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          missingTables.push(`${schema}.${table}`);
        } else {
          // Other errors might be permissions, but table exists
          console.log(`⚠️  Warning: Could not verify ${schema}.${table}: ${error.message}`);
        }
      } else {
        console.log(`✓ ${schema}.${table} exists`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
        missingTables.push(`${schema}.${table}`);
      } else {
        console.log(`⚠️  Warning: Could not verify ${schema}.${table}: ${errorMessage}`);
      }
    }
  }
  
  if (missingTables.length > 0) {
    throw new Error(
      `❌ Required database tables are missing:\n` +
      `  ${missingTables.map(t => `- ${t}`).join('\n  ')}\n\n` +
      `Please run migrations to create these tables:\n` +
      `  pnpm supa db push\n\n` +
      `These tables are created by migration:\n` +
      `  packages/supabase/migrations/208_forsured_create_remaining_tables.sql`
    );
  }
  
  console.log('✓ All required tables exist\n');
}

/**
 * Global setup - runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🔍 Checking required services...\n');

  // If GoTrue environment variables are set in .env.test, ensure they're applied
  // Note: This requires Supabase to be restarted with these vars, or the fix script to be run
  const appUrl = process.env.APP_URL || process.env.GOTRUE_SITE_URL;
  if (appUrl) {
    console.log(`📋 GoTrue configuration from .env.test:`);
    console.log(`   GOTRUE_SITE_URL: ${process.env.GOTRUE_SITE_URL || appUrl}`);
    console.log(`   APP_URL: ${appUrl}`);
    console.log(`   (If magic links use wrong URL, run: bash scripts/fix-gotrue-env.sh)\n`);
  }

  const services: ServiceCheck[] = [
    {
      name: 'Supabase API',
      url: SUPABASE_URL,
      check: checkSupabaseAPI,
    },
    {
      name: 'Supabase Auth',
      url: SUPABASE_URL,
      check: checkSupabaseAuth,
    },
    {
      name: 'Mailpit',
      url: MAILPIT_URL,
      check: checkMailpit,
    },
  ];

  // Wait for all services in parallel (faster)
  await Promise.all(
    services.map((service) => waitForService(service.name, service.check))
  );

  // Verify database schema after services are ready
  await verifyDatabaseSchema();

  console.log('\n✅ All services are ready. Starting tests...\n');
}

export default globalSetup;

