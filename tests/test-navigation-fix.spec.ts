/**
 * Quick test to debug navigation issue
 */
import { test, expect } from '@playwright/test'
import { OFFICE_ROUTES } from './helpers/office-navigation'

test('debug navigation to office route', async ({ page }) => {
  console.log('🔍 Testing navigation flow...')

  // Try 1: Navigate directly to office route
  console.log('📍 Attempt 1: Direct navigation to /office/users')
  await page.goto(OFFICE_ROUTES.USERS, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  console.log(`   Result: ${page.url()}`)

  // Try 2: Navigate to dashboard first, then office route
  console.log('📍 Attempt 2: Dashboard first, then /office/users')
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  console.log(`   After dashboard: ${page.url()}`)

  await page.goto(OFFICE_ROUTES.USERS, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  console.log(`   After office/users: ${page.url()}`)

  // Check if there's an office menu we need to click
  const bodyText = await page.locator('body').textContent()
  console.log(`   Page contains "Office": ${bodyText?.includes('Office')}`)
  console.log(`   Page contains "Users": ${bodyText?.includes('Users')}`)

  // Take screenshot to see what's on the page
  await page.screenshot({ path: '.playwright-mcp/navigation-debug.png', fullPage: true })
  console.log('📸 Screenshot saved to .playwright-mcp/navigation-debug.png')

  // This will help us understand what's happening
  expect(true).toBe(true)
})
