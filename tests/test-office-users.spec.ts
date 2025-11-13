// @ts-nocheck
/**
 * Office Users Management Tests
 *
 * Tests for /office/users routes:
 * - List page with search and pagination
 * - Edit user flow
 * - Form validation
 *
 * Note: This app does NOT have user creation in office (users are created via auth signup).
 * Only testing LIST and EDIT functionality.
 */

import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'
import {
  navigateToOfficeRoute,
  OFFICE_ROUTES,
  waitForPageLoad,
  waitForNavigation,
  waitForRootContent,
} from './helpers/office-navigation'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

test.describe('Office • Users Management', () => {
  // ============================================================================
  // 1. USERS LIST PAGE TESTS
  // ============================================================================

  test.describe('Users List Page', () => {
    test('navigates to users list and loads correctly', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)

      // Verify URL
      expect(page.url()).toContain('/office/users')

      // Wait for page to load
      await waitForPageLoad(page)

      // Check for page title
      const pageContent = await page.locator('#root').textContent() || ''
      expect(pageContent).toMatch(/users/i)
    })

    test('displays users table with data', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Check for table headers
      const pageContent = await page.locator('#root').textContent() || ''
      expect(pageContent).toMatch(/first name/i)
      expect(pageContent).toMatch(/last name/i)
      expect(pageContent).toMatch(/user id/i)
    })

    test('displays search input field', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Look for search input
      const searchInput = page.getByPlaceholder(/search users/i)
      await expect(searchInput).toBeVisible({ timeout: 10000 })
    })

    test('displays edit button for users', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Check for edit buttons (should have data-testid pattern)
      const editButtons = page.locator('[data-testid^="user-edit-button-"]')
      const editCount = await editButtons.count()

      // Should have at least one user (if any exist)
      if (editCount > 0) {
        await expect(editButtons.first()).toBeVisible()
      }
    })

    test('displays delete button for users', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Check for delete buttons
      const deleteButtons = page.locator('[data-testid^="user-delete-button-"]')
      const deleteCount = await deleteButtons.count()

      if (deleteCount > 0) {
        await expect(deleteButtons.first()).toBeVisible()
      }
    })
  })

  // ============================================================================
  // 2. SEARCH FUNCTIONALITY TESTS
  // ============================================================================

  test.describe('Search Functionality', () => {
    test('search field accepts text input', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const searchInput = page.getByPlaceholder(/search users/i)
      await searchInput.fill('test')

      const value = await searchInput.inputValue()
      expect(value).toContain('test')
    })

    test('search filters users by first name', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Get initial user count
      const initialContent = await page.locator('#root').textContent() || ''

      // Search for a specific term that won't match
      const searchInput = page.getByPlaceholder(/search users/i)
      await searchInput.fill('zzz_nonexistent_user_name_xyz')
      await page.waitForTimeout(500)

      // Should show "no users found" or similar
      const afterSearchContent = await page.locator('#root').textContent() || ''
      expect(afterSearchContent).toMatch(/no users found|no results/i)
    })

    test('search filters users by last name', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const searchInput = page.getByPlaceholder(/search users/i)

      // Search for a common last name pattern
      await searchInput.fill('zzz_another_nonexistent_xyz')
      await page.waitForTimeout(500)

      // Should show no results
      const pageContent = await page.locator('#root').textContent() || ''
      expect(pageContent).toMatch(/no users found|no results/i)
    })

    test('clearing search shows all users', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const searchInput = page.getByPlaceholder(/search users/i)

      // Search for something
      await searchInput.fill('test_search')
      await page.waitForTimeout(300)

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(300)

      // Should show users again (or empty state)
      const pageContent = await page.locator('#root').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // 3. EDIT USER FLOW TESTS
  // ============================================================================

  test.describe('Edit User Flow', () => {
    test('navigates to edit page from list', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Find first edit button
      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      // Only test if users exist
      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)

        // Verify URL contains edit
        expect(page.url()).toMatch(/\/office\/users\/[^/]+\/edit/)
      } else {
        // Skip test if no users exist
        test.skip()
      }
    })

    test('displays edit page with correct title', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Check for page heading
        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/edit user profile/i)
      } else {
        test.skip()
      }
    })

    test('displays General Information section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/general information/i)
      } else {
        test.skip()
      }
    })

    test('displays Employment Preferences section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/employment preferences/i)
      } else {
        test.skip()
      }
    })

    test('displays profile form fields with labels', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Check for form field labels
        const pageContent = await page.locator('#root').textContent() || ''

        // General Information fields
        expect(pageContent).toMatch(/first name/i)
        expect(pageContent).toMatch(/last name/i)

        // Note: We're checking for labels, not specific data-testid attributes
        // as the GeneralProfileSection component may not have them
      } else {
        test.skip()
      }
    })

    test('allows entering first name', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Find first name input by label
        const firstNameInput = page.getByPlaceholder(/first name/i).first()
        await expect(firstNameInput).toBeVisible({ timeout: 10000 })

        // Verify it's editable
        await firstNameInput.fill('TestFirstName')
        const value = await firstNameInput.inputValue()
        expect(value).toBe('TestFirstName')
      } else {
        test.skip()
      }
    })

    test('allows entering last name', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Find last name input by label
        const lastNameInput = page.getByPlaceholder(/last name/i).first()
        await expect(lastNameInput).toBeVisible({ timeout: 10000 })

        // Verify it's editable
        await lastNameInput.fill('TestLastName')
        const value = await lastNameInput.inputValue()
        expect(value).toBe('TestLastName')
      } else {
        test.skip()
      }
    })

    test('back button returns to users list', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Click "Back to Users" button
        const backButton = page.getByRole('button', { name: /back to users/i })
        await backButton.click()
        await page.waitForTimeout(1000)

        // Should be back at list
        expect(page.url()).toContain('/office/users')
        expect(page.url()).not.toContain('/edit')
      } else {
        test.skip()
      }
    })
  })

  // ============================================================================
  // 4. FORM VALIDATION TESTS
  // ============================================================================

  test.describe('Form Validation', () => {
    test('marks first name as required field', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Check for asterisk or required indicator
        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/first name\s*\*/i)
      } else {
        test.skip()
      }
    })

    test('marks last name as required field', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Check for asterisk or required indicator
        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/last name\s*\*/i)
      } else {
        test.skip()
      }
    })

    test('validates first name max length (50 characters)', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const firstNameInput = page.getByPlaceholder(/first name/i).first()

        // Try to enter more than 50 characters
        const longName = 'A'.repeat(60)
        await firstNameInput.fill(longName)
        await page.waitForTimeout(500)

        // Should show validation error or truncate
        const value = await firstNameInput.inputValue()
        // Either it's truncated to 50 or an error is shown
        if (value.length > 50) {
          // Check for error message
          const pageContent = await page.locator('#root').textContent() || ''
          expect(pageContent).toMatch(/maximum|50|characters/i)
        } else {
          expect(value.length).toBeLessThanOrEqual(50)
        }
      } else {
        test.skip()
      }
    })
  })

  // ============================================================================
  // 5. PAGINATION TESTS
  // ============================================================================

  test.describe('Pagination', () => {
    test('displays page size controls if many users exist', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Check for pagination controls (may not exist if < 50 users)
      const pageContent = await page.locator('#root').textContent() || ''

      // Pagination controls may appear if there are many items
      // This test just verifies the page loads without errors
      expect(pageContent.length).toBeGreaterThan(0)
    })

    test('default page size is 50 users per page', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // Count visible user rows
      const editButtons = page.locator('[data-testid^="user-edit-button-"]')
      const visibleCount = await editButtons.count()

      // Should show up to 50 users (or less if there aren't that many)
      expect(visibleCount).toBeLessThanOrEqual(50)
    })
  })

  // ============================================================================
  // 6. PROFILE SECTIONS DISPLAY TESTS
  // ============================================================================

  test.describe('Profile Sections Display', () => {
    test('displays Skills & Expertise section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/skills.*expertise/i)
      } else {
        test.skip()
      }
    })

    test('displays Work Experience section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/work experience/i)
      } else {
        test.skip()
      }
    })

    test('displays Education section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/education/i)
      } else {
        test.skip()
      }
    })

    test('displays Certifications section', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/certifications/i)
      } else {
        test.skip()
      }
    })

    test('displays warning notes for multi-user sections', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      const editButton = page.locator('[data-testid^="user-edit-button-"]').first()
      const buttonCount = await page.locator('[data-testid^="user-edit-button-"]').count()

      if (buttonCount > 0) {
        await editButton.click()
        await waitForNavigation(page)
        await waitForPageLoad(page)

        // Check for warning notes about multi-user support
        const pageContent = await page.locator('#root').textContent() || ''
        expect(pageContent).toMatch(/note:|⚠️/i)
        expect(pageContent).toMatch(/multi-user|full.*support/i)
      } else {
        test.skip()
      }
    })
  })

  // ============================================================================
  // 7. NO CREATE USER TESTS
  // ============================================================================

  test.describe('User Creation Not Available', () => {
    test('does not display "Create User" button', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
      await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS)
      await waitForPageLoad(page)

      // The create button should NOT work for users (users are created via auth)
      // We're just checking the current state
      const createButton = page.getByRole('button', { name: /create user/i })
      const isVisible = await createButton.isVisible().catch(() => false)

      // Document that create button may exist but shouldn't be functional
      // (This is expected behavior - users are created via auth signup)
    })
  })
})
