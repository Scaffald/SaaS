/**
 * CCPA Dashboard Page Object
 * REQ-6, TASK-11: E2E Tests for CCPA Admin Pages
 *
 * Page object for the main CCPA Compliance Dashboard at /admin/ccpa
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class CCPADashboardPage extends BasePage {
  readonly url = '/admin/ccpa';

  // Main sections
  readonly pageHeader: Locator;
  readonly complianceMetrics: Locator;
  readonly requestManagement: Locator;
  readonly quickActions: Locator;
  readonly timelineRequirements: Locator;
  readonly slaNotificationBanner: Locator;

  // Metric cards
  readonly totalRequestsCard: Locator;
  readonly pendingCard: Locator;
  readonly processingCard: Locator;
  readonly completedCard: Locator;
  readonly avgProcessingDaysCard: Locator;
  readonly complianceRateCard: Locator;
  readonly overdueCard: Locator;

  // Quick action buttons
  readonly generateReportBtn: Locator;
  readonly viewAllRequestsBtn: Locator;
  readonly viewBreachBtn: Locator;
  readonly auditLogBtn: Locator;
  readonly oauthAppBtn: Locator;

  // Filter buttons
  readonly filterByType: Locator;
  readonly filterByStatus: Locator;
  readonly filterByPriority: Locator;

  // Request list
  readonly requestTable: Locator;
  readonly requestRows: Locator;
  readonly emptyState: Locator;
  readonly overdueWarning: Locator;

  constructor(page: Page) {
    super(page);

    // Main sections
    this.pageHeader = page.getByRole('heading', { name: /CCPA Compliance Dashboard/i });
    this.complianceMetrics = page.locator('[data-testid="compliance-metrics"], :text("Compliance Metrics")').first();
    this.requestManagement = page.locator('[data-testid="request-management"], :text("Request Management")').first();
    this.quickActions = page.locator('[data-testid="quick-actions"], :text("Quick Actions")').first();
    this.timelineRequirements = page.locator('[data-testid="timeline-requirements"], :text("CCPA Timeline Requirements")').first();
    this.slaNotificationBanner = page.locator('[data-testid="sla-notification-banner"]');

    // Metric cards
    this.totalRequestsCard = page.locator(':text("Total Requests")').first();
    this.pendingCard = page.locator(':text("Pending")').first();
    this.processingCard = page.locator(':text("Processing")').first();
    this.completedCard = page.locator(':text("Completed")').first();
    this.avgProcessingDaysCard = page.locator(':text("Avg Processing Days")').first();
    this.complianceRateCard = page.locator(':text("Compliance Rate")').first();
    this.overdueCard = page.locator(':text("Overdue Requests")').first();

    // Quick action buttons - matching actual UI text
    this.generateReportBtn = page.getByRole('button', { name: /generate compliance report/i });
    this.viewAllRequestsBtn = page.getByRole('button', { name: /view all requests/i });
    this.viewBreachBtn = page.getByRole('button', { name: /view breach notifications/i });
    this.auditLogBtn = page.getByRole('button', { name: /audit log/i });
    this.oauthAppBtn = page.getByRole('button', { name: /oauth app configuration/i });

    // Filter buttons - using locator chains for flexibility
    this.filterByType = page.locator('[data-testid="type-filter"], .type-filter');
    this.filterByStatus = page.locator('[data-testid="status-filter"], .status-filter');
    this.filterByPriority = page.locator('[data-testid="priority-filter"], .priority-filter');

    // Request list
    this.requestTable = page.locator('[data-testid="request-table"], table').first();
    this.requestRows = page.locator('tbody tr, [data-testid="request-row"]');
    this.emptyState = page.locator(':text("No requests match your filters")');
    this.overdueWarning = page.locator(':text("OVERDUE")');
  }

  async expectDashboardVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('ccpa', 'compliance', 'dashboard')).toBeTruthy();
  }

  async expectMetricsVisible() {
    await this.waitForLoading();
    await expect(this.totalRequestsCard).toBeVisible();
    await expect(this.pendingCard).toBeVisible();
    await expect(this.processingCard).toBeVisible();
    await expect(this.completedCard).toBeVisible();
  }

  async expectQuickActionsVisible() {
    await expect(this.generateReportBtn).toBeVisible();
    await expect(this.viewAllRequestsBtn).toBeVisible();
  }

  async expectTimelineRequirementsVisible() {
    await expect(this.page.getByText(/10 days.*acknowledge/i)).toBeVisible();
    await expect(this.page.getByText(/45 days.*complete/i)).toBeVisible();
  }

  async clickFilterType(type: 'all' | 'export' | 'deletion' | 'correction' | 'opt_out') {
    const btn = this.page.getByRole('button', { name: new RegExp(type, 'i') }).first();
    await btn.click();
    await this.waitForLoading();
  }

  async clickFilterStatus(status: 'pending' | 'processing' | 'completed' | 'failed') {
    const btn = this.page.getByRole('button', { name: new RegExp(status, 'i') }).first();
    await btn.click();
    await this.waitForLoading();
  }

  async clickFilterPriority(priority: 'urgent' | 'high' | 'medium' | 'low') {
    const btn = this.page.getByRole('button', { name: new RegExp(priority, 'i') }).first();
    await btn.click();
    await this.waitForLoading();
  }

  async getRequestCount(): Promise<number> {
    await this.waitForLoading();
    return await this.requestRows.count();
  }

  async clickViewRequest(index: number = 0) {
    const viewBtn = this.requestRows.nth(index).getByRole('button', { name: /view/i });
    await viewBtn.click();
  }

  async clickProcessRequest(index: number = 0) {
    const processBtn = this.requestRows.nth(index).getByRole('button', { name: /process/i });
    await processBtn.click();
  }

  async clickAssignRequest(index: number = 0) {
    const assignBtn = this.requestRows.nth(index).getByRole('button', { name: /assign/i });
    await assignBtn.click();
  }

  async navigateToRequests() {
    await this.viewAllRequestsBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToBreachNotifications() {
    await this.viewBreachBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAuditLog() {
    await this.auditLogBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async generateReport() {
    await this.generateReportBtn.click();
    await this.waitForLoading();
  }

  async viewAllRequests() {
    await this.viewAllRequestsBtn.click();
    await this.waitForLoading();
  }

  async hasOverdueWarning(): Promise<boolean> {
    return await this.overdueWarning.isVisible().catch(() => false);
  }

  async hasSLANotificationBanner(): Promise<boolean> {
    return await this.slaNotificationBanner.isVisible().catch(() => false);
  }
}
