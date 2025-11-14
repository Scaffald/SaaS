/**
 * Quick script to create super-admin auth state file for tests
 * Run: pnpm tsx scripts/create-super-admin-auth.ts
 */

import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_DIR = path.join(process.cwd(), 'tests', '.auth')
const AUTH_FILE = path.join(AUTH_DIR, 'super-admin.json')

async function createSuperAdminAuth() {
  console.log('🔐 Creating super admin authentication state...')

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const email = 'zach@unicorn.love'
  const password = 'password123'
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

  try {
    // Navigate to auth page
    await page.goto('http://localhost:8081/auth', { waitUntil: 'domcontentloaded' })

    // Sign in via Supabase client in browser
    await page.evaluate(
      async ({ supabaseUrl, supabaseKey, email, password }) => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new Error(`Sign-in failed: ${error.message}`)
        }
      },
      { supabaseUrl, supabaseKey, email, password }
    )

    console.log('✓ Authentication successful')

    // Navigate to dashboard to verify auth
    await page.goto('http://localhost:8081/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Save storage state
    await context.storageState({ path: AUTH_FILE })
    console.log(`✅ Super admin auth state saved to ${AUTH_FILE}`)

    await browser.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to create auth state:', error)
    await browser.close()
    process.exit(1)
  }
}

createSuperAdminAuth()

