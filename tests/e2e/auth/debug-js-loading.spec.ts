import { ROUTES } from '@scf/core/constants/routes'
import { expect, test } from '@playwright/test'

const EXPO_BASE_URL = 'http://localhost:8081'
const OFFICE_PATH = ROUTES.OFFICE.path
const OFFICE_ORGANIZATIONS_PATH = ROUTES.OFFICE.CMS.ORGANIZATIONS.path
const OFFICE_JOBS_PATH = ROUTES.OFFICE.CMS.JOBS.path
const OFFICE_WORKERS_PATH = ROUTES.OFFICE.CMS.WORKERS.path

const OFFICE_URL = `${EXPO_BASE_URL}${OFFICE_PATH}`
const OFFICE_ORGANIZATIONS_URL = `${EXPO_BASE_URL}${OFFICE_ORGANIZATIONS_PATH}`
const OFFICE_JOBS_URL = `${EXPO_BASE_URL}${OFFICE_JOBS_PATH}`
const OFFICE_WORKERS_URL = `${EXPO_BASE_URL}${OFFICE_WORKERS_PATH}`
const ORGANIZATIONS_REGEX = new RegExp(escapeForRegex(OFFICE_ORGANIZATIONS_PATH))

test.use({ storageState: 'tests/.auth/super-admin.json' })

test('debug JS loading with console output', async ({ page }) => {
  // Capture console messages
  page.on('console', (msg) => console.log(`BROWSER [${msg.type()}]:`, msg.text()))

  // Capture page errors
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message))

  // Capture network errors
  page.on('requestfailed', (request) =>
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
  )

  console.log(`=== Navigating to ${OFFICE_ORGANIZATIONS_PATH} ===`)
  await page.goto(OFFICE_ORGANIZATIONS_URL)

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

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('debug authentication state loading', async ({ page }) => {
  console.log('\n=== AUTH DEBUG TEST START ===\n')

  // Capture console messages
  page.on('console', (msg) => console.log(`BROWSER [${msg.type()}]:`, msg.text()))

  // Capture page errors
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message))

  console.log(`=== Navigating to ${OFFICE_ORGANIZATIONS_PATH} ===`)
  await page.goto(OFFICE_ORGANIZATIONS_URL)

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
    const possibleKeys = ['sb-127-auth-token', 'supabase.auth.token', 'sb-localhost-auth-token']

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
      authTokenPreview: authToken ? authToken.substring(0, 200) + '...' : null,
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
      windowKeys: Object.keys(window).filter((k) => k.toLowerCase().includes('supabase')),
    }
  })

  console.log('SUPABASE STATE:')
  console.log('  Has Supabase instance:', supabaseState.hasSupabase)
  console.log('  Window keys with "supabase":', supabaseState.windowKeys)

  console.log('\n=== CHECKING CURRENT URL AND REDIRECTS ===\n')

  const currentUrl = page.url()
  console.log('  Current URL:', currentUrl)
  console.log('  Expected URL:', OFFICE_ORGANIZATIONS_URL)
  console.log('  URL matches:', currentUrl === OFFICE_ORGANIZATIONS_URL)

  console.log('\n=== CHECKING PAGE CONTENT ===\n')

  // Check #root content
  const rootContentLength = await page.locator('#root').evaluate((el) => el.innerHTML.length)
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

