/**
 * Debug Page Load
 * Captures console logs and errors to understand why pages aren't rendering
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Debug page load with full logging', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  // Capture all console messages
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    const text = `[PAGE ERROR] ${error.message}\n${error.stack}`;
    errors.push(text);
    console.error(text);
  });

  // Capture request failures
  page.on('requestfailed', (request) => {
    const text = `[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`;
    errors.push(text);
    console.error(text);
  });

  console.log('\n========== NAVIGATING TO ROOT ==========');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('\n========== WAITING FOR REACT TO RENDER ==========');
  await page.waitForTimeout(5000);

  console.log('\n========== PAGE STATE ==========');
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('HTML preview:', html.substring(0, 500));

  // Check if root div has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log('\n========== ROOT DIV CONTENT ==========');
  console.log('Length:', rootContent.length);
  console.log('Preview:', rootContent.substring(0, 500));

  // Take screenshot
  const screenshotDir = path.join(process.cwd(), 'test-results', 'debug');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, 'page-load-debug.png'),
    fullPage: true
  });

  // Save logs
  const logPath = path.join(screenshotDir, 'console-logs.txt');
  fs.writeFileSync(logPath, logs.join('\n'));
  console.log('\n========== LOGS SAVED TO ==========');
  console.log(logPath);

  if (errors.length > 0) {
    const errorPath = path.join(screenshotDir, 'errors.txt');
    fs.writeFileSync(errorPath, errors.join('\n\n'));
    console.log('\n========== ERRORS SAVED TO ==========');
    console.log(errorPath);
  }

  console.log('\n========== TOTAL LOGS:', logs.length, '==========');
  console.log('========== TOTAL ERRORS:', errors.length, '==========');
});
