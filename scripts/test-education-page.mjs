import { chromium } from 'playwright'

async function captureEducationPage() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Sign in as admin
    await page.goto('http://localhost:8082/auth')
    await page.fill('input[type="email"]', 'ewongagent@gmail.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Navigate to education
    console.log('Navigating to /dashboard/profile/education...')
    await page.goto('http://localhost:8082/dashboard/profile/education', {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(3000)

    console.log('Current URL:', page.url())

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-015-dashboard-profile-education.png',
      fullPage: true,
    })
    console.log('Screenshot saved')

    // Get page content
    const content = await page.locator('body').textContent()
    console.log('Page content length:', content?.length)
    console.log('Contains "Education":', content?.includes('Education'))
    console.log('Contains "University":', content?.includes('University'))
    console.log('Contains "Degree":', content?.includes('Degree'))
  } catch (error) {
    console.error('Error:', error.message)
    await page.screenshot({ path: '.playwright-mcp/admin-015-error.png' })
  } finally {
    await browser.close()
  }
}

captureEducationPage()
