/**
 * Admin Map Discovery Interface Exploration
 * Task: admin-route-explore-011
 * Route: /dashboard/discover/map
 * User: Admin (ewongagent@gmail.com)
 */

import { test, expect } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { promises as fs } from 'fs'
import path from 'path'

test.describe('Admin Map Discovery UI Exploration', () => {
  test('explore /dashboard/discover/map interface', async ({ page }) => {
    // Set longer timeout for this exploration test
    test.setTimeout(90000)

    console.log('=== Admin Map Discovery UI Exploration ===\n')

    // Step 1: Sign in as admin (handles profile completion automatically)
    console.log('1. Signing in as admin...')
    await signInAsAdmin(page)
    console.log('✓ Signed in successfully\n')

    // Step 2: Navigate to map discovery route
    console.log('2. Navigating to /dashboard/discover/map...')
    await page.goto('/dashboard/discover/map', { waitUntil: 'domcontentloaded' })

    // Wait for loading to finish
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    await page.waitForTimeout(3000)
    console.log('✓ Page loaded\n')

    // Verify we're on the right page
    expect(page.url()).toContain('/dashboard/discover/map')

    // Capture full page screenshot
    await page.screenshot({ path: '.playwright-mcp/admin-011-dashboard-discover-map.png', fullPage: true })
    console.log('📸 Full page screenshot saved\n')

    // === PAGE METADATA ===
    console.log('=== PAGE METADATA ===\n')
    const title = await page.title()
    const url = page.url()
    console.log(`Page Title: ${title}`)
    console.log(`Current URL: ${url}\n`)

    // === LAYOUT STRUCTURE ===
    console.log('=== LAYOUT STRUCTURE ===\n')
    const header = await page.locator('header').count()
    const nav = await page.locator('nav').count()
    const main = await page.locator('main').count()
    const aside = await page.locator('aside').count()

    console.log(`Header elements: ${header}`)
    console.log(`Nav elements: ${nav}`)
    console.log(`Main elements: ${main}`)
    console.log(`Aside elements: ${aside}\n`)

    // === HEADINGS ===
    console.log('=== HEADINGS & PAGE CONTENT ===\n')

    const h1s = await page.locator('h1').allTextContents()
    const h2s = await page.locator('h2').allTextContents()
    const h3s = await page.locator('h3').allTextContents()

    if (h1s.filter(h => h.trim()).length > 0) {
      console.log('H1 Headings:')
      h1s.forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`))
      console.log('')
    }

    if (h2s.filter(h => h.trim()).length > 0) {
      console.log('H2 Headings:')
      h2s.slice(0, 10).forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`))
      console.log('')
    }

    if (h3s.filter(h => h.trim()).length > 0) {
      console.log('H3 Headings:')
      h3s.slice(0, 10).forEach((h, i) => h.trim() && console.log(`  ${i + 1}. ${h.trim()}`))
      console.log('')
    }

    // === MAP CONTAINER DETECTION ===
    console.log('=== MAP CONTAINER DETECTION ===\n')

    const mapSelectors = [
      { selector: 'canvas', name: 'Canvas elements' },
      { selector: '[class*="map"]', name: 'Elements with "map" in class' },
      { selector: '[id*="map"]', name: 'Elements with "map" in ID' },
      { selector: '[class*="leaflet"]', name: 'Leaflet map elements' },
      { selector: '[class*="mapbox"]', name: 'Mapbox elements' },
      { selector: 'iframe', name: 'iFrame embeds' },
    ]

    for (const { selector, name } of mapSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`✓ ${name}: ${count}`)
        const el = page.locator(selector).first()
        const cls = await el.getAttribute('class').catch(() => '')
        const id = await el.getAttribute('id').catch(() => '')
        if (cls && cls.length < 100) console.log(`  Class: ${cls}`)
        else if (cls) console.log(`  Class: ${cls.substring(0, 100)}...`)
        if (id) console.log(`  ID: ${id}`)
      }
    }
    console.log('')

    // === FILTER CONTROLS ===
    console.log('=== FILTER CONTROLS ===\n')

    const inputs = await page.locator('input').all()
    console.log(`Total input fields: ${inputs.length}`)

    if (inputs.length > 0) {
      console.log('\nInput field details:')
      for (let i = 0; i < Math.min(inputs.length, 15); i++) {
        const type = (await inputs[i].getAttribute('type')) || 'text'
        const placeholder = await inputs[i].getAttribute('placeholder')
        const ariaLabel = await inputs[i].getAttribute('aria-label')
        const name = await inputs[i].getAttribute('name')

        console.log(`  Input ${i + 1}:`)
        console.log(`    Type: ${type}`)
        if (placeholder) console.log(`    Placeholder: ${placeholder}`)
        if (ariaLabel) console.log(`    ARIA: ${ariaLabel}`)
        if (name) console.log(`    Name: ${name}`)
      }
      console.log('')
    }

    // Select dropdowns
    const selects = await page.locator('select').count()
    console.log(`Select dropdowns: ${selects}`)

    if (selects > 0) {
      for (let i = 0; i < selects; i++) {
        const options = await page.locator('select').nth(i).locator('option').allTextContents()
        console.log(`  Select ${i + 1}: ${options.slice(0, 5).join(', ')}${options.length > 5 ? '...' : ''}`)
      }
      console.log('')
    }

    // === BUTTONS & ACTIONS ===
    console.log('=== BUTTONS & ACTIONS ===\n')

    const buttons = await page.locator('button').allTextContents()
    const uniqueButtons = [...new Set(buttons.filter(b => b.trim()))]
    console.log(`Total unique buttons: ${uniqueButtons.length}`)
    uniqueButtons.slice(0, 25).forEach((b, i) => console.log(`  ${i + 1}. ${b.trim()}`))
    console.log('')

    // === LABELS & FORM ELEMENTS ===
    console.log('=== LABELS & FORM ELEMENTS ===\n')

    const labels = await page.locator('label').allTextContents()
    const uniqueLabels = [...new Set(labels.filter(l => l.trim() && l.trim().length < 60))]
    console.log(`Form labels: ${uniqueLabels.length}`)
    uniqueLabels.slice(0, 15).forEach((l, i) => console.log(`  ${i + 1}. ${l.trim()}`))
    console.log('')

    // === INTERACTIVE ELEMENTS ===
    console.log('=== INTERACTIVE ELEMENTS ===\n')

    const checkboxes = await page.locator('input[type="checkbox"]').count()
    const radios = await page.locator('input[type="radio"]').count()
    const sliders = await page.locator('input[type="range"]').count()
    const switches = await page.locator('[role="switch"]').count()

    console.log(`Checkboxes: ${checkboxes}`)
    console.log(`Radio buttons: ${radios}`)
    console.log(`Range sliders: ${sliders}`)
    console.log(`Toggle switches: ${switches}\n`)

    // === MAP-SPECIFIC CONTROLS ===
    console.log('=== MAP-SPECIFIC CONTROLS ===\n')

    const zoomControls = await page.locator('[aria-label*="zoom" i], button:has-text("Zoom")').count()
    const markers = await page.locator('[class*="marker"], svg[class*="marker"]').count()
    const legend = await page.locator('[class*="legend"]').count()
    const locationBtn = await page.locator('[aria-label*="location" i]').count()

    console.log(`Zoom controls: ${zoomControls}`)
    console.log(`Map markers: ${markers}`)
    console.log(`Legend: ${legend}`)
    console.log(`Location buttons: ${locationBtn}\n`)

    // === CONTENT SECTIONS ===
    console.log('=== CONTENT SECTIONS ===\n')

    const sections = await page.locator('section').all()
    console.log(`Sections: ${sections.length}`)

    for (let i = 0; i < Math.min(sections.length, 8); i++) {
      const heading = await sections[i].locator('h1, h2, h3').first().textContent().catch(() => '')
      const aria = (await sections[i].getAttribute('aria-label')) || ''
      if (heading.trim() || aria) {
        console.log(`  Section ${i + 1}: ${heading.trim() || aria}`)
      }
    }
    console.log('')

    // === ACCESSIBILITY ===
    console.log('=== ACCESSIBILITY ===\n')

    const ariaLabels = await page.locator('[aria-label]').count()
    const ariaDescribed = await page.locator('[aria-describedby]').count()
    const roles = await page.locator('[role]').count()

    console.log(`Elements with aria-label: ${ariaLabels}`)
    console.log(`Elements with aria-describedby: ${ariaDescribed}`)
    console.log(`Elements with role: ${roles}\n`)

    // Additional screenshot of main content
    const mainEl = await page.locator('main').count()
    if (mainEl > 0) {
      await page.locator('main').first().screenshot({ path: '.playwright-mcp/admin-011-main-content.png' })
      console.log('📸 Main content screenshot saved\n')
    }

    // === HTML STRUCTURE ===
    console.log('=== HTML STRUCTURE ===\n')

    const html = await page.locator('body').innerHTML()
    const divs = (html.match(/<div/g) || []).length
    const btns = (html.match(/<button/g) || []).length
    const inps = (html.match(/<input/g) || []).length

    console.log(`Div elements: ${divs}`)
    console.log(`Button elements: ${btns}`)
    console.log(`Input elements: ${inps}`)
    console.log(`HTML size: ${(html.length / 1024).toFixed(2)} KB\n`)

    console.log('=== EXPLORATION COMPLETE ===\n')
    console.log('✓ Admin map discovery interface documented')
    console.log('✓ All UI elements catalogued')
    console.log('✓ Screenshots saved to .playwright-mcp/')

    // Basic assertion to ensure the test passes
    expect(title).toBeTruthy()
  })
})
