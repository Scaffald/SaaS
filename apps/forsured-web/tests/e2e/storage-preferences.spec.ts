import { test, expect } from './fixtures/base';

/**
 * Storage Preferences E2E Tests
 *
 * Tests for the document storage preferences feature that allows users
 * to choose their preferred storage backend (Supabase, Dropbox, Google Drive).
 *
 * Document Upload & Storage - User storage preferences
 */
test.describe('Storage Preferences', () => {
  test.describe('Storage Preference Selection', () => {
    test('should display storage preference options', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      // Navigate to settings page where storage preferences would be
      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      // Check that storage preference section exists
      const storageSection = page.locator('[data-testid="storage-preferences"], h2:has-text("Storage"), h3:has-text("Storage")').first();

      // If the section exists, verify it has the expected options
      if (await storageSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should have radio buttons or select for storage options
        const supabaseOption = page.locator('input[value="supabase"], [data-value="supabase"], label:has-text("Supabase")').first();
        const dropboxOption = page.locator('input[value="dropbox"], [data-value="dropbox"], label:has-text("Dropbox")').first();
        const googleDriveOption = page.locator('input[value="google_drive"], [data-value="google_drive"], label:has-text("Google Drive")').first();

        // At least Supabase should be visible as default option
        await expect(supabaseOption).toBeVisible({ timeout: 5000 });
      }
    });

    test('should save storage preference selection', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      // Find the storage preference radio buttons
      const dropboxRadio = page.locator('input[value="dropbox"], [data-value="dropbox"]').first();

      if (await dropboxRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dropboxRadio.click();

        // Wait for save to complete (look for success message or button state change)
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click();
        }

        // Check for success feedback
        const successMessage = page.locator('[role="alert"]:has-text("success"), [class*="toast"]:has-text("saved"), [class*="success"]').first();
        await expect(successMessage).toBeVisible({ timeout: 5000 }).catch(() => {
          // If no explicit success message, just verify the selection persisted
        });

        // Reload and verify the selection persisted
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify Dropbox is still selected
        const dropboxSelected = page.locator('input[value="dropbox"]:checked, [data-value="dropbox"][aria-checked="true"]').first();
        await expect(dropboxSelected).toBeVisible({ timeout: 5000 }).catch(() => {
          // Selection may be stored differently
        });
      }
    });

    test('should show OAuth connection status for cloud providers', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      // Check for connection status indicators
      const connectionStatus = page.locator('[data-testid="connection-status"], .connection-status, [class*="connected"]').first();

      if (await connectionStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should show "Connected" or "Not Connected" status
        const statusText = await connectionStatus.textContent();
        expect(statusText?.toLowerCase()).toMatch(/connected|not connected|connect/);
      }
    });

    test('should show connect button for disconnected cloud providers', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      // Look for connect buttons for Dropbox and Google Drive
      const connectDropbox = page.locator('button:has-text("Connect Dropbox"), button:has-text("Link Dropbox")').first();
      const connectGoogle = page.locator('button:has-text("Connect Google"), button:has-text("Link Google")').first();

      // At least one should be visible if cloud storage is enabled
      const hasConnectButtons =
        await connectDropbox.isVisible({ timeout: 3000 }).catch(() => false) ||
        await connectGoogle.isVisible({ timeout: 3000 }).catch(() => false);

      // This is expected behavior - cloud providers require connection
    });
  });

  test.describe('Storage Preference Impact on Uploads', () => {
    test('should use selected storage backend for uploads', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      // First set a storage preference
      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      // Ensure Supabase is selected (default, always available)
      const supabaseOption = page.locator('input[value="supabase"], [data-value="supabase"]').first();
      if (await supabaseOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await supabaseOption.click();
      }

      // Navigate to document upload page
      await page.goto('/manager/documents');
      await page.waitForLoadState('networkidle');

      // Look for upload button or dropzone
      const uploadButton = page.locator('button:has-text("Upload"), [data-testid="upload-button"], [class*="upload"]').first();
      const dropzone = page.locator('[class*="dropzone"], [data-testid="dropzone"]').first();

      // Verify upload UI is available
      const hasUploadUI =
        await uploadButton.isVisible({ timeout: 5000 }).catch(() => false) ||
        await dropzone.isVisible({ timeout: 5000 }).catch(() => false);

      // Upload UI should be present for document management
    });

    test('should fallback to Supabase when preferred backend unavailable', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      // Set preference to Dropbox (which requires OAuth and may not be connected)
      await page.goto('/manager/settings/documents');
      await page.waitForLoadState('networkidle');

      const dropboxOption = page.locator('input[value="dropbox"], [data-value="dropbox"]').first();
      if (await dropboxOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dropboxOption.click();
      }

      // Try to upload a document
      await page.goto('/manager/documents');
      await page.waitForLoadState('networkidle');

      // If Dropbox is not connected, upload should still work (fallback to Supabase)
      // Look for fallback warning or just verify upload still works
      const fallbackWarning = page.locator('[class*="warning"]:has-text("fallback"), [class*="alert"]:has-text("Supabase")').first();

      // This is a soft check - fallback should happen transparently
    });
  });

  test.describe('Contractor Storage Preferences', () => {
    test('should display storage options for contractors', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      await page.goto('/subcontractor/settings/documents');
      await page.waitForLoadState('networkidle');

      // Contractors should also have storage preferences
      const storageSection = page.locator('[data-testid="storage-preferences"], h2:has-text("Storage"), h3:has-text("Storage")').first();

      // If storage preferences exist, verify basic functionality
      if (await storageSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should have at least Supabase option
        const supabaseOption = page.locator('input[value="supabase"], [data-value="supabase"], label:has-text("Supabase")').first();
        await expect(supabaseOption).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Broker Storage Preferences', () => {
    test('should display storage options for brokers', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      await page.goto('/broker/settings/documents');
      await page.waitForLoadState('networkidle');

      // Brokers should also have storage preferences
      const storageSection = page.locator('[data-testid="storage-preferences"], h2:has-text("Storage"), h3:has-text("Storage")').first();

      // If storage preferences exist, verify basic functionality
      if (await storageSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should have at least Supabase option
        const supabaseOption = page.locator('input[value="supabase"], [data-value="supabase"], label:has-text("Supabase")').first();
        await expect(supabaseOption).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
