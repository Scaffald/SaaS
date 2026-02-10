/**
 * CCPA Requests List Page Object
 * CCPA requests page object
 *
 * Page object for the CCPA Requests List at /admin/ccpa/requests
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class CCPARequestsPage extends BasePage {
  readonly url = '/admin/ccpa/requests';

  // Page header
  readonly pageHeader: Locator;
  readonly breadcrumb: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;
  readonly searchInput: Locator;
  readonly dateRangeFilter: Locator;
  readonly clearFiltersBtn: Locator;

  // Bulk actions
  readonly selectAllCheckbox: Locator;
  readonly bulkActionsMenu: Locator;
  readonly bulkAssignBtn: Locator;
  readonly bulkStatusBtn: Locator;
  readonly selectedCount: Locator;

  // Request table
  readonly requestTable: Locator;
  readonly requestRows: Locator;
  readonly tableHeaders: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;

  // Pagination
  readonly prevPageBtn: Locator;
  readonly nextPageBtn: Locator;
  readonly pageInfo: Locator;

  // Modals
  readonly assignModal: Locator;
  readonly statusModal: Locator;
  readonly bulkAssignModal: Locator;
  readonly bulkStatusModal: Locator;

  constructor(page: Page) {
    super(page);

    // Page header
    this.pageHeader = page.getByRole('heading', { name: /CCPA Requests|All Requests/i }).first();
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');

    // Filters
    this.statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]').first();
    this.typeFilter = page.locator('[data-testid="type-filter"], select[name="type"]').first();
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i], input[type="search"]').first();
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    this.clearFiltersBtn = page.getByRole('button', { name: /clear filters/i });

    // Bulk actions
    this.selectAllCheckbox = page.locator('[data-testid="select-all"], input[type="checkbox"]').first();
    this.bulkActionsMenu = page.locator('[data-testid="bulk-actions"], .bulk-actions');
    this.bulkAssignBtn = page.getByRole('button', { name: /bulk assign|assign selected/i });
    this.bulkStatusBtn = page.getByRole('button', { name: /bulk status|change status/i });
    this.selectedCount = page.locator('[data-testid="selected-count"], :text("selected")');

    // Request table
    this.requestTable = page.locator('[data-testid="requests-table"], table').first();
    this.requestRows = page.locator('tbody tr, [data-testid="request-row"]');
    this.tableHeaders = page.locator('thead th, [data-testid="table-header"]');
    this.emptyState = page.locator('[data-testid="empty-state"], :text("No requests")');
    this.loadingState = page.locator('[data-testid="loading"], .loading-spinner');

    // Pagination
    this.prevPageBtn = page.getByRole('button', { name: /previous|prev/i });
    this.nextPageBtn = page.getByRole('button', { name: /next/i });
    this.pageInfo = page.locator('[data-testid="page-info"], :text(/page \\d+/i)');

    // Modals
    this.assignModal = page.locator('[data-testid="assign-modal"], [role="dialog"]:has-text("Assign")');
    this.statusModal = page.locator('[data-testid="status-modal"], [role="dialog"]:has-text("Status")');
    this.bulkAssignModal = page.locator('[data-testid="bulk-assign-modal"], [role="dialog"]:has-text("Bulk Assign")');
    this.bulkStatusModal = page.locator('[data-testid="bulk-status-modal"], [role="dialog"]:has-text("Bulk Status")');
  }

  async expectPageVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('requests', 'ccpa')).toBeTruthy();
  }

  async expectTableVisible() {
    await this.waitForLoading();
    const hasTable = await this.requestTable.isVisible().catch(() => false);
    const hasEmpty = await this.emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  }

  // Filter methods
  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForLoading();
  }

  async filterByType(type: string) {
    await this.typeFilter.selectOption(type);
    await this.waitForLoading();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  async clearFilters() {
    if (await this.clearFiltersBtn.isVisible()) {
      await this.clearFiltersBtn.click();
      await this.waitForLoading();
    }
  }

  // Selection methods
  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  async deselectAll() {
    await this.selectAllCheckbox.uncheck();
  }

  async selectRequest(index: number) {
    const checkbox = this.requestRows.nth(index).locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // Table methods
  async getRequestCount(): Promise<number> {
    await this.waitForLoading();
    return await this.requestRows.count();
  }

  async getRequestRowData(index: number): Promise<{
    id: string | null;
    userEmail: string | null;
    type: string | null;
    status: string | null;
    createdAt: string | null;
  }> {
    const row = this.requestRows.nth(index);
    return {
      id: await row.locator('[data-testid="request-id"]').textContent().catch(() => null),
      userEmail: await row.locator('[data-testid="user-email"]').textContent().catch(() => null),
      type: await row.locator('[data-testid="request-type"]').textContent().catch(() => null),
      status: await row.locator('[data-testid="request-status"]').textContent().catch(() => null),
      createdAt: await row.locator('[data-testid="created-at"]').textContent().catch(() => null),
    };
  }

  async clickViewRequest(index: number) {
    const viewBtn = this.requestRows.nth(index).getByRole('button', { name: /view/i });
    await viewBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEditRequest(index: number) {
    const editBtn = this.requestRows.nth(index).getByRole('button', { name: /edit/i });
    await editBtn.click();
  }

  async clickAssignRequest(index: number) {
    const assignBtn = this.requestRows.nth(index).getByRole('button', { name: /assign/i });
    await assignBtn.click();
    await expect(this.assignModal).toBeVisible();
  }

  // Bulk operations
  async openBulkAssign() {
    await this.bulkAssignBtn.click();
    await expect(this.bulkAssignModal).toBeVisible();
  }

  async openBulkStatusChange() {
    await this.bulkStatusBtn.click();
    await expect(this.bulkStatusModal).toBeVisible();
  }

  async performBulkAssign(userId: string) {
    await this.openBulkAssign();
    await this.page.locator('[data-testid="assignee-select"], select[name="assignee"]').selectOption(userId);
    await this.page.getByRole('button', { name: /confirm|assign/i }).click();
    await this.waitForLoading();
  }

  async performBulkStatusChange(status: string) {
    await this.openBulkStatusChange();
    await this.page.locator('[data-testid="status-select"], select[name="status"]').selectOption(status);
    await this.page.getByRole('button', { name: /confirm|update/i }).click();
    await this.waitForLoading();
  }

  // Pagination
  async goToNextPage() {
    if (await this.nextPageBtn.isEnabled()) {
      await this.nextPageBtn.click();
      await this.waitForLoading();
    }
  }

  async goToPrevPage() {
    if (await this.prevPageBtn.isEnabled()) {
      await this.prevPageBtn.click();
      await this.waitForLoading();
    }
  }

  // Navigation
  async navigateToRequest(requestId: string) {
    await this.page.goto(`/admin/ccpa/requests/${requestId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToDashboard() {
    await this.page.getByRole('link', { name: /dashboard|back/i }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
