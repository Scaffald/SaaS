/**
 * Playwright Global Setup
 *
 * Runs once before all E2E tests
 * Verifies Supabase is running and database is ready
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Setting up E2E test environment...\n');

  // Verify Supabase is running
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase health check failed: ${response.status}`);
    }

    console.log('✅ Supabase is running\n');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase');
    console.error('   Make sure Supabase is running: pnpm supa:start');
    console.error(`   Error: ${error instanceof Error ? error.message : 'unknown'}\n`);
    throw error;
  }

  // Optional: Create a test user for authenticated E2E tests
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // await page.goto(config.use?.baseURL || 'http://localhost:8081');
  // ... perform login and save auth state
  // await browser.close();

  console.log('✅ E2E environment ready\n');
}

export default globalSetup;
