import { expect, type Page, test } from '@playwright/test'
import {
  signInAsUser,
  TEST_USERS,
} from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { PrerequisiteFormHelpers } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/prerequisites'

async function loadPrerequisitesForm(page: Page): Promise<PrerequisiteFormHelpers> {
  await signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)

  // Dismiss cookie consent if it appears so the form isn't obscured
  try {
    await page.getByRole('button', { name: /accept|reject/i }).click({ timeout: 2000 })
    await page.waitForTimeout(500)
  } catch {
    // ignore if consent modal is not shown
  }

  // Ensure the prerequisites widget is visible before continuing
  await page.getByText(/complete your profile/i).waitFor({ state: 'visible', timeout: 10000 })

  return new PrerequisiteFormHelpers(page)
}

test.describe('Profile prerequisites checkboxes', () => {
  test('exposes stable test ids and semantic roles', async ({ page }) => {
    const helpers = await loadPrerequisitesForm(page)

    const workerCheckbox = helpers.getUserTypeCheckbox('worker')
    await expect(workerCheckbox).toBeVisible()

    const checkboxRole = helpers.getCheckboxByRoleName(/privacy policy/i)
    await expect(checkboxRole).toBeVisible()

    // Verify aria-checked toggles when interacting
    expect(await helpers.isCheckboxCheckedByTestId('checkbox-user-type-worker')).toBe(false)
    await helpers.selectUserType('worker')
    expect(await helpers.isCheckboxCheckedByTestId('checkbox-user-type-worker')).toBe(true)
  })

  test('supports multi-select user types and exposes selection helpers', async ({ page }) => {
    const helpers = await loadPrerequisitesForm(page)

    await helpers.selectUserType('worker')
    await helpers.selectUserType('employer')

    const selected = await helpers.getSelectedUserTypes()
    expect(selected).toContain('worker')
    expect(selected).toContain('employer')

    // Deselect worker to ensure helpers reflect changes
    await helpers.deselectUserType('worker')
    const updated = await helpers.getSelectedUserTypes()
    expect(updated).toContain('employer')
    expect(updated).not.toContain('worker')
  })

  test('legal agreement labels toggle the related checkboxes', async ({ page }) => {
    const helpers = await loadPrerequisitesForm(page)

    const privacyButton = page.getByRole('button', { name: /i accept the privacy policy/i })
    await privacyButton.click()
    expect(await helpers.isCheckboxCheckedByTestId('checkbox-legal-privacy-policy')).toBe(true)

    const termsButton = page.getByRole('button', { name: /i accept the terms of service/i })
    await termsButton.click()
    expect(await helpers.isCheckboxCheckedByTestId('checkbox-legal-terms-of-service')).toBe(true)

    // Ensure semantic checkbox query works for automation suites
    const allCheckboxes = helpers.getCheckboxesByRole()
    expect(await allCheckboxes.count()).toBeGreaterThanOrEqual(5)
  })
})
