import { test, expect } from '../fixtures/base';
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminBrokersPage,
  AdminEnumsPage,
  AdminAuditLogPage,
  AdminCompaniesPage,
  AdminSettingsPage
} from '../pages/admin';

test.describe('Admin Routes - Page Object Model', () => {

  test.describe('Dashboard', () => {
    test('should display admin dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const dashboard = new AdminDashboardPage(page);
      await dashboard.goto();
      await dashboard.expectDashboardVisible();
    });
  });

  test.describe('Users', () => {
    test('should display users page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const usersPage = new AdminUsersPage(page);
      await usersPage.goto();
      await usersPage.expectUsersVisible();
    });
  });

  test.describe('Brokers', () => {
    test('should display brokers page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const brokersPage = new AdminBrokersPage(page);
      await brokersPage.goto();
      await brokersPage.expectBrokersVisible();
    });
  });

  test.describe('Enums', () => {
    test('should display enums page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const enumsPage = new AdminEnumsPage(page);
      await enumsPage.goto();
      await enumsPage.expectEnumsVisible();
    });
  });

  test.describe('Audit Log', () => {
    test('should display audit log page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const auditLogPage = new AdminAuditLogPage(page);
      await auditLogPage.goto();
      await auditLogPage.expectAuditLogVisible();
    });
  });

  test.describe('Companies', () => {
    test('should display companies page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const companiesPage = new AdminCompaniesPage(page);
      await companiesPage.goto();
      await companiesPage.expectCompaniesVisible();
    });
  });

  test.describe('Settings', () => {
    test('should display settings page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'admin@test.forsured.com');

      const settingsPage = new AdminSettingsPage(page);
      await settingsPage.goto();
      await settingsPage.expectSettingsVisible();
    });
  });
});
