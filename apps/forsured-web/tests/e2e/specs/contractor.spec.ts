import { test, expect } from '../fixtures/base';
import {
  ContractorDashboardPage,
  ContractorRelationshipsPage,
  ContractorProjectsPage,
  ContractorProjectDetailPage,
  ContractorDocumentsPage,
  ContractorSettingsPage,
  ContractorNotificationsPage,
  ContractorTasksPage
} from '../pages/contractor';
import { SidebarComponent } from '../components';

test.describe('Contractor/Subcontractor Routes - Page Object Model', () => {

  test.describe('Dashboard', () => {
    test('should display contractor dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const dashboard = new ContractorDashboardPage(page);
      await dashboard.goto();
      await dashboard.expectDashboardVisible();
    });
  });

  test.describe('Relationships/Managers', () => {
    test('should display relationships page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const relationshipsPage = new ContractorRelationshipsPage(page);
      await relationshipsPage.goto();
      await relationshipsPage.expectRelationshipsVisible();
    });

    test('should navigate to managers via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const dashboard = new ContractorDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Managers');

      expect(page.url()).toContain('/relationships');
    });
  });

  test.describe('Projects', () => {
    test('should display projects page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const projectsPage = new ContractorProjectsPage(page);
      await projectsPage.goto();
      await projectsPage.expectProjectsVisible();
    });

    test('should navigate to projects via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const dashboard = new ContractorDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Projects');

      expect(page.url()).toContain('/projects');
    });
  });

  test.describe('Documents', () => {
    test('should display documents page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const documentsPage = new ContractorDocumentsPage(page);
      await documentsPage.goto();
      await documentsPage.expectDocumentsVisible();
    });

    test('should navigate to documents via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const dashboard = new ContractorDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await dashboard.expectDashboardVisible();
      await sidebar.navigateTo('Documents');

      expect(page.url()).toContain('/documents');
    });
  });

  test.describe('Settings', () => {
    test('should display settings page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const settingsPage = new ContractorSettingsPage(page);
      await settingsPage.goto();
      await settingsPage.expectSettingsVisible();
    });
  });

  test.describe('Notifications', () => {
    test('should display notifications page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const notificationsPage = new ContractorNotificationsPage(page);
      await notificationsPage.goto();
      await notificationsPage.expectNotificationsVisible();
    });
  });

  test.describe('Tasks', () => {
    test('should display tasks page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const tasksPage = new ContractorTasksPage(page);
      await tasksPage.goto();
      await tasksPage.expectTasksVisible();
    });
  });

  test.describe('Project Detail', () => {
    test('should display project detail page', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const projectDetailPage = new ContractorProjectDetailPage(page, 'test-project-1');
      await projectDetailPage.goto();
      await projectDetailPage.expectProjectDetailVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate via sidebar', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');

      const dashboard = new ContractorDashboardPage(page);
      const sidebar = new SidebarComponent(page);

      await dashboard.goto();
      await sidebar.navigateTo('Projects');

      expect(page.url()).toContain('/projects');
    });
  });
});
