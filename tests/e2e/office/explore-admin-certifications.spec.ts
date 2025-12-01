/**
 * EXPLORATION SCRIPT for Admin /dashboard/profile/certifications
 * Task ID: f84f77ca-059e-4f1a-b740-36b777d4ce21
 *
 * This script explores the certifications management interface for admin users
 * to document all UI elements, interactions, and features for comprehensive test creation.
 */

import { expect, type Page, test } from '@playwright/test'
import { writeFileSync } from 'fs'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

test.describe('EXPLORATION • Admin /dashboard/profile/certifications', () => {
  test('explore certifications management interface', async ({ page }: { page: Page }) => {
    const findings: any = {
      taskId: 'f84f77ca-059e-4f1a-b740-36b777d4ce21',
      route: '/dashboard/profile/certifications',
      user: 'Admin (ewongagent@gmail.com)',
      timestamp: new Date().toISOString(),
      explorationResults: {
        pageStructure: {},
        uiElements: {},
        interactions: {},
        forms: {},
        validation: {},
        navigation: {},
        dataDisplay: {},
        issues: [],
      },
    }

    console.log('🔍 Starting exploration of /dashboard/profile/certifications as admin...')

    // Step 1: Authenticate as admin (handles auth + navigation to /dashboard + profile completion)
    console.log('📝 Step 1: Authenticating as admin...')
    await signInAsAdmin(page)

    // Step 2: Navigate to certifications route
    console.log('📝 Step 2: Navigating to /dashboard/profile/certifications...')
    await page.goto('/dashboard/profile/certifications', { waitUntil: 'domcontentloaded' })

    // Verify we're on the correct route
    expect(page.url()).toContain('/dashboard/profile/certifications')
    findings.explorationResults.pageStructure.url = page.url()

    // Wait for loading states to complete
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(2000)

    // Step 3: Capture page structure
    console.log('📝 Step 3: Analyzing page structure...')
    const pageContent = (await page.locator('body').textContent()) || ''
    findings.explorationResults.pageStructure.hasContent = pageContent.length > 0
    findings.explorationResults.pageStructure.contentLength = pageContent.length

    // Take initial screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-certifications-01-initial.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: admin-certifications-01-initial.png')

    // Step 4: Identify all headings
    console.log('📝 Step 4: Identifying headings...')
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    findings.explorationResults.pageStructure.headings = headings
    console.log('Found headings:', headings)

    // Step 5: Identify all buttons
    console.log('📝 Step 5: Identifying buttons...')
    const buttons = await page.locator('button, [role="button"]').evaluateAll((btns) =>
      btns.map((btn) => ({
        text: btn.textContent?.trim(),
        type: btn.getAttribute('type'),
        disabled: btn.hasAttribute('disabled'),
        ariaLabel: btn.getAttribute('aria-label'),
      }))
    )
    findings.explorationResults.uiElements.buttons = buttons
    console.log('Found buttons:', buttons)

    // Step 6: Identify all links
    console.log('📝 Step 6: Identifying links...')
    const links = await page.locator('a').evaluateAll((lnks) =>
      lnks.map((lnk) => ({
        text: lnk.textContent?.trim(),
        href: lnk.getAttribute('href'),
      }))
    )
    findings.explorationResults.uiElements.links = links
    console.log('Found links:', links)

    // Step 7: Identify form inputs
    console.log('📝 Step 7: Identifying form inputs...')
    const inputs = await page.locator('input, textarea, select').evaluateAll((inputs) =>
      inputs.map((input) => ({
        type: input.getAttribute('type'),
        name: input.getAttribute('name'),
        placeholder: input.getAttribute('placeholder'),
        required: input.hasAttribute('required'),
        tagName: input.tagName,
      }))
    )
    findings.explorationResults.forms.inputs = inputs
    console.log('Found inputs:', inputs)

    // Step 8: Check for "Add" or "Create" button
    console.log('📝 Step 8: Looking for Add/Create certification button...')
    const addButtonSelectors = [
      'button:has-text("Add")',
      'button:has-text("Create")',
      'button:has-text("New")',
      '[role="button"]:has-text("Add")',
      '[role="button"]:has-text("Create")',
      '[role="button"]:has-text("New")',
    ]

    let addButton = null
    for (const selector of addButtonSelectors) {
      const btn = page.locator(selector).first()
      if (await btn.isVisible().catch(() => false)) {
        addButton = selector
        findings.explorationResults.interactions.addButtonFound = true
        findings.explorationResults.interactions.addButtonSelector = selector
        console.log('✅ Found add button with selector:', selector)

        // Take screenshot before clicking
        await page.screenshot({
          path: '.playwright-mcp/admin-certifications-02-before-add.png',
          fullPage: true,
        })

        // Click the add button
        console.log('📝 Clicking add button...')
        await btn.click()
        await page.waitForTimeout(1500)

        // Take screenshot after clicking
        await page.screenshot({
          path: '.playwright-mcp/admin-certifications-03-after-add-click.png',
          fullPage: true,
        })
        console.log('📸 Screenshot saved: admin-certifications-03-after-add-click.png')

        // Check for modal/form
        const modalVisible = await page
          .locator('[role="dialog"], .modal, [data-testid="modal"]')
          .isVisible()
          .catch(() => false)
        findings.explorationResults.interactions.modalOpened = modalVisible

        if (modalVisible) {
          console.log('✅ Modal/dialog opened')

          // Capture modal form fields
          const modalInputs = await page
            .locator(
              '[role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select, .modal input, .modal textarea, .modal select'
            )
            .evaluateAll((inputs) =>
              inputs.map((input) => ({
                type: input.getAttribute('type'),
                name: input.getAttribute('name'),
                placeholder: input.getAttribute('placeholder'),
                required: input.hasAttribute('required'),
                tagName: input.tagName,
              }))
            )
          findings.explorationResults.forms.modalInputs = modalInputs
          console.log('Modal inputs:', modalInputs)
        }

        break
      }
    }

    if (!addButton) {
      console.log('⚠️  No add button found')
      findings.explorationResults.interactions.addButtonFound = false
    }

    // Step 9: Check for existing certifications list
    console.log('📝 Step 9: Looking for existing certifications...')
    const certificationItems = await page
      .locator('[data-testid*="certification"], .certification-item, li')
      .count()
    findings.explorationResults.dataDisplay.certificationItemsCount = certificationItems
    console.log('Found certification items:', certificationItems)

    // Step 10: Check for empty state
    console.log('📝 Step 10: Checking for empty state...')
    const emptyStateText = ['No certifications', 'Add your first', 'Get started', 'No items']
    let emptyStateFound = false
    for (const text of emptyStateText) {
      if (pageContent.includes(text)) {
        emptyStateFound = true
        findings.explorationResults.dataDisplay.emptyState = text
        console.log('Found empty state:', text)
        break
      }
    }

    // Step 11: Explore navigation elements
    console.log('📝 Step 11: Checking navigation...')
    const navLinks = await page.locator('nav a, [role="navigation"] a').evaluateAll((lnks) =>
      lnks.map((lnk) => ({
        text: lnk.textContent?.trim(),
        href: lnk.getAttribute('href'),
      }))
    )
    findings.explorationResults.navigation.navLinks = navLinks

    // Step 12: Check for profile completion indicator
    console.log('📝 Step 12: Looking for profile completion indicator...')
    const profileCompletionVisible = await page
      .locator('[data-testid*="completion"], .completion, .progress')
      .isVisible()
      .catch(() => false)
    findings.explorationResults.dataDisplay.profileCompletionVisible = profileCompletionVisible

    // Step 13: Take final screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-certifications-04-final.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: admin-certifications-04-final.png')

    // Step 14: Get full page HTML for analysis
    const html = await page.content()
    findings.explorationResults.pageStructure.htmlLength = html.length

    // Step 15: Console logs and errors
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else {
        consoleLogs.push(msg.text())
      }
    })

    findings.explorationResults.issues.consoleErrors = consoleErrors

    // Write findings to file
    writeFileSync(
      '.playwright-mcp/admin-certifications-exploration.json',
      JSON.stringify(findings, null, 2)
    )
    console.log('💾 Exploration findings saved to: admin-certifications-exploration.json')

    // Print summary
    console.log('\n📊 EXPLORATION SUMMARY')
    console.log('='.repeat(50))
    console.log('Route:', findings.route)
    console.log('User:', findings.user)
    console.log('Headings found:', headings.length)
    console.log('Buttons found:', buttons.length)
    console.log('Links found:', links.length)
    console.log('Form inputs found:', inputs.length)
    console.log('Add button found:', findings.explorationResults.interactions.addButtonFound)
    console.log('Certification items:', certificationItems)
    console.log('Empty state:', emptyStateFound)
    console.log('='.repeat(50))
  })
})
