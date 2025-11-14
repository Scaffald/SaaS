import { test, expect } from '@playwright/test'

/**
 * Debug test to isolate authentication timeout issue
 * This test adds enhanced logging to identify where the auth flow fails
 */
test.describe('Debug Authentication Flow', () => {
  test('should debug signIn and dashboard navigation', async ({ page }) => {
    // Enable verbose console logging
    page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))
    page.on('pageerror', (err) => console.error('[PAGE ERROR]:', err.message))

    const email = 'ewongagent@gmail.com'
    const password = 'password123'
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'

    console.log('\n=== Step 1: API Sign In ===')
    const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const authData = await signInResponse.json()
    console.log('Sign in response status:', signInResponse.status)
    console.log('Has access token:', !!authData.access_token)
    console.log('Has user:', !!authData.user)

    if (!authData.access_token) {
      throw new Error(`Sign in failed: ${JSON.stringify(authData)}`)
    }

    console.log('\n=== Step 2: Navigate to Root (/) ===')
    await page.goto('http://localhost:8081/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })
    console.log('Root page loaded successfully')
    await page.screenshot({ path: '.playwright-mcp/debug-01-root-page.png', fullPage: true })

    console.log('\n=== Step 3: Set LocalStorage Auth ===')
    await page.evaluate(
      ({ accessToken, refreshToken, expiresIn, user }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
        const authState = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
          expires_at: expiresAt,
          user: user,
        }
        localStorage.setItem(
          'sb-localhost-auth-token',
          JSON.stringify(authState)
        )
        console.log('[BROWSER] Auth state set in localStorage')
      },
      {
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiresIn: authData.expires_in,
        user: authData.user,
      }
    )
    console.log('Auth tokens stored in localStorage')

    console.log('\n=== Step 4: Navigate to Dashboard (/dashboard) ===')
    console.log('Attempting to navigate to /dashboard with 60s timeout...')

    // Try with increased timeout and different wait strategies
    try {
      await page.goto('http://localhost:8081/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
      console.log('✅ Dashboard page loaded successfully!')
      await page.screenshot({ path: '.playwright-mcp/debug-02-dashboard.png', fullPage: true })
    } catch (error) {
      console.error('❌ Dashboard navigation failed:', error)
      await page.screenshot({ path: '.playwright-mcp/debug-02-dashboard-ERROR.png', fullPage: true })

      // Try to get more info about the page state
      console.log('\n=== Page State at Failure ===')
      console.log('Current URL:', page.url())
      console.log('Page title:', await page.title())

      throw error
    }

    console.log('\n=== Step 5: Wait for Auth Initialization ===')
    await page.waitForTimeout(2000)
    console.log('Auth initialization wait complete')

    console.log('\n=== Step 6: Verify Dashboard Elements ===')
    await page.screenshot({ path: '.playwright-mcp/debug-03-final.png', fullPage: true })

    // Check if we're actually on the dashboard
    console.log('Final URL:', page.url())
    expect(page.url()).toContain('/dashboard')
  })

  test('should test direct dashboard navigation without auth', async ({ page }) => {
    console.log('\n=== Testing Direct Dashboard Navigation (No Auth) ===')

    page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))
    page.on('pageerror', (err) => console.error('[PAGE ERROR]:', err.message))

    try {
      await page.goto('http://localhost:8081/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
      console.log('✅ Dashboard loaded (should redirect to login)')
      console.log('Final URL:', page.url())
      await page.screenshot({ path: '.playwright-mcp/debug-04-no-auth.png', fullPage: true })
    } catch (error) {
      console.error('❌ Dashboard navigation failed even without auth:', error)
      await page.screenshot({ path: '.playwright-mcp/debug-04-no-auth-ERROR.png', fullPage: true })
      console.log('Current URL:', page.url())
      throw error
    }
  })

  test('should test root navigation timing', async ({ page }) => {
    console.log('\n=== Testing Root Navigation Performance ===')

    page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))
    page.on('pageerror', (err) => console.error('[PAGE ERROR]:', err.message))

    const startTime = Date.now()
    await page.goto('http://localhost:8081/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })
    const loadTime = Date.now() - startTime

    console.log(`✅ Root page loaded in ${loadTime}ms`)
    await page.screenshot({ path: '.playwright-mcp/debug-05-root-timing.png', fullPage: true })
  })
})
