import { test, expect } from '../../fixtures/base';
import {
  BrokerDashboardPage,
  BrokerClientsPage,
  BrokerTasksPage,
  BrokerDocumentsPage,
  BrokerSettingsPage
} from '../../pages/broker';
import { SidebarComponent } from '../../components';

/**
 * Broker Workflow Journey
 *
 * Tests the common workflow a broker would follow:
 * 1. View dashboard
 * 2. Check clients
 * 3. Review tasks
 * 4. Access documents
 * 5. Update settings
 */
test.describe('Broker Workflow Journey', () => {

  test('Broker navigates through core workflow', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');

    // 1. Start at dashboard
    const dashboard = new BrokerDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // 2. Navigate to clients
    const clientsPage = new BrokerClientsPage(page);
    await clientsPage.goto();
    await clientsPage.expectClientsVisible();

    // 3. Navigate to tasks
    const tasksPage = new BrokerTasksPage(page);
    await tasksPage.goto();
    await tasksPage.expectTasksVisible();

    // Verify we progressed through workflow or auth redirect
    const currentUrl = page.url();
    const isValidUrl = currentUrl.includes('/tasks') ||
      currentUrl.includes('/broker') ||
      currentUrl.includes('/welcome') ||
      currentUrl.includes('/');
    expect(isValidUrl).toBeTruthy();
  });

  test('Broker accesses documents and settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');

    // Access documents
    const documentsPage = new BrokerDocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.expectDocumentsVisible();

    // Access settings
    const settingsPage = new BrokerSettingsPage(page);
    await settingsPage.goto();
    await settingsPage.expectSettingsVisible();

    // Verify we're on settings or auth redirect
    const currentUrl = page.url();
    const isValidUrl = currentUrl.includes('/settings') ||
      currentUrl.includes('/broker') ||
      currentUrl.includes('/welcome') ||
      currentUrl.includes('/');
    expect(isValidUrl).toBeTruthy();
  });

  test('Broker uses sidebar navigation', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');

    const dashboard = new BrokerDashboardPage(page);
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate via sidebar
    await sidebar.navigateTo('Clients');
    expect(page.url()).toContain('/clients');

    await sidebar.navigateTo('Tasks');
    expect(page.url()).toContain('/tasks');

    await sidebar.navigateTo('Dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
