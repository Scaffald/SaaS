/**
 * CCPA Apps Configuration Page Object
 * CCPA apps page object
 *
 * Page object for the CCPA OAuth App Configuration at /admin/ccpa/apps
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class CCPAAppsPage extends BasePage {
  readonly url = '/admin/ccpa/apps';

  // Page header
  readonly pageHeader: Locator;
  readonly breadcrumb: Locator;

  // App list
  readonly appsTable: Locator;
  readonly appRows: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;

  // Filters & Search
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly categoryFilter: Locator;

  // Actions
  readonly addAppBtn: Locator;
  readonly refreshBtn: Locator;
  readonly exportBtn: Locator;

  // App card/row elements
  readonly appName: Locator;
  readonly appDescription: Locator;
  readonly appStatus: Locator;
  readonly appDataCategories: Locator;
  readonly appLastAccess: Locator;

  // Modals
  readonly addAppModal: Locator;
  readonly editAppModal: Locator;
  readonly configureModal: Locator;
  readonly revokeModal: Locator;

  // Form fields
  readonly appNameInput: Locator;
  readonly appDescriptionInput: Locator;
  readonly dataCategoriesSelect: Locator;
  readonly retentionPeriodInput: Locator;
  readonly requireConsentCheckbox: Locator;
  readonly enabledToggle: Locator;

  constructor(page: Page) {
    super(page);

    // Page header
    this.pageHeader = page.getByRole('heading', { name: /OAuth Apps|App Configuration|Connected Apps/i }).first();
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');

    // App list
    this.appsTable = page.locator('[data-testid="apps-table"], table, .apps-grid').first();
    this.appRows = page.locator('tbody tr, [data-testid="app-row"], [data-testid="app-card"]');
    this.emptyState = page.locator('[data-testid="empty-state"], :text("No apps")');
    this.loadingState = page.locator('[data-testid="loading"], .loading-spinner');

    // Filters & Search
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]').first();
    this.statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]').first();
    this.categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]').first();

    // Actions
    this.addAppBtn = page.getByRole('button', { name: /add app|register app/i });
    this.refreshBtn = page.getByRole('button', { name: /refresh/i });
    this.exportBtn = page.getByRole('button', { name: /export/i });

    // App card/row elements
    this.appName = page.locator('[data-testid="app-name"]');
    this.appDescription = page.locator('[data-testid="app-description"]');
    this.appStatus = page.locator('[data-testid="app-status"], .status-badge');
    this.appDataCategories = page.locator('[data-testid="app-data-categories"]');
    this.appLastAccess = page.locator('[data-testid="app-last-access"]');

    // Modals
    this.addAppModal = page.locator('[role="dialog"]:has-text("Add App"), [role="dialog"]:has-text("Register")');
    this.editAppModal = page.locator('[role="dialog"]:has-text("Edit App")');
    this.configureModal = page.locator('[role="dialog"]:has-text("Configure")');
    this.revokeModal = page.locator('[role="dialog"]:has-text("Revoke")');

    // Form fields
    this.appNameInput = page.locator('input[name="name"], [data-testid="app-name-input"]');
    this.appDescriptionInput = page.locator('textarea[name="description"], [data-testid="app-description-input"]');
    this.dataCategoriesSelect = page.locator('[data-testid="data-categories-select"], select[name="categories"]');
    this.retentionPeriodInput = page.locator('input[name="retention"], [data-testid="retention-input"]');
    this.requireConsentCheckbox = page.locator('input[type="checkbox"][name="requireConsent"]');
    this.enabledToggle = page.locator('[data-testid="enabled-toggle"], input[type="checkbox"][name="enabled"]');
  }

  async expectPageVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('apps', 'oauth', 'configuration')).toBeTruthy();
  }

  async expectAppsListVisible() {
    await this.waitForLoading();
    const hasTable = await this.appsTable.isVisible().catch(() => false);
    const hasEmpty = await this.emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  }

  // Search & Filter
  async searchApps(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForLoading();
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForLoading();
  }

  // App count
  async getAppCount(): Promise<number> {
    await this.waitForLoading();
    return await this.appRows.count();
  }

  // App actions
  async clickViewApp(index: number) {
    const viewBtn = this.appRows.nth(index).getByRole('button', { name: /view|details/i });
    await viewBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEditApp(index: number) {
    const editBtn = this.appRows.nth(index).getByRole('button', { name: /edit|configure/i });
    await editBtn.click();
    await expect(this.editAppModal.or(this.configureModal)).toBeVisible();
  }

  async clickRevokeApp(index: number) {
    const revokeBtn = this.appRows.nth(index).getByRole('button', { name: /revoke|disable/i });
    await revokeBtn.click();
    await expect(this.revokeModal).toBeVisible();
  }

  // Add app
  async openAddAppModal() {
    await this.addAppBtn.click();
    await expect(this.addAppModal).toBeVisible();
  }

  async fillAppForm(data: {
    name: string;
    description?: string;
    categories?: string[];
    retentionDays?: number;
    requireConsent?: boolean;
    enabled?: boolean;
  }) {
    await this.appNameInput.fill(data.name);

    if (data.description) {
      await this.appDescriptionInput.fill(data.description);
    }

    if (data.categories?.length) {
      for (const category of data.categories) {
        await this.dataCategoriesSelect.selectOption(category);
      }
    }

    if (data.retentionDays !== undefined) {
      await this.retentionPeriodInput.fill(String(data.retentionDays));
    }

    if (data.requireConsent !== undefined) {
      if (data.requireConsent) {
        await this.requireConsentCheckbox.check();
      } else {
        await this.requireConsentCheckbox.uncheck();
      }
    }

    if (data.enabled !== undefined) {
      if (data.enabled) {
        await this.enabledToggle.check();
      } else {
        await this.enabledToggle.uncheck();
      }
    }
  }

  async submitAppForm() {
    await this.page.getByRole('button', { name: /save|submit|create|add/i }).click();
    await this.waitForLoading();
  }

  async addApp(data: {
    name: string;
    description?: string;
    categories?: string[];
    retentionDays?: number;
    requireConsent?: boolean;
    enabled?: boolean;
  }) {
    await this.openAddAppModal();
    await this.fillAppForm(data);
    await this.submitAppForm();
  }

  // Revoke app
  async confirmRevoke() {
    await this.page.getByRole('button', { name: /confirm|revoke|yes/i }).click();
    await this.waitForLoading();
  }

  async cancelRevoke() {
    await this.page.getByRole('button', { name: /cancel|no/i }).click();
  }

  // Navigation
  async navigateToAppDetail(appId: string) {
    await this.page.goto(`/admin/ccpa/apps/${appId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToDashboard() {
    await this.page.getByRole('link', { name: /dashboard|back/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  // Getters
  async getAppData(index: number): Promise<{
    name: string | null;
    description: string | null;
    status: string | null;
    categories: string | null;
  }> {
    const row = this.appRows.nth(index);
    return {
      name: await row.locator('[data-testid="app-name"]').textContent().catch(() => null),
      description: await row.locator('[data-testid="app-description"]').textContent().catch(() => null),
      status: await row.locator('[data-testid="app-status"], .status-badge').textContent().catch(() => null),
      categories: await row.locator('[data-testid="app-data-categories"]').textContent().catch(() => null),
    };
  }
}
