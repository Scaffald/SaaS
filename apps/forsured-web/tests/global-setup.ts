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
 */

import { FullConfig } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
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
 * Global setup - runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🔍 Checking required services...\n');

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

  console.log('\n✅ All services are ready. Starting tests...\n');
}

export default globalSetup;
