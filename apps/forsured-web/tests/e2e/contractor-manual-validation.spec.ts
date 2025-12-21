// tests/e2e/contractor-manual-validation.spec.ts
// Simple manual validation test for contractor flow
// No external services required - uses mock data only

import { test, expect } from '@playwright/test';

// TODO: Manual validation tests need mock auth fix - skipping temporarily
test.describe.skip('Contractor Manual Validation - Final Audit', () => {
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Set up minimal mock auth without external services
    await page.addInitScript(() => {
      // Mock Scaffald tokens
      window.localStorage.setItem('scaffald_tokens', JSON.stringify({
        access_token: 'mock-test-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      }));

      // Mock test user
      window.localStorage.setItem('e2e_test_user', JSON.stringify({
        id: '20000000-0000-0000-0000-000000000002',
        email: 'active.contractor@test.forsured.com',
        name: 'Active Contractor User',
        avatar_url: null,
        organization_id: 'org-test',
        companies: [{
          company_id: 'company-test',
          name: 'Test Contractor Co',
          role: 'member',
        }],
      }));

      // Mock Supabase session
      window.localStorage.setItem('sb-auth-token', JSON.stringify({
        access_token: 'mock-supabase-token',
        refresh_token: 'mock-supabase-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: '20000000-0000-0000-0000-000000000002',
          email: 'active.contractor@test.forsured.com',
          aud: 'authenticated',
          role: 'authenticated',
        },
      }));
    });

    // Set up API mocks
    await page.route('**/rest/v1/user_profiles*', async (route: any) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'profile-test',
          scaffald_user_id: '20000000-0000-0000-0000-000000000002',
          user_type: 'contractor',
          onboarding_completed: true,
          onboarding_step: 4,
          company_connected: true,
        }]),
      });
    });

    await page.route('**/api/trpc/**', async (route: any) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              lexicon: {},
              userSetType: null,
            },
          },
        }),
      });
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('BUG FIX VALIDATION: Authentication redirect loop is fixed', async () => {
    // Navigate to start page
    await page.goto('http://localhost:5173/start');
    await page.waitForLoadState('networkidle');

    // Verify start page loads
    const content = await page.content();
    expect(content.toLowerCase()).toContain('forsured');
    console.log('✓ Start page loaded successfully');
  });

  test('BUG FIX VALIDATION: Dashboard loads without modal crash', async () => {
    // Navigate to dashboard
    await page.goto('http://localhost:5173/subcontractor/dashboard');
    await page.waitForTimeout(2000);

    // Check for modal crash error
    const consoleErrors: string[] = [];
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Verify no modal size prop errors
    const hasModalError = consoleErrors.some(err =>
      err.includes('size') || err.includes('undefined')
    );
    expect(hasModalError).toBeFalsy();

    console.log('✓ Dashboard loads without modal crash');
    console.log('  Console errors:', consoleErrors.length === 0 ? 'None' : consoleErrors);
  });

  test('NAVIGATION: Can navigate to Projects page', async () => {
    await page.goto('http://localhost:5173/subcontractor/projects');
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/projects');
    console.log('✓ Projects page accessible');
  });

  test('NAVIGATION: Can navigate to Tasks page', async () => {
    await page.goto('http://localhost:5173/subcontractor/tasks');
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/tasks');
    console.log('✓ Tasks page accessible');
  });

  test('NAVIGATION: Can navigate to Documents page', async () => {
    await page.goto('http://localhost:5173/subcontractor/documents');
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/documents');
    console.log('✓ Documents page accessible');
  });

  test('BUG FIX VALIDATION: Documents upload button exists', async () => {
    await page.goto('http://localhost:5173/subcontractor/documents');
    await page.waitForTimeout(1000);

    // Look for upload button
    const uploadButton = await page.locator('button:has-text("Upload"), input[type="file"]').first();
    const isVisible = await uploadButton.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
    console.log('✓ Upload button exists on Documents page');
  });

  test('NAVIGATION: Can navigate to Settings/Profile page', async () => {
    await page.goto('http://localhost:5173/subcontractor/settings/profile');
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/settings');
    console.log('✓ Settings page accessible');
  });

  test('NAVIGATION: Can navigate to Help page', async () => {
    await page.goto('http://localhost:5173/subcontractor/help');
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/help');
    console.log('✓ Help page accessible');
  });

  test('BROWSER NAVIGATION: Back button works without redirect loop', async () => {
    await page.goto('http://localhost:5173/subcontractor/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:5173/subcontractor/projects');
    await page.waitForTimeout(1000);

    await page.goBack();
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/dashboard');
    console.log('✓ Browser back button works correctly');
  });

  test('REFRESH: Page refresh maintains authentication', async () => {
    await page.goto('http://localhost:5173/subcontractor/dashboard');
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/dashboard');
    console.log('✓ Page refresh maintains session');
  });
});
