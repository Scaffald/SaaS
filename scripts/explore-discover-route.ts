/**
 * Script to explore /dashboard/discover route as admin user
 * Uses Playwright to navigate and document UI elements
 */

import { type Browser, chromium, type Page } from '@playwright/test'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { signInAsAdmin } from '../tests/playwright-helpers/auth'

async function exploreDiscoverRoute() {
  let browser: Browser | null = null

  try {
    // Launch browser
    browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({
      baseURL: 'http://localhost:8082',
    })
    const page = await context.newPage()

    console.log('🔐 Signing in as admin user...')
    await signInAsAdmin(page)

    console.log('📍 Navigating to /dashboard/discover...')
    await page.goto('http://localhost:8082/dashboard/discover', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for page to fully load
    await page.waitForTimeout(3000)

    console.log('📸 Taking screenshot...')
    const screenshotPath = join(process.cwd(), '.playwright-mcp', 'admin-discover-route.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Screenshot saved: ${screenshotPath}`)

    console.log('🔍 Extracting page structure...')
    const snapshot = await page.accessibility.snapshot()

    // Get all visible elements
    const elements = await page.evaluate(() => {
      const results: any[] = []

      // Find all interactive elements
      const buttons = Array.from(document.querySelectorAll('button'))
      const links = Array.from(document.querySelectorAll('a'))
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))

      buttons.forEach((el) => {
        if (el.offsetParent !== null) {
          results.push({
            type: 'button',
            text: el.textContent?.trim(),
            ariaLabel: el.getAttribute('aria-label'),
            role: el.getAttribute('role'),
          })
        }
      })

      links.forEach((el) => {
        if (el.offsetParent !== null) {
          results.push({
            type: 'link',
            text: el.textContent?.trim(),
            href: el.getAttribute('href'),
            ariaLabel: el.getAttribute('aria-label'),
          })
        }
      })

      inputs.forEach((el) => {
        if (el.offsetParent !== null) {
          results.push({
            type: 'input',
            inputType: el.getAttribute('type') || el.tagName.toLowerCase(),
            placeholder: el.getAttribute('placeholder'),
            ariaLabel: el.getAttribute('aria-label'),
            name: el.getAttribute('name'),
          })
        }
      })

      headings.forEach((el) => {
        if (el.offsetParent !== null) {
          results.push({
            type: 'heading',
            level: el.tagName,
            text: el.textContent?.trim(),
          })
        }
      })

      return results
    })

    // Get page info
    const pageInfo = {
      url: page.url(),
      title: await page.title(),
      timestamp: new Date().toISOString(),
      elements: elements,
      accessibilityTree: snapshot,
    }

    // Save report
    const reportPath = join(
      process.cwd(),
      'docs',
      'testing',
      'admin-discover-route-exploration.json'
    )
    writeFileSync(reportPath, JSON.stringify(pageInfo, null, 2))
    console.log(`✅ Report saved: ${reportPath}`)

    console.log('\n📊 Summary:')
    console.log(`- URL: ${pageInfo.url}`)
    console.log(`- Title: ${pageInfo.title}`)
    console.log(`- Buttons: ${elements.filter((e) => e.type === 'button').length}`)
    console.log(`- Links: ${elements.filter((e) => e.type === 'link').length}`)
    console.log(`- Inputs: ${elements.filter((e) => e.type === 'input').length}`)
    console.log(`- Headings: ${elements.filter((e) => e.type === 'heading').length}`)

    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for 30 seconds for manual inspection...')
    await page.waitForTimeout(30000)
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the script
exploreDiscoverRoute()
  .then(() => {
    console.log('✅ Exploration complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Exploration failed:', error)
    process.exit(1)
  })
