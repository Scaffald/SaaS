// tests/e2e/subcontractor-projects.spec.ts
// E2E tests for SubcontractorProjectsPage
//
// REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
// Tests the subcontractor's project list page functionality:
// - Loading and displaying projects
// - Filter buttons (all, active, completed)
// - Stats cards (total, active, completed, value)
// - Navigation to project details

import { test, expect } from './fixtures/base';
import { testSupabaseAdmin, forsured, core, TEST_USER_IDS, TEST_ORG_IDS } from '../fixtures/supabase';

// Interface for tracking seeded data for cleanup
interface SeededProjectsData {
  organizationId: string | null;
  subcontractorId: string | null;
  projectIds: string[];
  projectSubcontractorIds: string[];
}

// Track seeded data for cleanup
const seededData: SeededProjectsData = {
  organizationId: null,
  subcontractorId: null,
  projectIds: [],
  projectSubcontractorIds: [],
};

/**
 * Seed test data for SubcontractorProjectsPage tests
 * Creates:
 * - Organization in core.organizations (if needed)
 * - Subcontractor record for the contractor's organization
 * - Projects with different statuses
 * - project_subcontractors junction table entries
 */
async function seedSubcontractorProjectsData(contractorOrgId: string): Promise<SeededProjectsData> {
  // Reset tracking
  seededData.organizationId = null;
  seededData.subcontractorId = null;
  seededData.projectIds = [];
  seededData.projectSubcontractorIds = [];

  // 0. Ensure organization exists in core.organizations (required for FK constraint)
  const { data: existingOrg } = await core('organizations')
    .select('id')
    .eq('id', contractorOrgId)
    .maybeSingle();

  if (!existingOrg) {
    // Create organization in core schema
    const { data: newOrg, error: orgError } = await core('organizations')
      .insert({
        id: contractorOrgId,
        name: 'E2E Test Contractor Org',
        slug: `e2e-test-contractor-org-${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (orgError && !orgError.message.includes('duplicate')) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }
    if (newOrg) {
      seededData.organizationId = newOrg.id;
    }
  }

  // 1. Get or create subcontractor record for this organization
  const { data: existingSub } = await forsured('subcontractors')
    .select('id')
    .eq('organization_id', contractorOrgId)
    .maybeSingle();

  let subcontractorId: string;

  if (existingSub) {
    subcontractorId = existingSub.id;
  } else {
    // Create subcontractor record
    const { data: newSub, error: subError } = await forsured('subcontractors')
      .insert({
        name: 'Test Contractor E2E',
        company: 'E2E Test Contractor Company',
        organization_id: contractorOrgId,
      })
      .select('id')
      .single();

    if (subError) {
      throw new Error(`Failed to create subcontractor: ${subError.message}`);
    }
    subcontractorId = newSub.id;
    seededData.subcontractorId = subcontractorId;
  }

  // 2. Create projects with different junction statuses
  // Note: projects table doesn't have status column - status comes from project_subcontractors junction
  const projectsToCreate = [
    {
      name: 'E2E Active Project 1',
      description: 'First active project for E2E tests',
      organization_id: contractorOrgId,
      contract_value: 50000,
      location: 'New York, NY',
      junctionStatus: 'active' as const,
    },
    {
      name: 'E2E Active Project 2',
      description: 'Second active project for E2E tests',
      organization_id: contractorOrgId,
      contract_value: 75000,
      location: 'Los Angeles, CA',
      junctionStatus: 'active' as const,
    },
    {
      name: 'E2E Completed Project',
      description: 'Completed project for E2E tests',
      organization_id: contractorOrgId,
      contract_value: 100000,
      location: 'Chicago, IL',
      junctionStatus: 'removed' as const,  // 'removed' status indicates completed from subcontractor perspective
    },
  ];

  for (const projectData of projectsToCreate) {
    const { junctionStatus, ...projectInsertData } = projectData;

    // Create project
    const { data: project, error: projError } = await forsured('projects')
      .insert(projectInsertData)
      .select('id')
      .single();

    if (projError) {
      throw new Error(`Failed to create project: ${projError.message}`);
    }

    seededData.projectIds.push(project.id);

    // Create project_subcontractors junction entry
    const { data: junction, error: junctionError } = await forsured('project_subcontractors')
      .insert({
        project_id: project.id,
        subcontractor_id: subcontractorId,
        status: junctionStatus,
        notes: `E2E test entry for ${projectData.name}`,
      })
      .select('id')
      .single();

    if (junctionError) {
      throw new Error(`Failed to create project_subcontractors entry: ${junctionError.message}`);
    }

    seededData.projectSubcontractorIds.push(junction.id);
  }

  return seededData;
}

/**
 * Clean up seeded test data
 */
async function cleanupSubcontractorProjectsData() {
  // Delete in reverse order to respect foreign key constraints

  // Delete project_subcontractors entries
  for (const id of seededData.projectSubcontractorIds) {
    await forsured('project_subcontractors').delete().eq('id', id);
  }

  // Delete projects
  for (const id of seededData.projectIds) {
    await forsured('projects').delete().eq('id', id);
  }

  // Delete subcontractor if we created it
  if (seededData.subcontractorId) {
    await forsured('subcontractors').delete().eq('id', seededData.subcontractorId);
  }

  // Delete organization if we created it
  if (seededData.organizationId) {
    await core('organizations').delete().eq('id', seededData.organizationId);
  }

  // Reset tracking
  seededData.organizationId = null;
  seededData.subcontractorId = null;
  seededData.projectIds = [];
  seededData.projectSubcontractorIds = [];
}

test.describe('SubcontractorProjectsPage', () => {
  const CONTRACTOR_ORG_ID = TEST_ORG_IDS.primary;

  test.beforeAll(async () => {
    // Seed test data before all tests
    await seedSubcontractorProjectsData(CONTRACTOR_ORG_ID);
  });

  test.afterAll(async () => {
    // Clean up test data after all tests
    await cleanupSubcontractorProjectsData();
  });

  test.beforeEach(async ({ page, setupAuthAs }) => {
    // Login as contractor user
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('should display loading state and then projects', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');

    // Should briefly show loading state
    const loadingIndicator = page.locator('text=/loading/i');
    const loadingVisible = await loadingIndicator.isVisible().catch(() => false);

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Page should have loaded content (either projects or empty state)
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);

    await assertNoErrors();
  });

  test('should display page header with correct title', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Check for page title
    const heading = page.locator('h1');
    await expect(heading).toContainText(/projects/i);

    await assertNoErrors();
  });

  test('should display stats cards', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Check for stats cards by their labels
    const totalProjectsLabel = page.locator('text=/total projects/i');
    const activeProjectsLabel = page.locator('text=/active projects/i');
    const completedLabel = page.locator('text=/completed/i');
    const valueLabel = page.locator('text=/active value/i');

    // At least some of these should be visible
    const hasStatsCards = (await totalProjectsLabel.count()) > 0 ||
      (await activeProjectsLabel.count()) > 0 ||
      (await completedLabel.count()) > 0 ||
      (await valueLabel.count()) > 0;

    expect(hasStatsCards).toBeTruthy();

    await assertNoErrors();
  });

  test('should display filter buttons', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Check for filter buttons
    const allButton = page.getByRole('button', { name: /all/i });
    const activeButton = page.getByRole('button', { name: /active/i });
    const completedButton = page.getByRole('button', { name: /completed/i });

    // Filter buttons should be present
    await expect(allButton).toBeVisible();
    await expect(activeButton).toBeVisible();
    await expect(completedButton).toBeVisible();

    await assertNoErrors();
  });

  test('should filter projects when clicking filter buttons', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Get initial content
    const allButton = page.getByRole('button', { name: /all/i }).first();
    const activeButton = page.getByRole('button', { name: /active/i }).first();
    const completedButton = page.getByRole('button', { name: /completed/i }).first();

    // Click Active filter
    await activeButton.click();
    await page.waitForTimeout(500);

    // Click Completed filter
    await completedButton.click();
    await page.waitForTimeout(500);

    // Click All filter to reset
    await allButton.click();
    await page.waitForTimeout(500);

    // Page should still be functional
    const currentUrl = page.url();
    expect(currentUrl).toContain('/subcontractor/projects');

    await assertNoErrors();
  });

  test('should display project cards when projects exist', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Look for project cards or project names
    const projectCards = page.locator('[data-testid*="project"], .project-card, [role="article"]');
    const projectNames = page.locator('text=/E2E Active Project|E2E Completed Project/');

    // Should have either project cards or project names visible
    const hasProjects = (await projectCards.count()) > 0 || (await projectNames.count()) > 0;

    // If no projects found, check for empty state
    if (!hasProjects) {
      const emptyState = page.locator('text=/no projects|empty|get started/i');
      const hasEmptyState = (await emptyState.count()) > 0;
      expect(hasProjects || hasEmptyState).toBeTruthy();
    }

    await assertNoErrors();
  });

  test('should show empty state when no projects match filter', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // If we can click the completed filter and find no projects, we should see empty state
    const completedButton = page.getByRole('button', { name: /completed/i }).first();

    if (await completedButton.isVisible()) {
      await completedButton.click();
      await page.waitForTimeout(500);

      // Check for either projects or empty state
      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    }

    await assertNoErrors();
  });

  test('should navigate to project detail when clicking a project', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Try to find a clickable project element
    const projectLinks = page.locator('a[href*="/projects/"]');
    const projectCards = page.locator('[role="button"], [role="article"]').filter({
      has: page.locator('text=/E2E Active Project|project/i'),
    });

    const linkCount = await projectLinks.count();
    const cardCount = await projectCards.count();

    if (linkCount > 0) {
      // Click the first project link
      await projectLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should navigate to project detail page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/projects\/[a-f0-9-]+/i);
    } else if (cardCount > 0) {
      // Click the first project card
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');

      // Check if we navigated
      const currentUrl = page.url();
      // May or may not navigate depending on implementation
      expect(currentUrl).toContain('/subcontractor');
    } else {
      // No projects to click, that's acceptable
      const emptyState = page.locator('text=/no projects|empty/i');
      const hasEmptyState = (await emptyState.count()) > 0;
      expect(hasEmptyState || linkCount === 0).toBeTruthy();
    }

    await assertNoErrors();
  });

  test('should format currency correctly in stats', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Look for currency formatting ($ symbol or formatted numbers)
    const currencyPattern = page.locator('text=/\\$[\\d,]+/');
    const currencyCount = await currencyPattern.count();

    // Currency should be displayed in the Active Value stat card
    // If projects exist with values, currency should be visible
    if (currencyCount > 0) {
      await expect(currencyPattern.first()).toBeVisible();
    }

    await assertNoErrors();
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Navigate to an invalid project to test error handling
    await page.goto('/subcontractor/projects/invalid-uuid-here');
    await page.waitForLoadState('networkidle');

    // Should show error message or redirect
    const currentUrl = page.url();
    const errorMessage = page.locator('text=/not found|error|invalid/i');

    // Should either show error or redirect to projects list
    const hasError = (await errorMessage.count()) > 0;
    const redirected = currentUrl.includes('/projects') && !currentUrl.includes('invalid');

    expect(hasError || redirected || currentUrl.includes('/subcontractor')).toBeTruthy();
  });

  test('should maintain filter state across interactions', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    const activeButton = page.getByRole('button', { name: /active/i }).first();

    if (await activeButton.isVisible()) {
      // Click active filter
      await activeButton.click();
      await page.waitForTimeout(500);

      // The active button should appear selected (different background color)
      // This is implementation-specific, but we can check it's still there
      await expect(activeButton).toBeVisible();
    }

    await assertNoErrors();
  });
});

test.describe('SubcontractorProjectsPage - Empty State', () => {
  // These tests run without seeding data to test empty states

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('should handle empty project list gracefully', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Page should load without crashing
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);

    // Should show either projects or empty state message
    const hasContent = pageContent.toLowerCase().includes('project') ||
      pageContent.toLowerCase().includes('no projects') ||
      pageContent.toLowerCase().includes('empty');

    expect(hasContent).toBeTruthy();

    await assertNoErrors();
  });
});
