import type { Page } from '@playwright/test'

/**
 * Read the current Supabase user id from storage in the test browser context.
 * Returns null if not present.
 */
export async function getCurrentUserId(page: Page): Promise<string | null> {
  const userJson = await page.evaluate(() => {
    const raw = localStorage.getItem('supabase.auth.user') || sessionStorage.getItem('supabase.auth.user')
    return raw ?? null
  })
  if (!userJson) return null
  try {
    const parsed = JSON.parse(userJson)
    return parsed?.id ?? null
  } catch {
    return null
  }
}

/**
 * Resolve a usable userId for tests. Tries the logged-in user, falls back to '1'.
 */
export async function resolveTestUserId(page: Page): Promise<string> {
  const current = await getCurrentUserId(page)
  return current ?? '1'
}
