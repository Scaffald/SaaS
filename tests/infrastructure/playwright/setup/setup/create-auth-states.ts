/**
 * Standalone script to create authentication state files
 * Run this manually once to generate the auth state files that tests will reuse
 *
 * Usage: node tests/setup/create-auth-states.ts
 */

import { chromium } from 'playwright'
import { getSession } from '../playwright-helpers/auth'

async function createAuthStates() {
  console.log('🚀 Creating authentication state files...\n')

  const browser = await chromium.launch({ headless: false })

  // 1. Create Admin Auth State
  try {
    console.log('1️⃣  Creating admin authentication state...')
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    // Get session via API (this works)
    const adminSession = await getSession('ewongagent@gmail.com', 'password123')

    // Navigate to the app
    await adminPage.goto('http://localhost:8081/')
    await adminPage.waitForLoadState('domcontentloaded')

    // Set the session in localStorage using the CORRECT method
    await adminPage.evaluate((sessionData) => {
      // Store session in localStorage with all Supabase keys
      const keys = Object.keys(localStorage)

      // Find the Supabase auth key (it varies by hostname)
      let authKey = keys.find(k => k.includes('sb-') && k.includes('-auth-token'))

      if (!authKey) {
        // Create the key based on current hostname
        const hostname = window.location.hostname.replace(/\./g, '-')
        authKey = `sb-${hostname}-auth-token`
      }

      localStorage.setItem(authKey, JSON.stringify(sessionData))
      console.log('[SETUP] Stored session in key:', authKey)
    }, {
      access_token: adminSession.session.access_token,
      refresh_token: adminSession.session.refresh_token,
      expires_at: adminSession.session.expires_at,
      expires_in: adminSession.session.expires_in,
      token_type: adminSession.session.token_type,
      user: adminSession.user,
    })

    // Reload to let Supabase read the session
    await adminPage.reload({ waitUntil: 'domcontentloaded' })
    await adminPage.waitForTimeout(2000)

    // Try navigating to dashboard
    await adminPage.goto('http://localhost:8081/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await adminPage.waitForTimeout(3000)

    const adminUrl = adminPage.url()
    if (!adminUrl.includes('/dashboard')) {
      console.log(`⚠️  Warning: Admin ended up at ${adminUrl} instead of /dashboard`)
      console.log('   This might still work for tests, saving anyway...')
    }

    // Save the state
    await adminContext.storageState({ path: 'tests/.auth/admin.json' })
    console.log('✅ Admin auth state saved to tests/.auth/admin.json\n')

    await adminContext.close()
  } catch (error) {
    console.error('❌ Failed to create admin auth state:', error)
  }

  // 2. Create Regular User Auth State
  try {
    console.log('2️⃣  Creating user authentication state...')
    const userContext = await browser.newContext()
    const userPage = await userContext.newPage()

    // Use the correct test user email from README
    const userSession = await getSession('lexis.salah@eths.education.com', 'password123')

    await userPage.goto('http://localhost:8081/')
    await userPage.waitForLoadState('domcontentloaded')

    await userPage.evaluate((sessionData) => {
      const keys = Object.keys(localStorage)
      let authKey = keys.find(k => k.includes('sb-') && k.includes('-auth-token'))

      if (!authKey) {
        const hostname = window.location.hostname.replace(/\./g, '-')
        authKey = `sb-${hostname}-auth-token`
      }

      localStorage.setItem(authKey, JSON.stringify(sessionData))
    }, {
      access_token: userSession.session.access_token,
      refresh_token: userSession.session.refresh_token,
      expires_at: userSession.session.expires_at,
      expires_in: userSession.session.expires_in,
      token_type: userSession.session.token_type,
      user: userSession.user,
    })

    await userPage.reload({ waitUntil: 'domcontentloaded' })
    await userPage.waitForTimeout(2000)

    await userPage.goto('http://localhost:8081/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await userPage.waitForTimeout(3000)

    await userContext.storageState({ path: 'tests/.auth/user.json' })
    console.log('✅ User auth state saved to tests/.auth/user.json\n')

    await userContext.close()
  } catch (error) {
    console.error('❌ Failed to create user auth state:', error)
  }

  // 3. Create Super Admin Auth State
  try {
    console.log('3️⃣  Creating super admin authentication state...')
    const superContext = await browser.newContext()
    const superPage = await superContext.newPage()

    const superSession = await getSession('zach@unicorn.love', 'password123')

    await superPage.goto('http://localhost:8081/')
    await superPage.waitForLoadState('domcontentloaded')

    await superPage.evaluate((sessionData) => {
      const keys = Object.keys(localStorage)
      let authKey = keys.find(k => k.includes('sb-') && k.includes('-auth-token'))

      if (!authKey) {
        const hostname = window.location.hostname.replace(/\./g, '-')
        authKey = `sb-${hostname}-auth-token`
      }

      localStorage.setItem(authKey, JSON.stringify(sessionData))
    }, {
      access_token: superSession.session.access_token,
      refresh_token: superSession.session.refresh_token,
      expires_at: superSession.session.expires_at,
      expires_in: superSession.session.expires_in,
      token_type: superSession.session.token_type,
      user: superSession.user,
    })

    await superPage.reload({ waitUntil: 'domcontentloaded' })
    await superPage.waitForTimeout(2000)

    await superPage.goto('http://localhost:8081/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await superPage.waitForTimeout(3000)

    await superContext.storageState({ path: 'tests/.auth/super-admin.json' })
    console.log('✅ Super admin auth state saved to tests/.auth/super-admin.json\n')

    await superContext.close()
  } catch (error) {
    console.error('❌ Failed to create super admin auth state:', error)
  }

  await browser.close()

  console.log('🎉 Auth state creation complete!')
  console.log('\nNext steps:')
  console.log('1. Check that .json files exist in tests/.auth/')
  console.log('2. Run tests with: pnpm exec playwright test --project=chromium')
  console.log('3. Tests will automatically use the saved authentication states')
}

createAuthStates().catch(console.error)
