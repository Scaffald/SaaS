/**
 * MANUAL BROKER AUDIT - No Global Setup Required
 *
 * Run this test with the dev server already running.
 * This bypasses the global setup service checks.
 */

import { test, expect } from '@playwright/test';

// Skip global setup for this test
test.use({
  baseURL: 'http://localhost:5173',
});

// TODO: These manual audit tests use standard @playwright/test without auth fixtures - skip for automated runs
test.describe.skip('Broker Manual Audit - Bug Validation', () => {

  test('START: Navigate to /start page', async ({ page }) => {
    console.log('\n=== Starting Broker Audit ===\n');

    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });

    const url = page.url();
    console.log('Current URL:', url);

    expect(url).toContain('/start');

    // Take screenshot for evidence
    await page.screenshot({ path: 'audit-screenshots/01-start-page.png', fullPage: true });
    console.log('✅ Screenshot saved: 01-start-page.png');
  });

  test('LOGIN: Click Test as Broker button', async ({ page }) => {
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });

    console.log('\n=== Testing Broker Login ===\n');

    // Find the "Test as Broker" button
    const brokerButton = await page.locator('button:has-text("Test as Broker")').first();

    const isVisible = await brokerButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      // Try alternative selectors
      const buttons = await page.locator('button').all();
      console.log(`Found ${buttons.length} buttons on page`);

      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log('Button text:', text);
      }

      throw new Error('Test as Broker button not found');
    }

    console.log('✅ Found "Test as Broker" button');

    await page.screenshot({ path: 'audit-screenshots/02-before-login.png', fullPage: true });

    await brokerButton.click();

    // Wait for navigation
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const afterUrl = page.url();
    console.log('After login URL:', afterUrl);

    await page.screenshot({ path: 'audit-screenshots/03-after-login.png', fullPage: true });

    // Should be on a broker route
    if (afterUrl.includes('/broker')) {
      console.log('✅ Successfully navigated to broker route');
    } else if (afterUrl.includes('/signup') || afterUrl.includes('/login')) {
      console.log('❌ Redirected to auth page - login failed');
      throw new Error('Login did not work - redirected to auth');
    } else {
      console.log('⚠️ Unexpected URL:', afterUrl);
    }

    expect(afterUrl).toMatch(/\/broker/);
  });

  test('BUG-001: GC Client Navigation to /broker/clients/:id', async ({ page }) => {
    console.log('\n=== BUG-001: GC Client Navigation ===\n');

    // Login first
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Test as Broker")').first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Go to clients page
    await page.goto('http://localhost:5173/broker/clients', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'audit-screenshots/04-clients-page.png', fullPage: true });

    // Look for client links
    const clientLinks = page.locator('a[href*="/broker/clients/"]');
    const count = await clientLinks.count();

    console.log(`Found ${count} client links`);

    if (count > 0) {
      const firstHref = await clientLinks.first().getAttribute('href');
      console.log('First client href:', firstHref);

      // Verify it's NOT using /broker/gcs/
      if (firstHref?.includes('/broker/gcs/')) {
        console.log('❌ BUG-001 STILL EXISTS: Using /broker/gcs/ route');
        throw new Error('Client links still use /broker/gcs/ instead of /broker/clients/');
      }

      console.log('✅ BUG-001 FIXED: Client links use /broker/clients/:id');

      // Click and verify navigation
      await clientLinks.first().click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const clientDetailUrl = page.url();
      console.log('Navigated to:', clientDetailUrl);

      await page.screenshot({ path: 'audit-screenshots/05-client-detail.png', fullPage: true });

      expect(clientDetailUrl).toMatch(/\/broker\/clients\/[^\/]+$/);
      expect(clientDetailUrl).not.toContain('/broker/gcs/');

    } else {
      console.log('⚠️ No clients found - cannot test navigation');
    }
  });

  test('BUG-003: Team Member Invite Modal', async ({ page }) => {
    console.log('\n=== BUG-003: Team Member Invite ===\n');

    // Login
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Test as Broker")').first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Navigate to team page
    await page.goto('http://localhost:5173/broker/team', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'audit-screenshots/06-team-page.png', fullPage: true });

    // Find invite button
    const inviteBtn = page.locator('button:has-text("Invite Team Member")').first();
    const exists = await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!exists) {
      console.log('❌ "Invite Team Member" button not found');
      throw new Error('Invite button not found on team page');
    }

    console.log('✅ Found "Invite Team Member" button');

    await inviteBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'audit-screenshots/07-invite-modal.png', fullPage: true });

    // Check for modal
    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);

    if (modalVisible) {
      console.log('✅ BUG-003 FIXED: Invite modal opened');
    } else {
      console.log('❌ BUG-003 STILL EXISTS: Modal did not open');
      throw new Error('Invite modal did not appear');
    }
  });

  test('BUG-006: Add Client Modal', async ({ page }) => {
    console.log('\n=== BUG-006: Add Client Modal ===\n');

    // Login
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Test as Broker")').first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Navigate to clients
    await page.goto('http://localhost:5173/broker/clients', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'audit-screenshots/08-clients-before-add.png', fullPage: true });

    // Find add button
    const addBtn = page.locator('button:has-text("Add Client")').first();
    const exists = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!exists) {
      console.log('❌ "Add Client" button not found');
      throw new Error('Add Client button not found');
    }

    console.log('✅ Found "Add Client" button');

    await addBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'audit-screenshots/09-add-client-modal.png', fullPage: true });

    // Check for modal
    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);

    if (modalVisible) {
      console.log('✅ BUG-006 FIXED: Add Client modal opened');
    } else {
      console.log('❌ BUG-006 STILL EXISTS: Modal did not open');
      throw new Error('Add Client modal did not appear');
    }
  });

  test('BUG-009: Direct URL Navigation', async ({ page }) => {
    console.log('\n=== BUG-009: Direct URL Navigation ===\n');

    // Login first to establish session
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Test as Broker")').first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Now try direct navigation to various routes
    const routes = [
      '/broker/dashboard',
      '/broker/tasks',
      '/broker/projects',
      '/broker/insurance',
      '/broker/documents',
    ];

    for (const route of routes) {
      console.log(`Testing direct navigation to ${route}...`);

      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const currentUrl = page.url();

      if (currentUrl.includes('/signup') || currentUrl.includes('/login')) {
        console.log(`❌ ${route} - Redirected to auth`);
        throw new Error(`Direct navigation to ${route} failed`);
      }

      console.log(`✅ ${route} - Accessible`);
    }

    console.log('\n✅ BUG-009 FIXED: All direct navigation works');
  });

  test('ALL ROUTES: Test every broker route', async ({ page }) => {
    console.log('\n=== Testing All Broker Routes ===\n');

    // Login
    await page.goto('http://localhost:5173/start', { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Test as Broker")').first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    const routes = [
      { path: '/broker/dashboard', name: 'Dashboard' },
      { path: '/broker/tasks', name: 'Tasks' },
      { path: '/broker/clients', name: 'Clients' },
      { path: '/broker/projects', name: 'Projects' },
      { path: '/broker/team', name: 'Team' },
      { path: '/broker/insurance', name: 'Insurance' },
      { path: '/broker/documents', name: 'Documents' },
      { path: '/broker/acknowledgements', name: 'Acknowledgements' },
      { path: '/broker/settings/profile', name: 'Settings' },
    ];

    const results: Array<{ route: string; success: boolean }> = [];

    for (const route of routes) {
      try {
        console.log(`\nTesting ${route.name} (${route.path})...`);

        await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const url = page.url();

        // Check for auth redirect
        if (url.includes('/signup') || url.includes('/login')) {
          console.log(`❌ ${route.name} - Redirected to auth`);
          results.push({ route: route.path, success: false });
          continue;
        }

        console.log(`✅ ${route.name} - Loaded successfully`);
        results.push({ route: route.path, success: true });

        // Screenshot
        await page.screenshot({
          path: `audit-screenshots/route-${route.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true
        });

      } catch (error) {
        console.log(`❌ ${route.name} - Error:`, error);
        results.push({ route: route.path, success: false });
      }
    }

    // Summary
    console.log('\n=== ROUTE TEST SUMMARY ===');
    const successCount = results.filter(r => r.success).length;
    console.log(`${successCount}/${results.length} routes working\n`);

    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${r.route}`);
    });

    // All must work
    expect(successCount).toBe(results.length);
  });
});
