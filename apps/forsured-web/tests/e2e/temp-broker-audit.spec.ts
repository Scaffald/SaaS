/**
 * Temporary audit script for broker pages
 * Navigates through all broker pages, clicks buttons, fills forms, checks for errors
 */

import { test, expect } from '@playwright/test';

test.describe('Broker Pages Comprehensive Audit', () => {
  test('navigate through all broker pages and check for errors', async ({ page }) => {
    // Track console errors, warnings, and network errors
    const consoleErrors: Array<{ text: string; location?: string }> = [];
    const consoleWarnings: Array<{ text: string; location?: string }> = [];
    const networkErrors: Array<{ url: string; status: number; statusText: string }> = [];

    // Listen for console errors and warnings
    page.on('console', async (msg) => {
      const text = msg.text();
      const location = msg.location();
      const locationStr = location ? `${location.url}:${location.lineNumber}:${location.columnNumber}` : 'unknown';
      
      // React prop warnings are often logged as errors
      if (text.includes('React does not recognize') || text.includes('textAlign')) {
        consoleWarnings.push({ text, location: locationStr });
      } else if (msg.type() === 'error') {
        consoleErrors.push({ text, location: locationStr });
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({ text, location: locationStr });
      }
    });

    // Listen for network errors
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        networkErrors.push({
          url: response.url(),
          status,
          statusText: response.statusText(),
        });
      }
    });

    // Navigate to start page
    await page.goto('/start', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Start page: networkidle timeout, but continuing...');
    });

    // Log in as Broker using test login button
    const brokerButton = page.getByRole('button', { name: /test.*broker/i });
    if (await brokerButton.isVisible({ timeout: 5000 })) {
      await brokerButton.click();
      await page.waitForURL(/\/broker/, { timeout: 10000 });
    } else {
      // Try alternative button text
      const altButton = page.getByRole('button', { name: /broker/i });
      if (await altButton.isVisible({ timeout: 5000 })) {
        await altButton.click();
        await page.waitForURL(/\/broker/, { timeout: 10000 });
      }
    }

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for any async operations

    console.log('=== Starting Broker Pages Audit ===');
    console.log('Current URL:', page.url());

    // 1. Dashboard Page
    console.log('\n--- Testing Dashboard Page ---');
    await page.goto('/broker/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Dashboard: networkidle timeout, but continuing...');
    });
    await page.waitForTimeout(2000);

    // Click all buttons on dashboard
    const dashboardButtons = await page.locator('button').all();
    for (const button of dashboardButtons.slice(0, 10)) { // Limit to first 10 to avoid too many clicks
      if (await button.isVisible()) {
        try {
          await button.click({ timeout: 2000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignore click errors (might be disabled, etc.)
        }
      }
    }

    // Follow all links on dashboard
    const dashboardLinks = await page.locator('a[href]').all();
    for (const link of dashboardLinks.slice(0, 5)) { // Limit to first 5
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/broker')) {
        try {
          await link.click({ timeout: 2000 });
          await page.waitForTimeout(1000);
          await page.goBack();
          await page.waitForTimeout(1000);
        } catch (e) {
          // Ignore navigation errors
        }
      }
    }

    // 2. Clients Page
    console.log('\n--- Testing Clients Page ---');
    await page.goto('/broker/clients', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Clients page: networkidle timeout, but continuing...');
    });
    await page.waitForTimeout(2000);

    // Click buttons (limited to avoid timeouts)
    try {
      const clientButtons = await page.locator('button').all();
      for (const button of clientButtons.slice(0, 5)) { // Reduced to 5
        try {
          const isVisible = await button.isVisible({ timeout: 1000 });
          if (isVisible) {
            await button.click({ timeout: 2000 });
            await page.waitForTimeout(300);
            // If a modal opened, try to close it
            try {
              const closeButton = page.getByRole('button', { name: /close|cancel|×/i }).first();
              if (await closeButton.isVisible({ timeout: 500 })) {
                await closeButton.click({ timeout: 1000 });
                await page.waitForTimeout(300);
              }
            } catch (e) {
              // No close button found, continue
            }
          }
        } catch (e) {
          // Ignore individual button errors
        }
      }
    } catch (e) {
      console.log('Button clicking skipped due to error:', e);
    }

    // Try to fill forms if any are visible (with timeout protection)
    try {
      const inputs = await page.locator('input, textarea, select').all();
      for (const input of inputs.slice(0, 3)) { // Reduced to 3
        try {
          const isVisible = await input.isVisible({ timeout: 1000 });
          if (isVisible) {
            const inputType = await input.getAttribute('type');
            if (inputType === 'text' || inputType === 'email' || !inputType) {
              await input.fill('test@example.com', { timeout: 2000 });
            } else if (inputType === 'number') {
              await input.fill('100', { timeout: 2000 });
            }
            await page.waitForTimeout(200);
          }
        } catch (e) {
          // Ignore individual input errors
        }
      }
    } catch (e) {
      console.log('Form interaction skipped due to error:', e);
    }

    // 3. Tasks Page
    console.log('\n--- Testing Tasks Page ---');
    try {
      await page.goto('/broker/tasks', { waitUntil: 'domcontentloaded', timeout: 10000 });
      // Use a shorter timeout for networkidle since tasks page might have ongoing requests
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('Tasks page: networkidle timeout, but continuing...');
      });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Tasks page navigation failed:', e);
      // Continue to next page
    }

    // Click buttons and interact with filters
    const taskButtons = await page.locator('button').all();
    for (const button of taskButtons.slice(0, 10)) {
      if (await button.isVisible()) {
        try {
          await button.click({ timeout: 2000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // 4. Projects Page
    console.log('\n--- Testing Projects Page ---');
    await page.goto('/broker/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Projects page: networkidle timeout, but continuing...');
    });
    await page.waitForTimeout(2000);

    // 5. Insurance Page
    console.log('\n--- Testing Insurance Page ---');
    await page.goto('/broker/insurance', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Insurance page: networkidle timeout, but continuing...');
    });
    await page.waitForTimeout(2000);

    // Try tabs if they exist
    const tabs = await page.locator('[role="tab"], .tab, [data-tab]').all();
    for (const tab of tabs.slice(0, 5)) {
      if (await tab.isVisible()) {
        try {
          await tab.click({ timeout: 2000 });
          await page.waitForTimeout(1000);
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // 6. Team Page
    console.log('\n--- Testing Team Page ---');
    await page.goto('/broker/team', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Team page: networkidle timeout, but continuing...');
    });
    await page.waitForTimeout(2000);

    // 7. Documents Page (if exists)
    console.log('\n--- Testing Documents Page ---');
    try {
      await page.goto('/broker/documents');
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Documents page not found or not accessible');
    }

    // 8. Settings Page (if exists)
    console.log('\n--- Testing Settings Page ---');
    try {
      await page.goto('/broker/settings');
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Settings page not found or not accessible');
    }

    // Final wait for any pending operations
    await page.waitForTimeout(2000);

    // Report errors
    console.log('\n=== ERROR REPORT ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
        if (error.location) {
          console.log(`   Location: ${error.location}`);
        }
      });
    }

    console.log(`\nConsole Warnings (React Props): ${consoleWarnings.length}`);
    if (consoleWarnings.length > 0) {
      consoleWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.text}`);
        if (warning.location) {
          console.log(`   Location: ${warning.location}`);
        }
      });
    }

    console.log(`\nNetwork Errors: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.status} ${error.statusText}: ${error.url}`);
      });
    }

    // Fail test if there are errors (optional - comment out if you just want to see the report)
    // expect(consoleErrors.length).toBe(0);
    // expect(networkErrors.length).toBe(0);
  });
});
