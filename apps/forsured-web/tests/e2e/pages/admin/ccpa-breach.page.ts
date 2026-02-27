/**
 * CCPA Breach Notifications Page Object
 * CCPA breach page object
 *
 * Page object for the CCPA Breach Notifications at /admin/ccpa/breach
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class CCPABreachPage extends BasePage {
  readonly url = '/admin/ccpa/breach';

  // Page header
  readonly pageHeader: Locator;
  readonly breadcrumb: Locator;

  // Summary stats
  readonly totalBreachesCard: Locator;
  readonly activeBreachesCard: Locator;
  readonly resolvedBreachesCard: Locator;
  readonly avgResolutionTimeCard: Locator;

  // Breach list
  readonly breachTable: Locator;
  readonly breachRows: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;

  // Filters
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly severityFilter: Locator;
  readonly dateRangeFilter: Locator;

  // Actions
  readonly createBreachBtn: Locator;
  readonly exportBtn: Locator;
  readonly refreshBtn: Locator;

  // Create breach modal
  readonly createBreachModal: Locator;
  readonly breachTitleInput: Locator;
  readonly breachDescriptionInput: Locator;
  readonly severitySelect: Locator;
  readonly affectedUsersInput: Locator;
  readonly affectedDataSelect: Locator;
  readonly discoveredAtInput: Locator;
  readonly notifyUsersCheckbox: Locator;
  readonly notifyAuthoritiesCheckbox: Locator;

  // Breach detail elements
  readonly breachDetailHeader: Locator;
  readonly breachStatus: Locator;
  readonly breachSeverity: Locator;
  readonly breachAffectedCount: Locator;
  readonly breachTimeline: Locator;
  readonly breachActions: Locator;

  // Action buttons for breach
  readonly resolveBreachBtn: Locator;
  readonly escalateBreachBtn: Locator;
  readonly sendNotificationsBtn: Locator;
  readonly addUpdateBtn: Locator;
  readonly closeBreachBtn: Locator;

  // Resolution modal
  readonly resolutionModal: Locator;
  readonly resolutionNotesInput: Locator;
  readonly resolutionActionsInput: Locator;
  readonly preventionMeasuresInput: Locator;

  constructor(page: Page) {
    super(page);

    // Page header
    this.pageHeader = page.getByRole('heading', { name: /Breach Notifications|Data Breaches/i }).first();
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');

    // Summary stats
    this.totalBreachesCard = page.locator(':text("Total Breaches")').first();
    this.activeBreachesCard = page.locator(':text("Active")').first();
    this.resolvedBreachesCard = page.locator(':text("Resolved")').first();
    this.avgResolutionTimeCard = page.locator(':text("Avg Resolution")').first();

    // Breach list
    this.breachTable = page.locator('[data-testid="breach-table"], table').first();
    this.breachRows = page.locator('tbody tr, [data-testid="breach-row"]');
    this.emptyState = page.locator('[data-testid="empty-state"], :text("No breaches")');
    this.loadingState = page.locator('[data-testid="loading"], .loading-spinner');

    // Filters
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]').first();
    this.statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]').first();
    this.severityFilter = page.locator('[data-testid="severity-filter"], select[name="severity"]').first();
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');

    // Actions
    this.createBreachBtn = page.getByRole('button', { name: /report breach|create breach|new breach/i });
    this.exportBtn = page.getByRole('button', { name: /export/i });
    this.refreshBtn = page.getByRole('button', { name: /refresh/i });

    // Create breach modal
    this.createBreachModal = page.locator('[role="dialog"]:has-text("Report"), [role="dialog"]:has-text("Create Breach")');
    this.breachTitleInput = page.locator('input[name="title"], [data-testid="breach-title-input"]');
    this.breachDescriptionInput = page.locator('textarea[name="description"], [data-testid="breach-description-input"]');
    this.severitySelect = page.locator('select[name="severity"], [data-testid="severity-select"]');
    this.affectedUsersInput = page.locator('input[name="affectedUsers"], [data-testid="affected-users-input"]');
    this.affectedDataSelect = page.locator('[data-testid="affected-data-select"], select[name="affectedData"]');
    this.discoveredAtInput = page.locator('input[name="discoveredAt"], [data-testid="discovered-at-input"]');
    this.notifyUsersCheckbox = page.locator('input[type="checkbox"][name="notifyUsers"]');
    this.notifyAuthoritiesCheckbox = page.locator('input[type="checkbox"][name="notifyAuthorities"]');

    // Breach detail elements
    this.breachDetailHeader = page.getByRole('heading', { name: /Breach #|Breach Details/i });
    this.breachStatus = page.locator('[data-testid="breach-status"], .breach-status');
    this.breachSeverity = page.locator('[data-testid="breach-severity"], .breach-severity');
    this.breachAffectedCount = page.locator('[data-testid="affected-count"]');
    this.breachTimeline = page.locator('[data-testid="breach-timeline"], .breach-timeline');
    this.breachActions = page.locator('[data-testid="breach-actions"], .breach-actions');

    // Action buttons for breach
    this.resolveBreachBtn = page.getByRole('button', { name: /resolve/i });
    this.escalateBreachBtn = page.getByRole('button', { name: /escalate/i });
    this.sendNotificationsBtn = page.getByRole('button', { name: /send notifications|notify/i });
    this.addUpdateBtn = page.getByRole('button', { name: /add update|update/i });
    this.closeBreachBtn = page.getByRole('button', { name: /close breach/i });

    // Resolution modal
    this.resolutionModal = page.locator('[role="dialog"]:has-text("Resolve"), [role="dialog"]:has-text("Resolution")');
    this.resolutionNotesInput = page.locator('textarea[name="resolutionNotes"]');
    this.resolutionActionsInput = page.locator('textarea[name="actionsTaken"]');
    this.preventionMeasuresInput = page.locator('textarea[name="preventionMeasures"]');
  }

  async expectPageVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('breach', 'notification', 'data')).toBeTruthy();
  }

  async expectBreachListVisible() {
    await this.waitForLoading();
    const hasTable = await this.breachTable.isVisible().catch(() => false);
    const hasEmpty = await this.emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  }

  // Search & Filter
  async searchBreaches(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForLoading();
  }

  async filterBySeverity(severity: string) {
    await this.severityFilter.selectOption(severity);
    await this.waitForLoading();
  }

  // Breach count
  async getBreachCount(): Promise<number> {
    await this.waitForLoading();
    return await this.breachRows.count();
  }

  // Breach actions
  async clickViewBreach(index: number) {
    const viewBtn = this.breachRows.nth(index).getByRole('button', { name: /view|details/i });
    await viewBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickResolveBreach(index: number) {
    const resolveBtn = this.breachRows.nth(index).getByRole('button', { name: /resolve/i });
    await resolveBtn.click();
    await expect(this.resolutionModal).toBeVisible();
  }

  // Create breach
  async openCreateBreachModal() {
    await this.createBreachBtn.click();
    await expect(this.createBreachModal).toBeVisible();
  }

  async fillBreachForm(data: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers?: number;
    affectedData?: string[];
    discoveredAt?: string;
    notifyUsers?: boolean;
    notifyAuthorities?: boolean;
  }) {
    await this.breachTitleInput.fill(data.title);
    await this.breachDescriptionInput.fill(data.description);
    await this.severitySelect.selectOption(data.severity);

    if (data.affectedUsers !== undefined) {
      await this.affectedUsersInput.fill(String(data.affectedUsers));
    }

    if (data.affectedData?.length) {
      for (const dataType of data.affectedData) {
        await this.affectedDataSelect.selectOption(dataType);
      }
    }

    if (data.discoveredAt) {
      await this.discoveredAtInput.fill(data.discoveredAt);
    }

    if (data.notifyUsers !== undefined) {
      if (data.notifyUsers) {
        await this.notifyUsersCheckbox.check();
      } else {
        await this.notifyUsersCheckbox.uncheck();
      }
    }

    if (data.notifyAuthorities !== undefined) {
      if (data.notifyAuthorities) {
        await this.notifyAuthoritiesCheckbox.check();
      } else {
        await this.notifyAuthoritiesCheckbox.uncheck();
      }
    }
  }

  async submitBreachForm() {
    await this.page.getByRole('button', { name: /submit|create|report/i }).click();
    await this.waitForLoading();
  }

  async createBreach(data: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers?: number;
    affectedData?: string[];
    discoveredAt?: string;
    notifyUsers?: boolean;
    notifyAuthorities?: boolean;
  }) {
    await this.openCreateBreachModal();
    await this.fillBreachForm(data);
    await this.submitBreachForm();
  }

  // Resolution
  async resolveBreach(data: {
    notes: string;
    actionsTaken: string;
    preventionMeasures: string;
  }) {
    await this.resolveBreachBtn.click();
    await expect(this.resolutionModal).toBeVisible();
    await this.resolutionNotesInput.fill(data.notes);
    await this.resolutionActionsInput.fill(data.actionsTaken);
    await this.preventionMeasuresInput.fill(data.preventionMeasures);
    await this.page.getByRole('button', { name: /submit|resolve/i }).click();
    await this.waitForLoading();
  }

  async escalateBreach() {
    await this.escalateBreachBtn.click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
    await this.waitForLoading();
  }

  async sendNotifications() {
    await this.sendNotificationsBtn.click();
    await this.page.getByRole('button', { name: /confirm|send/i }).click();
    await this.waitForLoading();
  }

  // Navigation
  async navigateToBreachDetail(breachId: string) {
    await this.page.goto(`/admin/ccpa/breach/${breachId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToDashboard() {
    await this.page.getByRole('link', { name: /dashboard|back/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  // Getters
  async getBreachData(index: number): Promise<{
    title: string | null;
    status: string | null;
    severity: string | null;
    affectedCount: string | null;
    discoveredAt: string | null;
  }> {
    const row = this.breachRows.nth(index);
    return {
      title: await row.locator('[data-testid="breach-title"]').textContent().catch(() => null),
      status: await row.locator('[data-testid="breach-status"], .status-badge').textContent().catch(() => null),
      severity: await row.locator('[data-testid="breach-severity"], .severity-badge').textContent().catch(() => null),
      affectedCount: await row.locator('[data-testid="affected-count"]').textContent().catch(() => null),
      discoveredAt: await row.locator('[data-testid="discovered-at"]').textContent().catch(() => null),
    };
  }

  async hasActiveBreaches(): Promise<boolean> {
    const activeText = await this.activeBreachesCard.textContent();
    const match = activeText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) > 0 : false;
  }
}
