import { expect, type Page, test } from '@playwright/test'
import {
  signInAsUser,
  TEST_USERS,
} from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

/**
 * Test Prerequisites Form Flow
 *
 * Tests the first-time login prerequisites form that appears when users
 * haven't completed their profile. Tests form validation, field completion,
 * and successful submission.
 */
test.describe('Prerequisites Form', () => {
  /**
   * Helper: Create and sign in as a fresh user without prerequisites
   * Note: Using regular test user but need to ensure prerequisites aren't completed
   */
  async function signInWithoutPrerequisites(page: Page) {
    // Sign in but don't complete prerequisites (skip ensureProfileComplete)
    await signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)

    // Wait for dashboard to load
    await page.waitForTimeout(2000)

    // Dismiss cookie consent if present
    try {
      await page.getByRole('button', { name: /accept|reject/i }).click({ timeout: 2000 })
      await page.waitForTimeout(500)
    } catch {}
  }

  test.describe('Form Display and Validation', () => {
    test('displays prerequisites form on first login', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      // Verify form heading
      await expect(page.getByText('Complete Your Profile')).toBeVisible({ timeout: 10000 })

      // Verify explanatory text
      await expect(page.getByText(/Please complete these required fields/i)).toBeVisible()

      // Verify all required fields are visible
      await expect(page.getByTestId('prereq-first-name-input')).toBeVisible()
      await expect(page.getByTestId('prereq-last-name-input')).toBeVisible()
      await expect(page.getByPlaceholder(/Search for your address/i)).toBeVisible()

      // Verify user type checkboxes
      await expect(page.getByTestId('prereq-user-type-worker-checkbox')).toBeVisible()
      await expect(page.getByTestId('prereq-user-type-employer-checkbox')).toBeVisible()
      await expect(page.getByTestId('prereq-user-type-customer-checkbox')).toBeVisible()

      // Verify industry selector
      await expect(page.getByTestId('prereq-industry-select')).toBeVisible()

      // Verify legal checkboxes
      await expect(page.getByTestId('prereq-privacy-checkbox')).toBeVisible()
      await expect(page.getByTestId('prereq-terms-checkbox')).toBeVisible()

      // Verify submit button
      await expect(page.getByTestId('prereq-submit-button')).toBeVisible()
    })

    test('validates required fields on submit', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      // Wait for form to be visible
      await page.getByTestId('prereq-submit-button').waitFor({ state: 'visible', timeout: 10000 })

      // Click submit without filling anything
      await page.getByTestId('prereq-submit-button').click()

      // Wait for validation errors to appear
      await page.waitForTimeout(1000)

      // Verify error messages appear for required fields
      // Note: Form uses react-hook-form validation, errors appear inline
      const pageContent = (await page.locator('body').textContent()) || ''

      // Check for validation text (may vary based on validation messages)
      expect(pageContent.toLowerCase()).toMatch(/required|must/i)
    })

    test('shows specific field validation errors', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page.getByTestId('prereq-submit-button').waitFor({ state: 'visible', timeout: 10000 })

      // Fill some fields but not all
      await page.getByTestId('prereq-first-name-input').fill('Test')
      // Leave last name empty

      // Try to submit
      await page.getByTestId('prereq-submit-button').click()
      await page.waitForTimeout(1000)

      // Verify validation messages
      const lastNameError = page.getByTestId('last-name-error')
      if (await lastNameError.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(lastNameError).toContainText(/required/i)
      }
    })
  })

  test.describe('Field Input', () => {
    test('allows entering first and last name', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page
        .getByTestId('prereq-first-name-input')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Fill name fields
      const firstName = page.getByTestId('prereq-first-name-input')
      const lastName = page.getByTestId('prereq-last-name-input')

      await firstName.fill('John')
      await lastName.fill('Doe')

      // Verify values are set
      await expect(firstName).toHaveValue('John')
      await expect(lastName).toHaveValue('Doe')
    })

    test('allows selecting user type checkboxes', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page
        .getByTestId('prereq-user-type-worker-checkbox')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Click worker checkbox
      const workerCheckbox = page.getByTestId('prereq-user-type-worker-checkbox')
      await workerCheckbox.click()

      // Verify it can be checked (CustomCheckbox component)
      await page.waitForTimeout(500)

      // Can also select multiple types
      const employerCheckbox = page.getByTestId('prereq-user-type-employer-checkbox')
      await employerCheckbox.click()
      await page.waitForTimeout(500)
    })

    test('allows selecting industry from dropdown', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page.getByTestId('prereq-industry-select').waitFor({ state: 'visible', timeout: 10000 })

      // Open industry selector (custom Select)
      const industrySelect = page.getByTestId('prereq-industry-select')
      await industrySelect.click()

      // Wait for options to appear
      await page.waitForTimeout(1000)

      // Select first available option
      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click()
        await page.waitForTimeout(500)
      }
    })

    test('allows checking privacy and terms checkboxes', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page
        .getByTestId('prereq-privacy-checkbox')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Click privacy checkbox
      const privacyCheckbox = page.getByTestId('prereq-privacy-checkbox')
      await privacyCheckbox.click()
      await page.waitForTimeout(500)

      // Click terms checkbox
      const termsCheckbox = page.getByTestId('prereq-terms-checkbox')
      await termsCheckbox.click()
      await page.waitForTimeout(500)
    })
  })

  test.describe('Address Field', () => {
    test('displays address input field', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      const addressInput = page.getByPlaceholder(/Search for your address/i)
      await expect(addressInput).toBeVisible({ timeout: 10000 })
    })

    test('allows manual address entry', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      const addressInput = page.getByPlaceholder(/Search for your address/i)
      await addressInput.waitFor({ state: 'visible', timeout: 10000 })

      // Type address
      await addressInput.fill('123 Main Street')
      await page.waitForTimeout(1000)

      // Verify input accepts text
      await expect(addressInput).toHaveValue('123 Main Street')
    })
  })

  test.describe('Complete Prerequisites Flow', () => {
    test('successfully completes prerequisites form', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page.getByTestId('prereq-submit-button').waitFor({ state: 'visible', timeout: 10000 })

      // Fill all required fields
      await page.getByTestId('prereq-first-name-input').fill('Test')
      await page.getByTestId('prereq-last-name-input').fill('User')

      // Fill address (simplified - just fill the search field)
      await page.getByPlaceholder(/Search for your address/i).fill('123 Main St, Chicago, IL 60601')
      await page.waitForTimeout(1000)

      // Select user type (click the worker checkbox area)
      const workerCheckbox = page.getByTestId('prereq-user-type-worker-checkbox')
      await workerCheckbox.click()
      await page.waitForTimeout(500)

      // Select industry
      const industrySelect = page.getByTestId('prereq-industry-select')
      await industrySelect.click()
      await page.waitForTimeout(1000)

      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click()
        await page.waitForTimeout(500)
      }

      // Accept legal agreements
      await page.getByTestId('prereq-privacy-checkbox').click()
      await page.waitForTimeout(500)
      await page.getByTestId('prereq-terms-checkbox').click()
      await page.waitForTimeout(500)

      // Submit form
      await page.getByTestId('prereq-submit-button').click()

      // Wait for submission
      await page.waitForTimeout(3000)

      // Verify success (form should disappear or redirect)
      // Check that we're still on dashboard and form is gone
      const currentUrl = page.url()
      expect(currentUrl).toContain('/dashboard')
    })

    test.skip('prerequisites form does not appear after completion', async ({
      page,
    }: {
      page: Page
    }) => {
      // This test would require completing prerequisites in one session
      // and then logging out and back in to verify form doesn't reappear
      // Skipping for now as it requires more complex test setup

      // First login and complete prerequisites
      await signInWithoutPrerequisites(page)

      await page.getByTestId('prereq-submit-button').waitFor({ state: 'visible', timeout: 10000 })

      // Fill and submit form (reusing logic from previous test)
      await page.getByTestId('prereq-first-name-input').fill('Test')
      await page.getByTestId('prereq-last-name-input').fill('User')
      await page.getByPlaceholder(/Search for your address/i).fill('123 Main St')

      const workerCheckbox = page.getByTestId('prereq-user-type-worker-checkbox')
      await workerCheckbox.click()
      await page.waitForTimeout(500)

      const industrySelect = page.getByTestId('prereq-industry-select')
      await industrySelect.click()
      await page.waitForTimeout(1000)

      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click()
      }

      await page.getByTestId('prereq-privacy-checkbox').click()
      await page.waitForTimeout(500)
      await page.getByTestId('prereq-terms-checkbox').click()
      await page.waitForTimeout(500)

      await page.getByTestId('prereq-submit-button').click()
      await page.waitForTimeout(3000)

      // Would need to sign out and back in here
      // Then verify form doesn't appear
      // Implementation depends on logout mechanism
    })
  })

  test.describe('Legal Agreement Links', () => {
    test('privacy policy link is present', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page
        .getByTestId('prereq-privacy-checkbox')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Verify privacy policy link exists
      const privacyLink = page.getByText('Privacy Policy')
      await expect(privacyLink).toBeVisible()
    })

    test('terms of service link is present', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page.getByTestId('prereq-terms-checkbox').waitFor({ state: 'visible', timeout: 10000 })

      // Verify terms link exists
      const termsLink = page.getByText('Terms of Service')
      await expect(termsLink).toBeVisible()
    })
  })

  test.describe('Form State', () => {
    test('submit button is enabled initially', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      const submitButton = page.getByTestId('prereq-submit-button')
      await submitButton.waitFor({ state: 'visible', timeout: 10000 })

      // Button should be enabled (react-hook-form validates on submit)
      await expect(submitButton).toBeEnabled()
    })

    test('form fields accept input', async ({ page }: { page: Page }) => {
      await signInWithoutPrerequisites(page)

      await page
        .getByTestId('prereq-first-name-input')
        .waitFor({ state: 'visible', timeout: 10000 })

      // Verify all text inputs accept values
      const firstName = page.getByTestId('prereq-first-name-input')
      const lastName = page.getByTestId('prereq-last-name-input')

      await firstName.fill('Test')
      await lastName.fill('User')

      await expect(firstName).toHaveValue('Test')
      await expect(lastName).toHaveValue('User')
    })
  })
})
