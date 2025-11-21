import { test } from '@playwright/test'
import { getSession } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

/**
 * Debug localStorage format to understand what Supabase expects
 */
test('debug localStorage format', async ({ page }) => {
  // Get a real session from Supabase API
  const data = await getSession('ewongagent@gmail.com', 'password123')

  console.log('\n=== Session from API ===')
  console.log('Access token (first 50 chars):', data.session.access_token.substring(0, 50) + '...')
  console.log(
    'Refresh token (first 50 chars):',
    data.session.refresh_token?.substring(0, 50) + '...'
  )
  console.log('Expires at:', data.session.expires_at)
  console.log('User ID:', data.user.id)

  // Navigate to app
  await page.goto('http://localhost:8081/')
  await page.waitForLoadState('domcontentloaded')

  // Set localStorage with our current format
  await page.evaluate(
    ({ session, user }) => {
      const storageKey = 'sb-127-0-0-1-auth-token'
      const authData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: user,
      }
      localStorage.setItem(storageKey, JSON.stringify(authData))
      console.log('[SET] Stored in localStorage key:', storageKey)
      console.log('[SET] Data keys:', Object.keys(authData))
    },
    { session: data.session, user: data.user }
  )

  // Reload page
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Check what's in localStorage after reload
  const storageCheck = await page.evaluate(() => {
    const result: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            result[key] = {
              type: typeof parsed,
              keys: typeof parsed === 'object' ? Object.keys(parsed) : [],
              hasAccessToken: parsed.access_token ? 'yes' : 'no',
              hasUser: parsed.user ? 'yes' : 'no',
            }
          } catch {
            result[key] = 'not JSON'
          }
        }
      }
    }
    return result
  })

  console.log('\n=== LocalStorage after reload ===')
  for (const [key, value] of Object.entries(storageCheck)) {
    console.log(`\nKey: ${key}`)
    console.log('  ', JSON.stringify(value, null, 2))
  }

  // Check if Supabase has a session
  const hasSession = await page.evaluate(() => {
    // @ts-expect-error
    return !!window.location.pathname
  })

  console.log('\n=== Current Page ===')
  console.log('URL:', await page.url())
  console.log('Path:', await page.evaluate(() => window.location.pathname))
})
