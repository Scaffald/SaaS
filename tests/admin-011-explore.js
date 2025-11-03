/**
 * Standalone exploration script for admin map discovery
 * Task: admin-route-explore-011
 * Route: /dashboard/discover/map
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const ADMIN_EMAIL = 'ewongagent@gmail.com';
const ADMIN_PASSWORD = 'password123';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  try {
    console.log('=== Admin Map Discovery UI Exploration ===\n');

    // Step 1: Authenticate and get session
    console.log('1. Authenticating admin user...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error) throw new Error(`Auth failed: ${error.message}`);
    if (!data.session) throw new Error('No session created');
    console.log('✓ Authenticated\n');

    // Step 2: Navigate and set auth state
    console.log('2. Setting up browser session...');
    await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Set authentication in localStorage
    await page.evaluate(
      ({ session, user, url }) => {
        const hostname = new URL(url).hostname.replace(/\\./g, '-').replace(/:/g, '-');
        const storageKey = `sb-${hostname}-auth-token`;

        localStorage.setItem(storageKey, JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: user,
        }));
      },
      { session: data.session, user: data.user, url: SUPABASE_URL }
    );
    console.log('✓ Auth state set\n');

    // Step 3: Navigate to dashboard to trigger profile check
    console.log('3. Navigating to dashboard...');
    await page.goto('http://localhost:8081/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for profile completion gate
    const gateVisible = await page.getByText(/complete profile|privacy policy|terms of service/i).isVisible().catch(() => false);

    if (gateVisible) {
      console.log('4. Completing profile gate...');
      try {
        await page.getByPlaceholder(/first name/i).fill('Admin');
        await page.getByPlaceholder(/last name/i).fill('User');
        await page.getByPlaceholder(/address/i).fill('456 Admin Ave');
        await page.getByText(/employer hiring workers|worker seeking employment/i).click();

        // Try to select industry
        try {
          await page.getByRole('combobox').first().click({ timeout: 2000 });
          await page.locator('[role="option"]').first().click({ timeout: 2000 });
        } catch {}

        await page.getByText(/privacy policy/i).click();
        await page.getByText(/terms of service/i).click();
        await page.getByRole('button', { name: /complete profile|continue|submit/i }).click();
        await page.waitForTimeout(2000);
      } catch (e) {
        console.warn('Profile completion encountered error:', e.message);
      }
      console.log('✓ Profile gate handled\n');
    } else {
      console.log('4. Profile already complete\n');
    }

    // Step 5: Navigate to map discovery
    console.log('5. Navigating to /dashboard/discover/map...');
    await page.goto('http://localhost:8081/dashboard/discover/map', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('✓ Page loaded\n');

    // Capture screenshot
    await page.screenshot({ path: '.playwright-mcp/admin-011-dashboard-discover-map.png', fullPage: true });
    console.log('📸 Full page screenshot saved\n');

    // === PAGE METADATA ===
    console.log('=== PAGE METADATA ===\n');
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Current URL: ${url}\n`);

    // === LAYOUT STRUCTURE ===
    console.log('=== LAYOUT STRUCTURE ===\n');
    const header = await page.locator('header').count();
    const nav = await page.locator('nav').count();
    const main = await page.locator('main').count();
    const aside = await page.locator('aside').count();
    console.log(`Header elements: ${header}`);
    console.log(`Nav elements: ${nav}`);
    console.log(`Main elements: ${main}`);
    console.log(`Aside elements: ${aside}\n`);

    // === HEADINGS ===
    console.log('=== HEADINGS & PAGE CONTENT ===\n');
    const h1s = await page.locator('h1').allTextContents();
    const h2s = await page.locator('h2').allTextContents();
    const h3s = await page.locator('h3').allTextContents();

    if (h1s.filter(h => h.trim()).length > 0) {
      console.log('H1 Headings:');
      h1s.forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`));
      console.log('');
    }

    if (h2s.filter(h => h.trim()).length > 0) {
      console.log('H2 Headings:');
      h2s.slice(0, 10).forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`));
      console.log('');
    }

    if (h3s.filter(h => h.trim()).length > 0) {
      console.log('H3 Headings:');
      h3s.slice(0, 10).forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`));
      console.log('');
    }

    // === MAP CONTAINER DETECTION ===
    console.log('=== MAP CONTAINER DETECTION ===\n');
    const mapSelectors = [
      { selector: 'canvas', name: 'Canvas elements' },
      { selector: '[class*="map"]', name: 'Elements with "map" in class' },
      { selector: '[id*="map"]', name: 'Elements with "map" in ID' },
      { selector: '[class*="leaflet"]', name: 'Leaflet map elements' },
      { selector: '[class*="mapbox"]', name: 'Mapbox elements' },
      { selector: 'iframe', name: 'iFrame embeds' },
    ];

    for (const { selector, name } of mapSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✓ ${name}: ${count}`);
        const el = page.locator(selector).first();
        const cls = await el.getAttribute('class').catch(() => '');
        const id = await el.getAttribute('id').catch(() => '');
        if (cls && cls.length < 100) console.log(`  Class: ${cls}`);
        else if (cls) console.log(`  Class: ${cls.substring(0, 100)}...`);
        if (id) console.log(`  ID: ${id}`);
      }
    }
    console.log('');

    // === FILTER CONTROLS ===
    console.log('=== FILTER CONTROLS ===\n');
    const inputs = await page.locator('input').all();
    console.log(`Total input fields: ${inputs.length}\n`);

    if (inputs.length > 0) {
      console.log('Input field details:');
      for (let i = 0; i < Math.min(inputs.length, 15); i++) {
        const type = (await inputs[i].getAttribute('type')) || 'text';
        const placeholder = await inputs[i].getAttribute('placeholder');
        const ariaLabel = await inputs[i].getAttribute('aria-label');
        const name = await inputs[i].getAttribute('name');

        console.log(`  Input ${i + 1}:`);
        console.log(`    Type: ${type}`);
        if (placeholder) console.log(`    Placeholder: ${placeholder}`);
        if (ariaLabel) console.log(`    ARIA: ${ariaLabel}`);
        if (name) console.log(`    Name: ${name}`);
      }
      console.log('');
    }

    // Select dropdowns
    const selects = await page.locator('select').count();
    console.log(`Select dropdowns: ${selects}`);
    if (selects > 0) {
      for (let i = 0; i < selects; i++) {
        const options = await page.locator('select').nth(i).locator('option').allTextContents();
        console.log(`  Select ${i + 1}: ${options.slice(0, 5).join(', ')}${options.length > 5 ? '...' : ''}`);
      }
      console.log('');
    }

    // === BUTTONS ===
    console.log('=== BUTTONS & ACTIONS ===\n');
    const buttons = await page.locator('button').allTextContents();
    const uniqueButtons = [...new Set(buttons.filter(b => b.trim()))];
    console.log(`Total unique buttons: ${uniqueButtons.length}`);
    uniqueButtons.slice(0, 25).forEach((b, i) => console.log(`  ${i + 1}. ${b.trim()}`));
    console.log('');

    // === LABELS ===
    console.log('=== LABELS & FORM ELEMENTS ===\n');
    const labels = await page.locator('label').allTextContents();
    const uniqueLabels = [...new Set(labels.filter(l => l.trim() && l.trim().length < 60))];
    console.log(`Form labels: ${uniqueLabels.length}`);
    uniqueLabels.slice(0, 15).forEach((l, i) => console.log(`  ${i + 1}. ${l.trim()}`));
    console.log('');

    // === INTERACTIVE ELEMENTS ===
    console.log('=== INTERACTIVE ELEMENTS ===\n');
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const radios = await page.locator('input[type="radio"]').count();
    const sliders = await page.locator('input[type="range"]').count();
    const switches = await page.locator('[role="switch"]').count();
    console.log(`Checkboxes: ${checkboxes}`);
    console.log(`Radio buttons: ${radios}`);
    console.log(`Range sliders: ${sliders}`);
    console.log(`Toggle switches: ${switches}\n`);

    // === MAP-SPECIFIC CONTROLS ===
    console.log('=== MAP-SPECIFIC CONTROLS ===\n');
    const zoomControls = await page.locator('[aria-label*="zoom" i], button:has-text("Zoom")').count();
    const markers = await page.locator('[class*="marker"], svg[class*="marker"]').count();
    const legend = await page.locator('[class*="legend"]').count();
    const locationBtn = await page.locator('[aria-label*="location" i]').count();
    console.log(`Zoom controls: ${zoomControls}`);
    console.log(`Map markers: ${markers}`);
    console.log(`Legend: ${legend}`);
    console.log(`Location buttons: ${locationBtn}\n`);

    // === CONTENT SECTIONS ===
    console.log('=== CONTENT SECTIONS ===\n');
    const sections = await page.locator('section').all();
    console.log(`Sections: ${sections.length}`);
    for (let i = 0; i < Math.min(sections.length, 8); i++) {
      const heading = await sections[i].locator('h1, h2, h3').first().textContent().catch(() => '');
      const aria = (await sections[i].getAttribute('aria-label')) || '';
      if (heading.trim() || aria) {
        console.log(`  Section ${i + 1}: ${heading.trim() || aria}`);
      }
    }
    console.log('');

    // === ACCESSIBILITY ===
    console.log('=== ACCESSIBILITY ===\n');
    const ariaLabels = await page.locator('[aria-label]').count();
    const ariaDescribed = await page.locator('[aria-describedby]').count();
    const roles = await page.locator('[role]').count();
    console.log(`Elements with aria-label: ${ariaLabels}`);
    console.log(`Elements with aria-describedby: ${ariaDescribed}`);
    console.log(`Elements with role: ${roles}\n`);

    // Additional screenshot
    const mainEl = await page.locator('main').count();
    if (mainEl > 0) {
      await page.locator('main').first().screenshot({ path: '.playwright-mcp/admin-011-main-content.png' });
      console.log('📸 Main content screenshot saved\n');
    }

    // === HTML STRUCTURE ===
    console.log('=== HTML STRUCTURE ===\n');
    const html = await page.locator('body').innerHTML();
    const divs = (html.match(/<div/g) || []).length;
    const btns = (html.match(/<button/g) || []).length;
    const inps = (html.match(/<input/g) || []).length;
    console.log(`Div elements: ${divs}`);
    console.log(`Button elements: ${btns}`);
    console.log(`Input elements: ${inps}`);
    console.log(`HTML size: ${(html.length / 1024).toFixed(2)} KB\n`);

    console.log('=== EXPLORATION COMPLETE ===\n');
    console.log('✓ Admin map discovery interface documented');
    console.log('✓ All UI elements catalogued');
    console.log('✓ Screenshots saved to .playwright-mcp/');

    await page.waitForTimeout(3000);
    await browser.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '.playwright-mcp/admin-011-error.png' });
    await browser.close();
    process.exit(1);
  }
})();