test('verify routing and route protection', async ({ page }) => {
  console.log('\n=== ROUTING VERIFICATION TEST START ===\n')

  // Track URL changes and redirects
  const urlHistory: string[] = []
  const redirects: Array<{ from: string; to: string }> = []

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url()
      urlHistory.push(url)
      if (urlHistory.length > 1) {
        redirects.push({
          from: urlHistory[urlHistory.length - 2],
          to: url,
        })
      }
      console.log(`NAVIGATED TO: ${url}`)
    }
  })

  // Capture console messages
  page.on('console', (msg) => console.log(`BROWSER [${msg.type()}]:`, msg.text()))

  // Test 1: Direct navigation to /office/organizations
  console.log('\n=== TEST 1: Direct Navigation ===\n')
  const targetUrl = OFFICE_ORGANIZATIONS_URL
  console.log(`Navigating directly to: ${targetUrl}`)

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })

  await page.waitForTimeout(3000) // Wait for React to initialize and any redirects

  const finalUrl1 = page.url()
  console.log(`Final URL after direct navigation: ${finalUrl1}`)
  console.log(`Expected URL: ${targetUrl}`)
  console.log(`URL matches: ${finalUrl1 === targetUrl}`)

  if (redirects.length > 0) {
    console.log('Redirects detected:')
    redirects.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.from} -> ${r.to}`)
    })
  }

  // Check if we're still on the expected route or were redirected
  const isOnExpectedRoute = finalUrl1.includes(OFFICE_ORGANIZATIONS_PATH)
  console.log(`On expected route: ${isOnExpectedRoute}`)

  if (!isOnExpectedRoute) {
    console.log(`WARNING: Redirected from ${OFFICE_ORGANIZATIONS_PATH} to ${finalUrl1}`)
  }

  // Check auth state persists
  const authAfterDirectNav = await page.evaluate(() => {
    const localStorageKeys = Object.keys(localStorage)
    const authKeys = localStorageKeys.filter((k) => k.includes('auth') || k.includes('supabase'))
    return {
      hasAuthKeys: authKeys.length > 0,
      authKeys: authKeys,
    }
  })
  console.log('Auth state after direct nav:', authAfterDirectNav)

  // Test 2: Programmatic navigation (simulate link click)
  console.log('\n=== TEST 2: Programmatic Navigation ===\n')
  urlHistory.length = 0
  redirects.length = 0

  // Navigate to office dashboard first
  console.log(`Navigating to ${OFFICE_PATH} first...`)
  await page.goto(OFFICE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const initialUrl = page.url()
  console.log(`Initial URL: ${initialUrl}`)

  // Now navigate programmatically to organizations
  console.log(`Programmatically navigating to ${OFFICE_ORGANIZATIONS_PATH}...`)
  urlHistory.length = 0
  redirects.length = 0

  await page.evaluate((path) => {
    window.location.href = path
  }, OFFICE_ORGANIZATIONS_PATH)

  // Wait for navigation
  await page.waitForURL(ORGANIZATIONS_REGEX, { timeout: 10000 }).catch(() => {
    console.log(`Timeout waiting for ${OFFICE_ORGANIZATIONS_PATH} URL`)
  })

  await page.waitForTimeout(2000)

  const finalUrl2 = page.url()
  console.log(`Final URL after programmatic navigation: ${finalUrl2}`)

  if (redirects.length > 0) {
    console.log('Redirects during programmatic nav:')
    redirects.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.from} -> ${r.to}`)
    })
  }

  const isOnExpectedRoute2 = finalUrl2.includes(OFFICE_ORGANIZATIONS_PATH)
  console.log(`On expected route after programmatic nav: ${isOnExpectedRoute2}`)

  // Check auth state persists after programmatic navigation
  const authAfterProgrammaticNav = await page.evaluate(() => {
    const localStorageKeys = Object.keys(localStorage)
    const authKeys = localStorageKeys.filter((k) => k.includes('auth') || k.includes('supabase'))
    return {
      hasAuthKeys: authKeys.length > 0,
      authKeys: authKeys,
    }
  })
  console.log('Auth state after programmatic nav:', authAfterProgrammaticNav)

  // Test 3: Check route protection - verify we can access office routes
  console.log('\n=== TEST 3: Route Protection Check ===\n')

  const officeRoutes = [
    OFFICE_PATH,
    OFFICE_ORGANIZATIONS_PATH,
    OFFICE_JOBS_PATH,
    OFFICE_WORKERS_PATH,
  ]

  for (const route of officeRoutes) {
    console.log(`\nTesting route: ${route}`)
    urlHistory.length = 0
    redirects.length = 0

    await page.goto(`http://localhost:8081${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const routeUrl = page.url()
    const isAccessible = routeUrl.includes(route) || routeUrl.includes(OFFICE_PATH)
    const wasRedirected = !routeUrl.includes(route) && routeUrl !== `http://localhost:8081${route}`

    console.log(`  Final URL: ${routeUrl}`)
    console.log(`  Accessible: ${isAccessible}`)
    console.log(`  Was redirected: ${wasRedirected}`)

    if (wasRedirected && redirects.length > 0) {
      console.log(`  Redirected from ${route} to: ${routeUrl}`)
    }

    // Check for access denied messages
    const accessDenied = await page
      .getByText(/access denied|unauthorized|forbidden|sign in/i)
      .first()
      .isVisible()
      .catch(() => false)

    console.log(`  Access denied message visible: ${accessDenied}`)
  }

  // Test 4: Verify root content is rendered
  console.log('\n=== TEST 4: Root Content Check ===\n')

  await page.goto(OFFICE_ORGANIZATIONS_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const rootContent = await page.locator('#root').innerHTML()
  const rootContentLength = rootContent.length
  const hasSubstantialContent = rootContentLength > 500

  console.log(`Root content length: ${rootContentLength}`)
  console.log(`Has substantial content (>500 bytes): ${hasSubstantialContent}`)

  if (!hasSubstantialContent) {
    console.log(`WARNING: Root content is too small (${rootContentLength} bytes)`)
    console.log(`Root content preview: ${rootContent.substring(0, 200)}`)
  }

  // Check for specific elements
  const hasOrganizationsTable = await page
    .locator('[data-testid="organizations-table"]')
    .count()
    .then((count) => count > 0)
    .catch(() => false)

  const hasCreateButton = await page
    .getByRole('button', { name: /create organization/i })
    .count()
    .then((count) => count > 0)
    .catch(() => false)

  console.log(`Has organizations table: ${hasOrganizationsTable}`)
  console.log(`Has create button: ${hasCreateButton}`)

  console.log('\n=== ROUTING VERIFICATION TEST COMPLETE ===\n')

  // Take a screenshot for debugging
  await page.screenshot({ path: '.playwright-mcp/admin-debug-routing.png', fullPage: true })
  console.log('Screenshot saved to: .playwright-mcp/admin-debug-routing.png')
})
