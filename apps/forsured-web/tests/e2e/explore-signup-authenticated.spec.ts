/**
 * Signup Page Exploration - Authenticated
 *
 * This script explores the signup page AFTER authentication.
 * The signup page requires a logged-in user to display.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Signup Page Exploration - Authenticated', () => {
  test('Authenticate and explore signup page', async ({ page }) => {
    console.log('\n========================================');
    console.log('STEP 1: AUTHENTICATING USER');
    console.log('========================================');

    // Step 1: Navigate to start page
    await page.goto('http://localhost:5173/start');
    await page.waitForLoadState('networkidle');

    // Step 2: Click "Continue with Scaffald Account" to authenticate
    const scaffaldButton = page.getByRole('button', { name: 'Continue with Scaffald Account' });
    await expect(scaffaldButton).toBeVisible({ timeout: 10000 });
    await scaffaldButton.click();

    // Step 3: Wait for authentication redirect
    // Should redirect to /callback or /signup
    await page.waitForURL(/\/(callback|signup)/, { timeout: 15000 });

    // If on callback, wait for it to process
    if (page.url().includes('/callback')) {
      console.log('On callback page, waiting for redirect to signup...');
      await page.waitForURL(/\/signup/, { timeout: 15000 });
    }

    // Create screenshot directory
    const screenshotDir = path.join(process.cwd(), 'test-results', 'signup-exploration');
    fs.mkdirSync(screenshotDir, { recursive: true });

    console.log('\n========================================');
    console.log('STEP 2: EXPLORING SIGNUP PAGE - INDUSTRY STEP');
    console.log('========================================');
    console.log('Current URL:', page.url());

    // Wait for signup content to load
    await page.waitForSelector('text=/Welcome to ForSured/i', { timeout: 10000 });

    // Take initial screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '01-industry-selection-authenticated.png'),
      fullPage: true
    });

    // Get page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Get visible text
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== Page Header Text ===');
    const lines = bodyText?.split('\n').filter(line => line.trim().length > 0) || [];
    lines.slice(0, 10).forEach(line => console.log(line.trim()));

    // Get all elements with data-testid
    const testIdElements = await page.locator('[data-testid]').all();
    console.log('\n=== Elements with data-testid ===');
    console.log(`Total: ${testIdElements.length} elements`);
    for (const element of testIdElements) {
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      const isVisible = await element.isVisible();
      const text = await element.textContent();
      console.log(`- ${testId} (${tagName}): ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
      if (text && text.trim() && isVisible) {
        console.log(`  Text: "${text.trim().substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
      }
    }

    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log('\n=== Buttons ===');
    console.log(`Total: ${buttons.length} buttons`);
    for (const button of buttons) {
      const text = await button.textContent();
      const testId = await button.getAttribute('data-testid');
      const isVisible = await button.isVisible();
      const isDisabled = await button.isDisabled();
      if (isVisible) {
        console.log(`- "${text?.trim()}" - TestId: ${testId} - ${isDisabled ? 'DISABLED' : 'ENABLED'}`);
      }
    }

    // Check for checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log('\n=== Checkboxes ===');
    console.log(`Total: ${checkboxes.length} checkboxes`);
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.isChecked();
      const isVisible = await checkbox.isVisible();
      if (isVisible) {
        console.log(`- Checked: ${isChecked}, Visible: ${isVisible}`);
      }
    }

    // Check for industry cards
    const industryCards = await page.locator('[data-testid^="industry-"]').all();
    console.log('\n=== Industry Cards ===');
    console.log(`Total: ${industryCards.length} industry options`);
    for (const card of industryCards) {
      const testId = await card.getAttribute('data-testid');
      const text = await card.textContent();
      console.log(`\nIndustry: ${testId}`);
      console.log(`Content: "${text?.trim()}"`);
    }

    // Check broker invitation section
    const brokerLink = page.locator('[data-testid="broker-invitation-link"]');
    const brokerLinkVisible = await brokerLink.isVisible();
    console.log('\n=== Broker Invitation Section ===');
    console.log('Broker invitation link visible:', brokerLinkVisible);
    if (brokerLinkVisible) {
      const brokerText = await brokerLink.textContent();
      console.log('Link text:', brokerText?.trim());
    }

    console.log('\n========================================');
    console.log('STEP 3: CLICKING FIRST INDUSTRY');
    console.log('========================================');

    // Click the first industry if available
    if (industryCards.length > 0) {
      const firstIndustry = industryCards[0];
      const industryTestId = await firstIndustry.getAttribute('data-testid');
      console.log('Clicking industry:', industryTestId);

      await firstIndustry.click();

      // Wait for role selection step
      await page.waitForSelector('[data-testid="user-type-manager"]', { timeout: 5000 });

      // Take screenshot of role selection
      await page.screenshot({
        path: path.join(screenshotDir, '02-role-selection-authenticated.png'),
        fullPage: true
      });

      console.log('\n=== Role Selection Step ===');

      // Check for back button
      const backButton = page.locator('[data-testid="back-to-industry"]');
      const backButtonVisible = await backButton.isVisible();
      console.log('Back button visible:', backButtonVisible);

      // Get role cards
      const managerCard = page.locator('[data-testid="user-type-manager"]');
      const contractorCard = page.locator('[data-testid="user-type-contractor"]');

      if (await managerCard.isVisible()) {
        const managerText = await managerCard.textContent();
        console.log('\nManager card:');
        console.log(managerText?.trim());
      }

      if (await contractorCard.isVisible()) {
        const contractorText = await contractorCard.textContent();
        console.log('\nContractor card:');
        console.log(contractorText?.trim());
      }

      // Check broker section again
      const brokerLinkInRole = page.locator('[data-testid="broker-invitation-link"]');
      if (await brokerLinkInRole.isVisible()) {
        console.log('\nBroker invitation still visible on role selection step');
      }

      console.log('\n========================================');
      console.log('STEP 4: SHOWING BROKER INVITATION UI');
      console.log('========================================');

      // Click broker invitation link
      if (await brokerLinkInRole.isVisible()) {
        await brokerLinkInRole.click();

        // Wait for invitation UI
        await page.waitForSelector('[data-testid="invitation-code-input"]', { timeout: 5000 });

        // Take screenshot
        await page.screenshot({
          path: path.join(screenshotDir, '03-broker-invitation-authenticated.png'),
          fullPage: true
        });

        console.log('\n=== Broker Invitation UI ===');

        const codeInput = page.locator('[data-testid="invitation-code-input"]');
        const verifyButton = page.locator('[data-testid="verify-invitation-button"]');
        const cancelButton = page.locator('[data-testid="cancel-invitation-button"]');

        console.log('Code input visible:', await codeInput.isVisible());
        console.log('Verify button visible:', await verifyButton.isVisible());
        console.log('Verify button disabled:', await verifyButton.isDisabled());
        console.log('Cancel button visible:', await cancelButton.isVisible());

        const placeholder = await codeInput.getAttribute('placeholder');
        console.log('Input placeholder:', placeholder);

        // Test typing in the invitation code
        console.log('\nTesting invitation code input...');
        await codeInput.fill('TEST1234');
        const verifyButtonEnabled = !(await verifyButton.isDisabled());
        console.log('Verify button enabled after typing:', verifyButtonEnabled);
      }
    }

    console.log('\n========================================');
    console.log('STEP 5: SAVING PAGE SOURCE');
    console.log('========================================');

    // Save page HTML
    const html = await page.content();
    const htmlPath = path.join(screenshotDir, 'page-source-authenticated.html');
    fs.writeFileSync(htmlPath, html);
    console.log('Page source written to:', htmlPath);
    console.log('HTML length:', html.length, 'characters');

    console.log('\n========================================');
    console.log('EXPLORATION COMPLETE');
    console.log('========================================');
    console.log('Screenshots saved to:', screenshotDir);
  });
});
