import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/.auth/super-admin.json' })

test('debug JS loading with console output', async ({ page }) => {
  // Capture console messages
  page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()))

  // Capture page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message))

  // Capture network errors
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
  )

  console.log('=== Navigating to /office/organizations ===')
  await page.goto('http://localhost:8081/office/organizations')

  console.log('=== Waiting 10 seconds for JS to load ===')
  await page.waitForTimeout(10000)

  // Check what we got
  const bodyText = await page.locator('body').textContent()
  console.log('BODY TEXT:', bodyText?.substring(0, 200))

  // Check if root element has content
  const rootContent = await page.locator('#root').innerHTML()
  console.log('ROOT HTML LENGTH:', rootContent.length)
  console.log('ROOT HTML PREVIEW:', rootContent.substring(0, 500))

  // Wait for network to be idle
  console.log('=== Waiting for network idle ===')
  await page.waitForLoadState('networkidle', { timeout: 30000 })

  console.log('=== Test complete ===')
})

test('debug authentication state loading', async ({ page }) => {
  console.log('\n=== AUTH DEBUG TEST START ===\n')

  // Capture console messages
  page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()))

  // Capture page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message))

  console.log('=== Navigating to /office/organizations ===')
  await page.goto('http://localhost:8081/office/organizations')

  // Wait for React to initialize
  await page.waitForTimeout(5000)

  console.log('\n=== CHECKING AUTHENTICATION STATE ===\n')

  // Check localStorage for auth token
  const authState = await page.evaluate(() => {
    const localStorageKeys = Object.keys(localStorage)
    const sessionStorageKeys = Object.keys(sessionStorage)

    // Try to get the auth token (might be different key)
    let authToken = null
    let authTokenKey = null

    // Check common Supabase auth key patterns
    const possibleKeys = [
      'sb-127-auth-token',
      'supabase.auth.token',
      'sb-localhost-auth-token'
    ]

    for (const key of localStorageKeys) {
      if (key.includes('auth') || key.includes('supabase')) {
        authTokenKey = key
        try {
          authToken = localStorage.getItem(key)
        } catch (e) {
          authToken = 'Error reading token'
        }
        break
      }
    }

    return {
      localStorageKeys: localStorageKeys,
      sessionStorageKeys: sessionStorageKeys,
      authTokenKey: authTokenKey,
      hasAuthToken: !!authToken,
      authTokenLength: authToken ? authToken.length : 0,
      authTokenPreview: authToken ? authToken.substring(0, 200) + '...' : null
    }
  })

  console.log('AUTH STATE:')
  console.log('  localStorage keys:', authState.localStorageKeys)
  console.log('  sessionStorage keys:', authState.sessionStorageKeys)
  console.log('  Auth token key:', authState.authTokenKey)
  console.log('  Has auth token:', authState.hasAuthToken)
  console.log('  Auth token length:', authState.authTokenLength)
  console.log('  Auth token preview:', authState.authTokenPreview)

  console.log('\n=== CHECKING SUPABASE CLIENT STATE ===\n')

  // Check if Supabase client is initialized and has user
  const supabaseState = await page.evaluate(() => {
    // Try to access Supabase client via window
    const hasSupabase = typeof (window as any).__supabase !== 'undefined'
    return {
      hasSupabase: hasSupabase,
      windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('supabase'))
    }
  })

  console.log('SUPABASE STATE:')
  console.log('  Has Supabase instance:', supabaseState.hasSupabase)
  console.log('  Window keys with "supabase":', supabaseState.windowKeys)

  console.log('\n=== CHECKING CURRENT URL AND REDIRECTS ===\n')

  const currentUrl = page.url()
  console.log('  Current URL:', currentUrl)
  console.log('  Expected URL:', 'http://localhost:8081/office/organizations')
  console.log('  URL matches:', currentUrl === 'http://localhost:8081/office/organizations')

  console.log('\n=== CHECKING PAGE CONTENT ===\n')

  // Check #root content
  const rootContentLength = await page.locator('#root').evaluate(el => el.innerHTML.length)
  const rootHasContent = rootContentLength > 500

  console.log('  #root content length:', rootContentLength)
  console.log('  #root has substantial content (>500 bytes):', rootHasContent)

  // Check for error messages
  const errorElements = await page.locator('[role="alert"]').count()
  console.log('  Error alert elements:', errorElements)

  if (errorElements > 0) {
    const errorText = await page.locator('[role="alert"]').first().textContent()
    console.log('  Error text:', errorText)
  }

  // Check for specific office layout elements
  const hasLayout = await page.locator('[data-testid="office-layout"]').count()
  const hasTable = await page.locator('[data-testid="organizations-table"]').count()
  const hasHeader = await page.locator('h1').count()

  console.log('  Has office layout:', hasLayout > 0)
  console.log('  Has organizations table:', hasTable > 0)
  console.log('  Has h1 header:', hasHeader > 0)

  if (hasHeader > 0) {
    const headerText = await page.locator('h1').first().textContent()
    console.log('  Header text:', headerText)
  }

  console.log('\n=== AUTH DEBUG TEST COMPLETE ===\n')

  // Take a screenshot for debugging
  await page.screenshot({ path: '.playwright-mcp/admin-debug-auth-state.png', fullPage: true })
  console.log('Screenshot saved to: .playwright-mcp/admin-debug-auth-state.png')
})
