import { test, expect } from '@playwright/test'

/**
 * Debug test to discover the correct Supabase localStorage key
 */
test('should discover Supabase localStorage key', async ({ page }) => {
  console.log('\n=== Discovering Supabase LocalStorage Key ===')

  // Navigate to the app
  await page.goto('http://localhost:8081/')

  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded')

  // Get all localStorage keys
  const allKeys = await page.evaluate(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    return keys
  })

  console.log('\nAll localStorage keys:', allKeys)

  // Filter for Supabase-related keys
  const supabaseKeys = allKeys.filter(key =>
    key.includes('sb-') || key.includes('supabase') || key.includes('auth')
  )

  console.log('\nSupabase auth keys found:', supabaseKeys)

  // Now manually sign in through the UI and check again
  console.log('\n=== Testing Manual Sign-In to See Storage Key ===')

  // Navigate to auth page
  await page.goto('http://localhost:8081/auth')
  await page.waitForLoadState('domcontentloaded')

  // Fill in credentials
  await page.getByPlaceholder(/email/i).fill('ewongagent@gmail.com')
  await page.getByPlaceholder(/password/i).fill('password123')

  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for navigation
  await page.waitForTimeout(3000)

  // Get localStorage keys after sign-in
  const keysAfterSignIn = await page.evaluate(() => {
    const keys: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('auth'))) {
        const value = localStorage.getItem(key)
        // Only show first 100 chars of value
        keys[key] = value ? value.substring(0, 100) + '...' : 'null'
      }
    }
    return keys
  })

  console.log('\nLocalStorage keys after sign-in:')
  for (const [key, value] of Object.entries(keysAfterSignIn)) {
    console.log(`  ${key}:`, value)
  }

  console.log('\n=== Storage Key Discovery Complete ===')
})
