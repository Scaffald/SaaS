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
