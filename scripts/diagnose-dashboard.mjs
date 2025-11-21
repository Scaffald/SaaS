import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function diagnose() {
  console.log('🔍 Starting dashboard navigation diagnostic...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Log console messages
  page.on('console', (msg) => console.log(`[CONSOLE ${msg.type()}]`, msg.text()))

  // Log network requests
  page.on('request', (request) => console.log(`[REQUEST] ${request.url()}`))

  // Log errors
  page.on('pageerror', (err) => console.log(`[PAGE ERROR]`, err.message))

  try {
    console.log('Step 1: Authenticating as admin...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'ewongagent@gmail.com',
      password: 'password123',
    })

    if (error) throw error
    console.log('✅ Authentication successful\n')

    console.log('Step 2: Setting auth state in browser...')
    await page.goto('http://localhost:8081/')
    await page.evaluate(
      ({ session, user, url }) => {
        const hostname = new URL(url).hostname.replace(/\./g, '-').replace(/:/g, '-')
        const storageKey = `sb-${hostname}-auth-token`
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
            token_type: session.token_type,
            user: user,
          })
        )
      },
      { session: data.session, user: data.user, url: SUPABASE_URL }
    )
    console.log('✅ Auth state set\n')

    console.log('Step 3: Navigating to /dashboard with 60s timeout...')
    console.log('Watching for network activity and console logs...\n')

    const startTime = Date.now()
    await page.goto('http://localhost:8081/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
    const loadTime = Date.now() - startTime

    console.log(`\n✅ Dashboard loaded in ${loadTime}ms`)

    console.log('\nStep 4: Checking page content...')
    const bodyText = await page.locator('body').textContent()
    console.log(`Body contains ${bodyText?.length || 0} characters`)
    console.log(`URL: ${page.url()}`)

    await page.waitForTimeout(5000)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

diagnose()
