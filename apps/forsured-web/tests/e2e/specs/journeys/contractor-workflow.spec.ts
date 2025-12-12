import { test, expect } from '../../fixtures/base';
import {
  ContractorDashboardPage,
  ContractorProjectsPage,
  ContractorDocumentsPage,
  ContractorRelationshipsPage,
  ContractorSettingsPage
} from '../../pages/contractor';
import { SidebarComponent } from '../../components';

/**
 * Contractor Workflow Journey
 *
 * Tests the common workflow a contractor would follow:
 * 1. View dashboard
 * 2. Check projects
 * 3. View manager relationships
 * 4. Access documents
 * 5. Update settings
 */
test.describe('Contractor Workflow Journey', () => {

  test('Contractor navigates through core workflow', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');

    // 1. Start at dashboard
    const dashboard = new ContractorDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // 2. Navigate to projects
    const projectsPage = new ContractorProjectsPage(page);
    await projectsPage.goto();
    await projectsPage.expectProjectsVisible();

    // 3. Navigate to relationships/managers
    const relationshipsPage = new ContractorRelationshipsPage(page);
    await relationshipsPage.goto();
    await relationshipsPage.expectRelationshipsVisible();

    // Verify we progressed through workflow
    expect(page.url()).toContain('/relationships');
  });

  test('Contractor accesses documents and settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');

    // Access documents
    const documentsPage = new ContractorDocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.expectDocumentsVisible();

    // Access settings
    const settingsPage = new ContractorSettingsPage(page);
    await settingsPage.goto();
    await settingsPage.expectSettingsVisible();

    expect(page.url()).toContain('/settings');
  });

  test('Contractor uses sidebar navigation', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');

    const dashboard = new ContractorDashboardPage(page);
    const sidebar = new SidebarComponent(page);

    // Start at dashboard
    await dashboard.goto();
    await dashboard.expectDashboardVisible();

    // Navigate via sidebar
    await sidebar.navigateTo('Projects');
    expect(page.url()).toContain('/projects');

    await sidebar.navigateTo('Documents');
    expect(page.url()).toContain('/documents');

    await sidebar.navigateTo('Dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
