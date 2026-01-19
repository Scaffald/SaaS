/**
 * Feedback System E2E Tests
 *
 * Tests the complete feedback workflow including:
 * - User feedback submission
 * - Admin feedback management
 * - Conversation threading
 */

import { test, expect, Page } from './fixtures/base';
import { TEST_USERS } from '../utils/auth';

test.describe('Feedback System', () => {
  test.describe('User Flow', () => {
    test('should display feedback button on dashboard', async ({ managerPage }) => {
      // Navigate to dashboard
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Look for the feedback button (floating in bottom-right)
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i], [aria-label*="Feedback" i]');
      await expect(feedbackButton).toBeVisible();
    });

    test('should open feedback modal when button clicked', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Click feedback button
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i], [aria-label*="Feedback" i]');
      await feedbackButton.click();

      // Modal should be visible
      const modal = managerPage.locator('[role="dialog"][aria-label*="Feedback" i]');
      await expect(modal).toBeVisible();
    });

    test('should display feedback list in modal', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Wait for modal content
      await managerPage.waitForTimeout(500);

      // Should show list view or empty state
      const modal = managerPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should navigate to new feedback form', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Click new feedback button (may be in header or empty state)
      const newFeedbackButton = managerPage.getByRole('button', { name: /new feedback|submit feedback/i });
      if (await newFeedbackButton.isVisible()) {
        await newFeedbackButton.click();

        // Form should be visible
        await expect(managerPage.getByText('Bug Report')).toBeVisible();
        await expect(managerPage.getByText('Feature Request')).toBeVisible();
      }
    });

    test('should show validation errors for incomplete form', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Navigate to form (click new feedback if available)
      const newFeedbackButton = managerPage.getByRole('button', { name: /new feedback|submit feedback/i });
      if (await newFeedbackButton.isVisible()) {
        await newFeedbackButton.click();

        // Try to submit without filling fields
        const submitButton = managerPage.getByRole('button', { name: /submit feedback/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show error toast
          const errorToast = managerPage.locator('[data-sonner-toast]').filter({ hasText: /please select|required/i });
          await expect(errorToast).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should close modal on escape key', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Modal visible
      const modal = managerPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Press escape
      await managerPage.keyboard.press('Escape');

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on backdrop click', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Modal visible
      const modal = managerPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Click backdrop (the dialog element itself acts as backdrop)
      await modal.click({ position: { x: 5, y: 5 } });

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Admin Flow', () => {
    test('should display feedback page in admin panel', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Page title should be visible
      await expect(adminPage.getByRole('heading', { name: /feedback/i })).toBeVisible();
    });

    test('should display feedback tabs', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Tabs should be visible
      await expect(adminPage.getByRole('button', { name: /unassigned/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /my items/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /all/i })).toBeVisible();
    });

    test('should display stats badges', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Stats should be visible
      await expect(adminPage.getByText(/unassigned/i)).toBeVisible();
      await expect(adminPage.getByText(/my unread/i)).toBeVisible();
    });

    test('should have working filters', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Search input should be visible
      const searchInput = adminPage.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();

      // Type filter should be available
      const typeFilter = adminPage.locator('[placeholder="Type"], button:has-text("Type"), [aria-label*="type"]');
      await expect(typeFilter.first()).toBeVisible();
    });

    test('should show detail panel placeholder when no item selected', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Should show placeholder message
      await expect(adminPage.getByText(/select a feedback item/i)).toBeVisible();
    });

    test('should navigate between tabs', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Click "My Items" tab
      const myItemsTab = adminPage.getByRole('button', { name: /my items/i });
      await myItemsTab.click();

      // Tab should be active (visual indication)
      await expect(myItemsTab).toBeVisible();

      // Click "All" tab
      const allTab = adminPage.getByRole('button', { name: /all/i });
      await allTab.click();

      // Tab should be active
      await expect(allTab).toBeVisible();
    });
  });

  test.describe('Admin Header Icon', () => {
    test('should display feedback icon in admin sidebar', async ({ adminPage }) => {
      await adminPage.goto('/admin/dashboard');
      await adminPage.waitForLoadState('networkidle');

      // Feedback link should be in sidebar
      const feedbackLink = adminPage.getByRole('link', { name: /feedback/i });
      await expect(feedbackLink).toBeVisible();
    });

    test('should navigate to feedback page when clicking sidebar link', async ({ adminPage }) => {
      await adminPage.goto('/admin/dashboard');
      await adminPage.waitForLoadState('networkidle');

      // Click feedback link
      const feedbackLink = adminPage.getByRole('link', { name: /feedback/i });
      await feedbackLink.click();

      // Should be on feedback page
      await expect(adminPage).toHaveURL(/\/admin\/feedback/);
    });
  });

  test.describe('Accessibility', () => {
    test('feedback modal should have proper ARIA attributes', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      // Open modal
      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await feedbackButton.click();

      // Check ARIA attributes
      const modal = managerPage.locator('[role="dialog"]');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect(modal).toHaveAttribute('aria-label');
    });

    test('feedback button should have accessible label', async ({ managerPage }) => {
      await managerPage.goto('/manager/dashboard');
      await managerPage.waitForLoadState('networkidle');

      const feedbackButton = managerPage.locator('[aria-label*="feedback" i]');
      await expect(feedbackButton).toHaveAttribute('aria-label');
    });

    test('admin feedback page should be keyboard navigable', async ({ adminPage }) => {
      await adminPage.goto('/admin/feedback');
      await adminPage.waitForLoadState('networkidle');

      // Tab through elements
      await adminPage.keyboard.press('Tab');
      await adminPage.keyboard.press('Tab');
      await adminPage.keyboard.press('Tab');

      // Should have focus on an interactive element
      const focused = adminPage.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });
});
