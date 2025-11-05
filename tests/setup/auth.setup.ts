import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/.auth/admin.json'
const userFile = 'tests/.auth/user.json'
const superAdminFile = 'tests/.auth/super-admin.json'

/**
 * Setup: Authenticate as admin and save storage state
 * This runs once before all tests to create a reusable authentication state
 */
setup('authenticate as admin', async ({ page }) => {
  console.log('🔐 Setting up admin authentication...')

  // Navigate to auth page
  await page.goto('http://localhost:8081/auth')
  await page.waitForLoadState('domcontentloaded')

  // Sign in via API (faster than UI)
  const email = 'ewongagent@gmail.com'
  const password = 'password123'
  // Use localhost Supabase (from .env file)
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!data.access_token) {
    throw new Error(`Admin authentication failed: ${JSON.stringify(data)}`)
  }

  console.log('✓ API authentication successful')

  // Set the session in the browser using Supabase's sign-in
  await page.evaluate(
    async ({ supabaseUrl, supabaseKey, email, password }) => {
      // Import Supabase client in the browser context
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Sign in - this properly initializes Supabase's session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(`Browser sign-in failed: ${error.message}`)
      }

      console.log('[SETUP] Browser session initialized')
    },
    { supabaseUrl, supabaseKey, email, password }
  )

  console.log('✓ Browser session initialized')

  // Navigate to dashboard to verify auth works
  await page.goto('http://localhost:8081/dashboard')
  await page.waitForLoadState('networkidle', { timeout: 30000 })

  // Verify we're authenticated (not redirected to /auth)
  await expect(page).toHaveURL(/dashboard/)

  console.log('✓ Authentication verified')

  // Wait a bit for Supabase to fully settle
  await page.waitForTimeout(2000)

  // Save the authenticated state
  await page.context().storageState({ path: authFile })

  console.log(`✅ Admin authentication state saved to ${authFile}`)
})

/**
 * Setup: Authenticate as regular user and save storage state
 */
setup('authenticate as user', async ({ page }) => {
  console.log('🔐 Setting up user authentication...')

  const email = 'testuser1@example.com'
  const password = 'TestUser123!'
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  await page.goto('http://localhost:8081/auth')

  await page.evaluate(
    async ({ supabaseUrl, supabaseKey, email, password }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error(`User sign-in failed: ${error.message}`)
    },
    { supabaseUrl, supabaseKey, email, password }
  )

  await page.goto('http://localhost:8081/dashboard')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await expect(page).toHaveURL(/dashboard/)
  await page.waitForTimeout(2000)

  await page.context().storageState({ path: userFile })

  console.log(`✅ User authentication state saved to ${userFile}`)
})

/**
 * Setup: Authenticate as super admin and save storage state
 */
setup('authenticate as super admin', async ({ page }) => {
  console.log('🔐 Setting up super admin authentication...')

  const email = 'zach@unicorn.love'
  const password = 'password123'
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  await page.goto('http://localhost:8081/auth')

  await page.evaluate(
    async ({ supabaseUrl, supabaseKey, email, password }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw new Error(`Super admin sign-in failed: ${error.message}`)
    },
    { supabaseUrl, supabaseKey, email, password }
  )

  await page.goto('http://localhost:8081/dashboard')
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await expect(page).toHaveURL(/dashboard/)
  await page.waitForTimeout(2000)

  await page.context().storageState({ path: superAdminFile })

  console.log(`✅ Super admin authentication state saved to ${superAdminFile}`)
})
