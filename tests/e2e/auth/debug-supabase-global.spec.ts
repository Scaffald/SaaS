import { test } from '@playwright/test'

/**
 * Test if Supabase client is available as window.supabase
 */
test('check if window.supabase is available', async ({ page }) => {
  await page.goto('http://localhost:8081/')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)

  const hasSupabase = await page.evaluate(() => {
    // @ts-expect-error
    return typeof window.supabase !== 'undefined'
  })

  console.log('window.supabase available:', hasSupabase)

  if (hasSupabase) {
    console.log('✅ Supabase client is available globally')
  } else {
    console.log('❌ Supabase client is NOT available globally')
    console.log('Need to expose it or use different approach')
  }
})
