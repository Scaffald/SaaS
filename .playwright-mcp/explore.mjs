import { chromium } from '@playwright/test'

async function explore() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  console.log('Starting exploration')

  try {
    await page.goto('http://localhost:8081/auth')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: '.playwright-mcp/step-01-auth.png', fullPage: true })
    
    const emailInput = page.getByPlaceholder(/email/i)
    await emailInput.fill('ewongagent@gmail.com')
    await page.screenshot({ path: '.playwright-mcp/step-02-email.png' })
    
    const sendButton = page.getByRole('button', { name: /send|continue|sign in/i })
    await sendButton.click()
    await page.waitForTimeout(2000)
    
    console.log('Waiting 30s for manual code entry from Mailpit')
    await page.waitForTimeout(30000)
    
    await page.waitForURL('**/dashboard**', { timeout: 60000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: '.playwright-mcp/step-03-dashboard.png', fullPage: true })
    
    await page.goto('http://localhost:8081/dashboard/profile')
    await page.waitForTimeout(3000)
    console.log('Current URL:', page.url())
    await page.screenshot({ path: '.playwright-mcp/step-04-profile.png', fullPage: true })
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    console.log('Headings:', headings)
    
    console.log('Browser open for 5 minutes - explore manually')
    await page.waitForTimeout(300000)

  } catch (error) {
    console.error('Error:', error)
    await page.screenshot({ path: '.playwright-mcp/error.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

explore().catch(console.error)
