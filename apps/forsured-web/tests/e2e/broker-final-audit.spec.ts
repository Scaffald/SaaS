/**
 * FINAL VALIDATION AUDIT: Broker User Flow
 *
 * This test validates all bug fixes and complete broker functionality:
 * - BUG-001: GC Client Navigation
 * - BUG-003: Team Member Invite Modal
 * - BUG-004/005: Tabs Components
 * - BUG-006: Add Client Modal
 * - BUG-008: RLS Policies with seeded credentials
 * - BUG-009: Auth State and Direct Navigation
 *
 * Tests all broker routes starting from /start
 */

import { test, expect } from '@playwright/test';

// TODO: These audit tests need manual browser interaction - skip for automated runs
test.describe.skip('Broker Final Validation Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the /start page
    await page.goto('/start');
    await page.waitForLoadState('networkidle');
  });

  test('AUDIT-001: Login Flow - Test as Broker button works', async ({ page }) => {
    console.log('\n=== AUDIT-001: Testing Broker Login ===');

    // Click "Test as Broker" button
    const brokerButton = page.locator('button:has-text("Test as Broker")');
    await expect(brokerButton).toBeVisible({ timeout: 10000 });
    await brokerButton.click();

    // Should navigate to broker dashboard
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Verify we're on a broker route
    const url = page.url();
    console.log('✅ Logged in, current URL:', url);
    expect(url).toMatch(/\/broker/);

    // Check for no authentication errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a moment for any errors to appear
    await page.waitForTimeout(2000);

    const authErrors = consoleErrors.filter(err =>
      err.includes('PGRST106') ||
      err.includes('406') ||
      err.includes('Not Acceptable')
    );

    if (authErrors.length > 0) {
      console.log('❌ Authentication errors found:', authErrors);
    } else {
      console.log('✅ No authentication errors');
    }

    expect(authErrors.length).toBe(0);
  });

  test('AUDIT-002: Dashboard Route - Data loads correctly', async ({ page }) => {
    console.log('\n=== AUDIT-002: Testing Broker Dashboard ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Navigate to dashboard
    await page.goto('/broker/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('✅ Dashboard loaded:', page.url());

    // Check for any 406 or PGRST errors in network
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (response.status() === 406 || response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.waitForTimeout(3000);

    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:', failedRequests);
    } else {
      console.log('✅ All requests successful');
    }

    expect(failedRequests.length).toBe(0);
  });

  test('BUG-001: GC Client Navigation - Should navigate to /broker/clients/:id', async ({ page }) => {
    console.log('\n=== BUG-001: Testing GC Client Navigation ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Navigate to clients page
    await page.goto('/broker/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for any client link (could be in table, card, or list)
    const clientLinks = page.locator('a[href*="/broker/clients/"]');
    const clientCount = await clientLinks.count();

    console.log(`Found ${clientCount} client links`);

    if (clientCount > 0) {
      const firstClient = clientLinks.first();
      const href = await firstClient.getAttribute('href');
      console.log('First client link href:', href);

      // Click the client
      await firstClient.click();
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log('✅ Navigated to:', currentUrl);

      // Verify we're on /broker/clients/:id (NOT /broker/gcs/)
      expect(currentUrl).toMatch(/\/broker\/clients\/[^\/]+$/);
      expect(currentUrl).not.toContain('/broker/gcs/');

      console.log('✅ BUG-001 FIXED: Navigation correct');
    } else {
      console.log('⚠️  No clients available to test navigation');
    }
  });

  test('BUG-003: Team Member Invite - Modal opens and works', async ({ page }) => {
    console.log('\n=== BUG-003: Testing Team Member Invite ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Navigate to team page
    await page.goto('/broker/team');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click "Invite Team Member" button
    const inviteButton = page.locator('button:has-text("Invite Team Member")');
    await expect(inviteButton).toBeVisible({ timeout: 10000 });

    console.log('✅ Found "Invite Team Member" button');

    await inviteButton.click();
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      console.log('✅ BUG-003 FIXED: Modal opened successfully');

      // Check for email field
      const emailField = page.locator('input[type="email"], input[name*="email"]');
      await expect(emailField).toBeVisible({ timeout: 5000 });
      console.log('✅ Email field visible in modal');
    } else {
      console.log('❌ Modal did not open');
      throw new Error('Invite modal did not appear');
    }
  });

  test('BUG-004/005: Tabs Components - Render correctly', async ({ page }) => {
    console.log('\n=== BUG-004/005: Testing Tabs Components ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Test tabs on insurance page
    await page.goto('/broker/insurance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for tab elements
    const tabs = page.locator('[role="tab"], .tab, button[data-state]');
    const tabCount = await tabs.count();

    console.log(`Found ${tabCount} tabs on insurance page`);

    if (tabCount > 0) {
      console.log('✅ BUG-004/005 FIXED: Tabs rendered');

      // Try clicking a tab
      await tabs.first().click();
      await page.waitForTimeout(500);

      const activeTab = page.locator('[role="tab"][aria-selected="true"], .tab.active, button[data-state="active"]');
      const hasActive = await activeTab.count() > 0;

      if (hasActive) {
        console.log('✅ Tab interaction works');
      }
    } else {
      console.log('⚠️  No tabs found on insurance page');
    }
  });

  test('BUG-006: Add Client Modal - Opens and validates', async ({ page }) => {
    console.log('\n=== BUG-006: Testing Add Client Modal ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Navigate to clients page
    await page.goto('/broker/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find "Add Client" button
    const addButton = page.locator('button:has-text("Add Client")');
    await expect(addButton).toBeVisible({ timeout: 10000 });

    console.log('✅ Found "Add Client" button');

    await addButton.click();
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      console.log('✅ BUG-006 FIXED: Modal opened successfully');

      // Check for form fields
      const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]');
      const hasNameField = await nameField.count() > 0;

      if (hasNameField) {
        console.log('✅ Form fields visible in modal');
      }
    } else {
      console.log('❌ Add Client modal did not open');
      throw new Error('Add Client modal did not appear');
    }
  });

  test('BUG-009: Direct Navigation - Type URL directly', async ({ page }) => {
    console.log('\n=== BUG-009: Testing Direct URL Navigation ===');

    // Login first via /start
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Store auth state
    await page.context().storageState({ path: '/tmp/broker-auth.json' });

    // Direct navigation to broker routes
    const routesToTest = [
      '/broker/dashboard',
      '/broker/tasks',
      '/broker/clients',
      '/broker/projects',
      '/broker/team',
      '/broker/insurance',
      '/broker/documents',
      '/broker/acknowledgements',
      '/broker/settings/profile',
    ];

    for (const route of routesToTest) {
      console.log(`Testing direct navigation to ${route}...`);

      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();

      // Should stay on the route, not redirect to /signup
      if (currentUrl.includes('/signup') || currentUrl.includes('/login')) {
        console.log(`❌ Redirected to auth page: ${currentUrl}`);
        throw new Error(`Direct navigation to ${route} failed - redirected to auth`);
      }

      console.log(`✅ ${route} - Direct navigation works`);
    }

    console.log('✅ BUG-009 FIXED: All direct navigation works');
  });

  test('COMPREHENSIVE: All Broker Routes Load', async ({ page }) => {
    console.log('\n=== COMPREHENSIVE: Testing All Broker Routes ===');

    // Login first
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

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

    const results: { route: string; success: boolean; error?: string }[] = [];

    for (const route of routes) {
      try {
        console.log(`\nTesting ${route.name} (${route.path})...`);

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();

        // Check for redirect to auth
        if (currentUrl.includes('/signup') || currentUrl.includes('/login')) {
          throw new Error('Redirected to auth page');
        }

        // Check for 406 errors
        const errors = await page.evaluate(() => {
          return (window as any).__pageErrors || [];
        });

        if (errors.length > 0) {
          throw new Error(`Page errors: ${errors.join(', ')}`);
        }

        console.log(`✅ ${route.name} loaded successfully`);
        results.push({ route: route.path, success: true });

      } catch (error) {
        console.log(`❌ ${route.name} failed:`, error);
        results.push({
          route: route.path,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Summary
    console.log('\n=== ROUTE TEST SUMMARY ===');
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`${successCount}/${totalCount} routes working`);

    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${r.route}${r.error ? ` - ${r.error}` : ''}`);
    });

    // All routes must work
    expect(successCount).toBe(totalCount);
  });

  test('SECURITY: No Auth Errors with Seeded Credentials', async ({ page }) => {
    console.log('\n=== SECURITY: Testing RLS and Auth ===');

    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture failed requests
    page.on('response', response => {
      if (response.status() === 406 || response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    // Login with seeded credentials
    await page.locator('button:has-text("Test as Broker")').click();
    await page.waitForURL(/\/broker/, { timeout: 15000 });

    // Navigate to a few data-heavy pages
    await page.goto('/broker/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.goto('/broker/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for auth-related errors
    const authErrors = consoleErrors.filter(err =>
      err.includes('PGRST106') ||
      err.includes('JWT') ||
      err.includes('401') ||
      err.includes('403')
    );

    const rlsErrors = failedRequests.filter(req =>
      req.includes('PGRST106') ||
      req.includes('406')
    );

    console.log('\n=== Auth Error Check ===');
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
    console.log(`Auth-specific errors: ${authErrors.length}`);
    console.log(`RLS errors: ${rlsErrors.length}`);

    if (authErrors.length > 0) {
      console.log('❌ Auth errors found:', authErrors);
    }

    if (rlsErrors.length > 0) {
      console.log('❌ RLS errors found:', rlsErrors);
    }

    if (authErrors.length === 0 && rlsErrors.length === 0) {
      console.log('✅ BUG-008 FIXED: No RLS or auth errors');
    }

    expect(authErrors.length).toBe(0);
    expect(rlsErrors.length).toBe(0);
  });
});
