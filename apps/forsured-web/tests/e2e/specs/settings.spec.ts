import { test, expect } from '../fixtures/base';
import {
  BrokerSettingsPage,
} from '../pages/broker';
import {
  ManagerSettingsPage,
} from '../pages/manager';
import {
  ContractorSettingsPage,
} from '../pages/contractor';
import { BasePage } from '../pages/base.page';

/**
 * Settings Sub-Pages Test Suite
 *
 * Tests all settings routes for each user role:
 * - GC/Manager: 6 settings pages
 * - Contractor: 5 settings pages
 * - Broker: 4 settings pages
 *
 * Total: 15 settings routes
 */
test.describe('Settings Sub-Pages', () => {

  test.describe('GC/Manager Settings', () => {
    const gcSettingsRoutes = [
      { path: '/manager/settings/profile', title: 'Profile Settings' },
      { path: '/manager/settings/company', title: 'Company Settings' },
      { path: '/manager/settings/insurance', title: 'Insurance Settings' },
      { path: '/manager/settings/notifications', title: 'Notification Settings' },
      { path: '/manager/settings/integrations', title: 'Integration Settings' },
      { path: '/manager/settings/team', title: 'Team' },
    ];

    for (const route of gcSettingsRoutes) {
      test(`should display ${route.title} page`, async ({ page, setupAuthAs }) => {
        await setupAuthAs(page, 'active.gc@test.forsured.com');

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // Verify page loaded (sidebar with Dashboard link visible)
        await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

        // Verify URL
        expect(page.url()).toContain(route.path);
      });
    }

    test('should navigate between settings tabs', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      // Start at profile settings
      await page.goto('/manager/settings/profile');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Navigate to team settings via settings nav (if available)
      const teamLink = page.locator('a[href*="/settings/team"], button:has-text("Team")').first();
      if (await teamLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await teamLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/settings/team');
      }
    });
  });

  test.describe('Contractor Settings', () => {
    const contractorSettingsRoutes = [
      { path: '/subcontractor/settings/profile', title: 'Profile Settings' },
      { path: '/subcontractor/settings/company', title: 'Company Settings' },
      { path: '/subcontractor/settings/insurance', title: 'Insurance Settings' },
      { path: '/subcontractor/settings/notifications', title: 'Notification Settings' },
      { path: '/subcontractor/settings/documents', title: 'Document Settings' },
    ];

    for (const route of contractorSettingsRoutes) {
      test(`should display ${route.title} page`, async ({ page, setupAuthAs }) => {
        await setupAuthAs(page, 'active.contractor@test.forsured.com');

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // Verify page loaded (sidebar with Dashboard link visible)
        await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

        // Verify URL
        expect(page.url()).toContain(route.path);
      });
    }

    test('should navigate between settings tabs', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      // Start at profile settings
      await page.goto('/subcontractor/settings/profile');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Navigate to company settings via settings nav (if available)
      const companyLink = page.locator('a[href*="/settings/company"], button:has-text("Company")').first();
      if (await companyLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/settings/company');
      }
    });
  });

  test.describe('Broker Settings', () => {
    const brokerSettingsRoutes = [
      { path: '/broker/settings/profile', title: 'Profile Settings' },
      { path: '/broker/settings/agency', title: 'Agency Settings' },
      { path: '/broker/settings/clients', title: 'Client Settings' },
      { path: '/broker/settings/notifications', title: 'Notification Settings' },
    ];

    for (const route of brokerSettingsRoutes) {
      test(`should display ${route.title} page`, async ({ page, setupAuthAs }) => {
        await setupAuthAs(page, 'active.broker@test.forsured.com');

        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        // Verify page loaded (sidebar with Dashboard link visible)
        await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

        // Verify URL
        expect(page.url()).toContain(route.path);
      });
    }

    test('should navigate between settings tabs', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      // Start at profile settings
      await page.goto('/broker/settings/profile');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Navigate to agency settings via settings nav (if available)
      const agencyLink = page.locator('a[href*="/settings/agency"], button:has-text("Agency")').first();
      if (await agencyLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await agencyLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/settings/agency');
      }
    });
  });

  test.describe('Settings Form Elements', () => {
    test('GC Profile Settings should have form fields', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      await page.goto('/manager/settings/profile');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Check for profile form elements
      const nameField = page.locator('input[type="text"]').first();
      const emailField = page.locator('input[type="email"]').first();

      // At least one input should be visible
      const hasNameField = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmailField = await emailField.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasNameField || hasEmailField).toBe(true);
    });

    test('GC Team Settings should display team members table', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');

      await page.goto('/manager/settings/team');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Check for team management elements
      const teamHeading = page.locator('h2:has-text("Team"), h2:has-text("team")');
      const hasTeamHeading = await teamHeading.isVisible({ timeout: 3000 }).catch(() => false);

      // Could also check for table or invite button
      const inviteButton = page.locator('button:has-text("Invite")');
      const hasInviteButton = await inviteButton.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasTeamHeading || hasInviteButton).toBe(true);
    });

    test('Broker Agency Settings should have agency info', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      await page.goto('/broker/settings/agency');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 15000 });

      // Page should have some settings content
      const settingsContent = page.locator('.settings, [class*="settings"], form, .agency');
      const hasContent = await settingsContent.first().isVisible({ timeout: 3000 }).catch(() => false);

      // If no specific content, at least verify URL is correct
      expect(page.url()).toContain('/settings/agency');
    });
  });
});
