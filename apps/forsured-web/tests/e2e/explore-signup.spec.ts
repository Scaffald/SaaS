import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Signup Page Exploration', () => {
  test('Initial page load - Industry selection step', async ({ page }) => {
    // Navigate to signup page
    await page.goto('http://localhost:5173/signup');

    // Wait for page to be fully loaded - check for specific content
    await page.waitForSelector('text=/Welcome to ForSured/i', { timeout: 10000 });

    // Take initial screenshot
    const screenshotDir = path.join(process.cwd(), 'test-results', 'signup-exploration');
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, '01-industry-selection.png'),
      fullPage: true
    });

    // Get page title
    const title = await page.title();
    console.log('\n========================================');
    console.log('SIGNUP PAGE EXPLORATION - INDUSTRY STEP');
    console.log('========================================');
    console.log('Page Title:', title);
    console.log('URL:', page.url());

    // Get all visible text content
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== Visible Page Text (first 500 chars) ===');
    console.log(bodyText?.substring(0, 500).trim());

    // Get all elements with data-testid attributes
    const testIdElements = await page.locator('[data-testid]').all();
    console.log('\n=== Elements with data-testid ===');
    console.log(`Total: ${testIdElements.length} elements`);
    for (const element of testIdElements) {
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const isVisible = await element.isVisible();
      console.log(`- ${testId} (${tagName}): ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
      if (text && text.trim()) {
        console.log(`  Text: "${text.trim().substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
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
      console.log(`- "${text?.trim()}" - TestId: ${testId} - ${isVisible ? 'VISIBLE' : 'HIDDEN'} - ${isDisabled ? 'DISABLED' : 'ENABLED'}`);
    }

    // Get checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log('\n=== Checkboxes ===');
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.isChecked();
      const isVisible = await checkbox.isVisible();
      console.log(`- Checked: ${isChecked}, Visible: ${isVisible}`);
    }

    // Check for industry cards
    const industryCards = await page.locator('[data-testid^="industry-"]').all();
    console.log('\n=== Industry Cards ===');
    console.log(`Total: ${industryCards.length} industry options`);
    for (const card of industryCards) {
      const testId = await card.getAttribute('data-testid');
      const text = await card.textContent();
      console.log(`- ${testId}: "${text?.trim()}"`);
    }
  });

  test('Click industry and view role selection step', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    await page.waitForSelector('text=/Welcome to ForSured/i', { timeout: 10000 });

    // Find and click the first industry option
    const industryCards = await page.locator('[data-testid^="industry-"]').all();

    if (industryCards.length > 0) {
      const firstIndustry = industryCards[0];
      const industryName = await firstIndustry.getAttribute('data-testid');
      console.log('\n========================================');
      console.log('CLICKING INDUSTRY:', industryName);
      console.log('========================================');

      await firstIndustry.click();

      // Wait for role selection to appear
      await page.waitForSelector('[data-testid="user-type-manager"]', { timeout: 5000 });

      // Take screenshot of role selection
      const screenshotDir = path.join(process.cwd(), 'test-results', 'signup-exploration');
      await page.screenshot({
        path: path.join(screenshotDir, '02-role-selection.png'),
        fullPage: true
      });

      console.log('\n=== Role Selection Step ===');

      // Check for back button
      const backButton = await page.locator('[data-testid="back-to-industry"]').isVisible();
      console.log('Back button visible:', backButton);

      // Get role cards
      const managerCard = await page.locator('[data-testid="user-type-manager"]');
      const contractorCard = await page.locator('[data-testid="user-type-contractor"]');

      if (await managerCard.isVisible()) {
        const managerText = await managerCard.textContent();
        console.log('Manager card text:', managerText?.trim());
      }

      if (await contractorCard.isVisible()) {
        const contractorText = await contractorCard.textContent();
        console.log('Contractor card text:', contractorText?.trim());
      }

      // Check broker invitation section
      const brokerLink = await page.locator('[data-testid="broker-invitation-link"]');
      if (await brokerLink.isVisible()) {
        console.log('Broker invitation link visible');
      }
    }
  });

  test('Show broker invitation UI', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    await page.waitForSelector('text=/Welcome to ForSured/i', { timeout: 10000 });

    // Click broker invitation link
    const brokerLink = page.locator('[data-testid="broker-invitation-link"]');
    if (await brokerLink.isVisible()) {
      console.log('\n========================================');
      console.log('SHOWING BROKER INVITATION UI');
      console.log('========================================');

      await brokerLink.click();

      // Wait for invitation UI
      await page.waitForSelector('[data-testid="invitation-code-input"]', { timeout: 5000 });

      // Take screenshot
      const screenshotDir = path.join(process.cwd(), 'test-results', 'signup-exploration');
      await page.screenshot({
        path: path.join(screenshotDir, '03-broker-invitation.png'),
        fullPage: true
      });

      console.log('\n=== Broker Invitation UI ===');

      const codeInput = await page.locator('[data-testid="invitation-code-input"]');
      const verifyButton = await page.locator('[data-testid="verify-invitation-button"]');
      const cancelButton = await page.locator('[data-testid="cancel-invitation-button"]');

      console.log('Code input visible:', await codeInput.isVisible());
      console.log('Verify button visible:', await verifyButton.isVisible());
      console.log('Cancel button visible:', await cancelButton.isVisible());

      const placeholder = await codeInput.getAttribute('placeholder');
      console.log('Input placeholder:', placeholder);
    }
  });

  test('Dump complete page structure', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
    await page.waitForSelector('text=/Welcome to ForSured/i', { timeout: 10000 });

    const html = await page.content();
    const outputPath = path.join(process.cwd(), 'test-results', 'signup-exploration', 'page-source.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    console.log('\n========================================');
    console.log('Page source written to:', outputPath);
    console.log('HTML length:', html.length, 'characters');
    console.log('========================================');
  });
});
