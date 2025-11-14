import { test } from '@playwright/test'

/**
 * Sign in manually through UI and capture the REAL localStorage keys Supabase uses
 */
test('capture real Supabase localStorage keys', async ({ page }) => {
  console.log('\n=== Navigating to auth page ===')
  await page.goto('http://localhost:8081/auth')
  await page.waitForLoadState('domcontentloaded')

  // Check localStorage before sign-in
  const beforeSignIn = await page.evaluate(() => {
    return Object.keys(localStorage)
  })
  console.log('\nLocalStorage keys BEFORE sign-in:', beforeSignIn)

  console.log('\n=== Filling sign-in form ===')
  // Wait for and fill email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await emailInput.fill('ewongagent@gmail.com')

  // Fill password
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first()
  await passwordInput.fill('password123')

  // Submit - try multiple possible selectors
  try {
    await page.locator('button[type="submit"]').first().click()
  } catch {
    try {
      await page.getByRole('button', { name: /sign in|login|submit/i }).click()
    } catch {
      await page.locator('button').first().click()
    }
  }

  console.log('\n=== Waiting for navigation ===')
  // Wait for navigation or timeout
  await page.waitForTimeout(5000)

  // Check localStorage after sign-in
  const afterSignIn = await page.evaluate(() => {
    const result: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value && key.includes('sb-') || key.includes('supabase') || key.includes('auth')) {
          try {
            const parsed = JSON.parse(value)
            result[key] = {
              type: typeof parsed,
              keys: Array.isArray(parsed) ? `Array[${parsed.length}]` : (typeof parsed === 'object' ? Object.keys(parsed) : []),
              sample: typeof parsed === 'string' ? parsed.substring(0, 50) + '...' : typeof parsed,
            }
          } catch {
            result[key] = value.substring(0, 100) + '...'
          }
        }
      }
    }
    return result
  })

  console.log('\n=== LocalStorage keys AFTER sign-in ===')
  for (const [key, value] of Object.entries(afterSignIn)) {
    console.log(`\nKey: "${key}"`)
    console.log('Value structure:', JSON.stringify(value, null, 2))
  }

  console.log('\n=== Current state ===')
  console.log('URL:', page.url())
  console.log('Auth successful:', !page.url().includes('/auth'))

  await page.screenshot({ path: '.playwright-mcp/real-signin-result.png', fullPage: true })
})
