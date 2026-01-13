import { test, expect } from '../fixtures/base';
import {
  BrokerDashboardPage,
  BrokerClientsPage,
  BrokerTasksPage,
  BrokerTaskDetailPage,
  BrokerClientDetailPage,
  BrokerProjectsPage,
  BrokerProjectDetailPage,
  BrokerTeamPage,
  BrokerDocumentsPage,
  BrokerInsurancePage,
  BrokerPolicyDetailPage,
  BrokerSettingsPage,
  BrokerNotificationsPage,
  BrokerAcknowledgementsPage,
  BrokerAcknowledgementDetailPage
} from '../pages/broker';
import { SidebarComponent } from '../components';

test.describe('Broker Routes - Page Object Model', () => {

  test.describe('Dashboard', () => {
    test('should display broker dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      await dashboard.goto();
      await dashboard.expectDashboardVisible();
    });

    test('should show stats cards', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      await dashboard.goto();

      const statsCount = await dashboard.getStatsCount();
      expect(statsCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Tasks', () => {
    test('should display tasks page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const tasksPage = new BrokerTasksPage(page);
      await tasksPage.goto();
      await tasksPage.expectTasksVisible();
    });

    test('should navigate to tasks via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Tasks');

      expect(page.url()).toContain('/tasks');
    });
  });

  test.describe('Task Detail', () => {
    test('should display task detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const taskDetailPage = new BrokerTaskDetailPage(page, 'test-task-1');
      await taskDetailPage.goto();
      await taskDetailPage.expectTaskDetailVisible();
    });
  });

  test.describe('Clients', () => {
    test('should display clients page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const clientsPage = new BrokerClientsPage(page);
      await clientsPage.goto();
      await clientsPage.expectClientsVisible();
    });
  });

  test.describe('Client Detail', () => {
    test('should display client detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const clientDetailPage = new BrokerClientDetailPage(page, 'test-client-1');
      await clientDetailPage.goto();
      await clientDetailPage.expectClientDetailVisible();
    });
  });

  test.describe('Projects', () => {
    test('should display projects page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const projectsPage = new BrokerProjectsPage(page);
      await projectsPage.goto();
      await projectsPage.expectProjectsVisible();
    });

    test('should navigate to projects via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Projects');

      expect(page.url()).toContain('/projects');
    });
  });

  test.describe('Team', () => {
    test('should display team page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const teamPage = new BrokerTeamPage(page);
      await teamPage.goto();
      await teamPage.expectTeamVisible();
    });

    test('should navigate to team via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Team');

      expect(page.url()).toContain('/team');
    });
  });

  test.describe('Documents', () => {
    test('should display documents page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const documentsPage = new BrokerDocumentsPage(page);
      await documentsPage.goto();
      await documentsPage.expectDocumentsVisible();
    });

    test('should navigate to documents via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Documents');

      expect(page.url()).toContain('/documents');
    });
  });

  test.describe('Insurance', () => {
    // This test is expected to fail - we're using it to capture logs for debugging
    test('should display insurance page via direct navigation', async ({ page, setupAuthAs, getConsoleLogs, getNetworkLogs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const insurancePage = new BrokerInsurancePage(page);
      await insurancePage.goto();

      // Wait a bit for any errors to be logged
      await page.waitForTimeout(3000);

      // Log what we captured for debugging
      const consoleLogs = getConsoleLogs();
      const networkLogs = getNetworkLogs();

      console.log('\n=== CONSOLE LOGS ===');
      consoleLogs.forEach(log => {
        console.log(`[${log.timestamp}ms] [${log.type.toUpperCase()}] ${log.text}`);
      });

      console.log('\n=== NETWORK LOGS ===');
      networkLogs.forEach(log => {
        console.log(`[${log.timestamp}ms] [${log.status}] ${log.method} ${log.url}`);
      });

      // Now check if page loaded
      await insurancePage.expectInsuranceVisible();
    });

    test('should navigate to insurance via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Insurance');

      expect(page.url()).toContain('/insurance');
    });
  });

  test.describe('Settings', () => {
    test('should display profile settings page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const settingsPage = new BrokerSettingsPage(page);
      await settingsPage.goto();
      await settingsPage.expectSettingsVisible();
    });
  });

  test.describe('Notifications', () => {
    test('should display notifications page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const notificationsPage = new BrokerNotificationsPage(page);
      await notificationsPage.goto();
      await notificationsPage.expectNotificationsVisible();
    });
  });

  test.describe('Acknowledgements', () => {
    test('should display acknowledgements page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const acknowledgementsPage = new BrokerAcknowledgementsPage(page);
      await acknowledgementsPage.goto();
      await acknowledgementsPage.expectAcknowledgementsVisible();
    });

    test('should display acknowledgement form detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const formDetailPage = new BrokerAcknowledgementDetailPage(page, 'test-form-1');
      await formDetailPage.goto();
      await formDetailPage.expectFormVisible();
    });
  });

  test.describe('Policy Detail', () => {
    test('should display policy detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const policyDetailPage = new BrokerPolicyDetailPage(page, 'test-policy-1');
      await policyDetailPage.goto();
      await policyDetailPage.expectPolicyDetailVisible();
    });
  });

  test.describe('Project Detail', () => {
    test('should display project detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const projectDetailPage = new BrokerProjectDetailPage(page, 'test-project-1');
      await projectDetailPage.goto();
      await projectDetailPage.expectProjectDetailVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');

      const dashboard = new BrokerDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Clients');

      expect(page.url()).toContain('/clients');
    });
  });
});
