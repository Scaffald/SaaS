// @ts-nocheck
/**
 * Admin Map Discovery UI Exploration
 * Task: admin-route-explore-011
 * Route: /dashboard/discover/map
 * User: Admin (ewongagent@gmail.com)
 */

import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

test.describe('Admin • /dashboard/discover/map - UI Exploration', () => {
  test('explore map interface and document all UI elements', async ({ page }) => {
    test.setTimeout(60000)

    console.log('\n=== Admin Map Discovery UI Exploration ===\n')

    // Sign in as admin
    console.log('1. Signing in as admin...')
    await signInAsAdmin(page)
    console.log('✓ Signed in\n')

    // Navigate to map
    console.log('2. Navigating to /dashboard/discover/map...')
    await page.goto('/dashboard/discover/map', { waitUntil: 'domcontentloaded' })

    // Wait for page to load
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(2000)

    console.log('✓ Page loaded\n')

    // Verify URL
    expect(page.url()).toContain('/dashboard/discover/map')

    // Screenshot
    await page.screenshot({ path: '.playwright-mcp/admin-011-map-full.png', fullPage: true })
    console.log('📸 Screenshot saved\n')

    // === DOCUMENTATION ===
    console.log('=== PAGE METADATA ===')
    const title = await page.title()
    console.log(`Title: ${title}`)
    console.log(`URL: ${page.url()}\n`)

    console.log('=== LAYOUT ===')
    console.log(`Headers: ${await page.locator('header').count()}`)
    console.log(`Nav: ${await page.locator('nav').count()}`)
    console.log(`Main: ${await page.locator('main').count()}\n`)

    console.log('=== HEADINGS ===')
    const h1s = (await page.locator('h1').allTextContents()).filter(h => h.trim())
    const h2s = (await page.locator('h2').allTextContents()).filter(h => h.trim())
    if (h1s.length) console.log(`H1: ${h1s.join(', ')}`)
    if (h2s.length) console.log(`H2: ${h2s.slice(0, 5).join(', ')}\n`)

    console.log('=== MAP ELEMENTS ===')
    console.log(`Canvas: ${await page.locator('canvas').count()}`)
    console.log(`Map containers: ${await page.locator('[class*="map"]').count()}`)
    console.log(`iFrames: ${await page.locator('iframe').count()}\n`)

    console.log('=== CONTROLS ===')
    console.log(`Inputs: ${await page.locator('input').count()}`)
    console.log(`Buttons: ${await page.locator('button').count()}`)
    console.log(`Selects: ${await page.locator('select').count()}\n`)

    const buttons = (await page.locator('button').allTextContents()).filter(b => b.trim())
    const uniqueButtons = [...new Set(buttons)]
    console.log(`Unique Buttons (${uniqueButtons.length}):`)
    uniqueButtons.slice(0, 15).forEach(b => console.log(`  - ${b}`))
    console.log('')

    console.log('=== INTERACTIVE ===')
    console.log(`Checkboxes: ${await page.locator('input[type="checkbox"]').count()}`)
    console.log(`Radio: ${await page.locator('input[type="radio"]').count()}`)
    console.log(`Sliders: ${await page.locator('input[type="range"]').count()}\n`)

    console.log('=== ACCESSIBILITY ===')
    console.log(`aria-label: ${await page.locator('[aria-label]').count()}`)
    console.log(`roles: ${await page.locator('[role]').count()}\n`)

    console.log('=== HTML STATS ===')
    const html = await page.locator('body').innerHTML()
    console.log(`Divs: ${(html.match(/<div/g) || []).length}`)
    console.log(`Size: ${(html.length / 1024).toFixed(2)} KB\n`)

    console.log('=== EXPLORATION COMPLETE ===\n')

    // Final assertion
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })
})
