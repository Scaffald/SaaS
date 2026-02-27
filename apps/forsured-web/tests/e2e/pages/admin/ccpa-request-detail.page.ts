/**
 * CCPA Request Detail Page Object
 * CCPA request detail page object
 *
 * Page object for the CCPA Request Detail at /admin/ccpa/requests/[id]
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class CCPARequestDetailPage extends BasePage {
  readonly url = '/admin/ccpa/requests';

  // Page header
  readonly pageHeader: Locator;
  readonly breadcrumb: Locator;
  readonly backLink: Locator;

  // Request info sections
  readonly requestInfo: Locator;
  readonly userInfo: Locator;
  readonly statusSection: Locator;
  readonly timelineSection: Locator;
  readonly activityLog: Locator;

  // Request details
  readonly requestId: Locator;
  readonly requestType: Locator;
  readonly requestStatus: Locator;
  readonly requestPriority: Locator;
  readonly submittedAt: Locator;
  readonly deadlineAt: Locator;
  readonly daysRemaining: Locator;

  // User details
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly userId: Locator;

  // Assignment
  readonly assignedTo: Locator;
  readonly assignBtn: Locator;
  readonly reassignBtn: Locator;

  // Action buttons
  readonly updateStatusBtn: Locator;
  readonly processRequestBtn: Locator;
  readonly approveBtn: Locator;
  readonly denyBtn: Locator;
  readonly exportDataBtn: Locator;
  readonly deleteDataBtn: Locator;
  readonly addNoteBtn: Locator;

  // Status workflow
  readonly statusDropdown: Locator;
  readonly confirmStatusBtn: Locator;
  readonly cancelStatusBtn: Locator;

  // Modals
  readonly confirmationModal: Locator;
  readonly denyReasonModal: Locator;
  readonly noteModal: Locator;

  // Notes & Activity
  readonly notesSection: Locator;
  readonly noteInput: Locator;
  readonly saveNoteBtn: Locator;
  readonly activityItems: Locator;

  // Data categories (for export requests)
  readonly dataCategoriesSection: Locator;
  readonly dataCategoryCheckboxes: Locator;

  // Verification (for deletion requests)
  readonly verificationSection: Locator;
  readonly verificationChecklist: Locator;
  readonly verificationCompleteBtn: Locator;

  constructor(page: Page) {
    super(page);

    // Page header
    this.pageHeader = page.getByRole('heading', { name: /Request Details|Request #/i }).first();
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    this.backLink = page.getByRole('link', { name: /back|requests/i }).first();

    // Request info sections
    this.requestInfo = page.locator('[data-testid="request-info"], .request-info');
    this.userInfo = page.locator('[data-testid="user-info"], .user-info');
    this.statusSection = page.locator('[data-testid="status-section"], .status-section');
    this.timelineSection = page.locator('[data-testid="timeline-section"], .timeline-section');
    this.activityLog = page.locator('[data-testid="activity-log"], .activity-log');

    // Request details
    this.requestId = page.locator('[data-testid="request-id"]');
    this.requestType = page.locator('[data-testid="request-type"], :text("Type")');
    this.requestStatus = page.locator('[data-testid="request-status"], .status-badge').first();
    this.requestPriority = page.locator('[data-testid="request-priority"], :text("Priority")');
    this.submittedAt = page.locator('[data-testid="submitted-at"], :text("Submitted")');
    this.deadlineAt = page.locator('[data-testid="deadline-at"], :text("Deadline")');
    this.daysRemaining = page.locator('[data-testid="days-remaining"], :text("Days Remaining")');

    // User details
    this.userName = page.locator('[data-testid="user-name"]');
    this.userEmail = page.locator('[data-testid="user-email"]');
    this.userId = page.locator('[data-testid="user-id"]');

    // Assignment
    this.assignedTo = page.locator('[data-testid="assigned-to"], :text("Assigned to")');
    this.assignBtn = page.getByRole('button', { name: /^assign$/i });
    this.reassignBtn = page.getByRole('button', { name: /reassign/i });

    // Action buttons
    this.updateStatusBtn = page.getByRole('button', { name: /update status/i });
    this.processRequestBtn = page.getByRole('button', { name: /process|start processing/i });
    this.approveBtn = page.getByRole('button', { name: /approve|complete/i });
    this.denyBtn = page.getByRole('button', { name: /deny|reject/i });
    this.exportDataBtn = page.getByRole('button', { name: /export data|generate export/i });
    this.deleteDataBtn = page.getByRole('button', { name: /delete data|confirm deletion/i });
    this.addNoteBtn = page.getByRole('button', { name: /add note/i });

    // Status workflow
    this.statusDropdown = page.locator('[data-testid="status-dropdown"], select[name="status"]');
    this.confirmStatusBtn = page.getByRole('button', { name: /confirm|save|update/i });
    this.cancelStatusBtn = page.getByRole('button', { name: /cancel/i });

    // Modals
    this.confirmationModal = page.locator('[role="dialog"]:has-text("Confirm")');
    this.denyReasonModal = page.locator('[role="dialog"]:has-text("Deny"), [role="dialog"]:has-text("Reason")');
    this.noteModal = page.locator('[role="dialog"]:has-text("Note")');

    // Notes & Activity
    this.notesSection = page.locator('[data-testid="notes-section"], .notes-section');
    this.noteInput = page.locator('[data-testid="note-input"], textarea[name="note"]');
    this.saveNoteBtn = page.getByRole('button', { name: /save note/i });
    this.activityItems = page.locator('[data-testid="activity-item"], .activity-item');

    // Data categories
    this.dataCategoriesSection = page.locator('[data-testid="data-categories"], .data-categories');
    this.dataCategoryCheckboxes = page.locator('[data-testid="category-checkbox"], input[type="checkbox"][name*="category"]');

    // Verification
    this.verificationSection = page.locator('[data-testid="verification-section"], .verification-section');
    this.verificationChecklist = page.locator('[data-testid="verification-checklist"], .verification-checklist');
    this.verificationCompleteBtn = page.getByRole('button', { name: /verification complete/i });
  }

  async gotoRequest(requestId: string) {
    await this.page.goto(`/admin/ccpa/requests/${requestId}`);
    await this.page.waitForLoadState('networkidle');
    await this.waitForLoading();
  }

  async expectPageVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('request', 'details', 'status')).toBeTruthy();
  }

  async expectRequestDetailsVisible() {
    await this.waitForLoading();
    const hasType = await this.page.getByText(/Type:/i).isVisible().catch(() => false);
    const hasStatus = await this.requestStatus.isVisible().catch(() => false);
    expect(hasType || hasStatus).toBeTruthy();
  }

  // Status operations
  async updateStatus(newStatus: string) {
    await this.updateStatusBtn.click();
    await this.statusDropdown.selectOption(newStatus);
    await this.confirmStatusBtn.click();
    await this.waitForLoading();
  }

  async processRequest() {
    await this.processRequestBtn.click();
    await this.waitForLoading();
  }

  async approveRequest() {
    await this.approveBtn.click();
    if (await this.confirmationModal.isVisible()) {
      await this.page.getByRole('button', { name: /confirm|yes/i }).click();
    }
    await this.waitForLoading();
  }

  async denyRequest(reason: string) {
    await this.denyBtn.click();
    await expect(this.denyReasonModal).toBeVisible();
    await this.page.locator('textarea[name="reason"]').fill(reason);
    await this.page.getByRole('button', { name: /confirm|deny/i }).click();
    await this.waitForLoading();
  }

  // Assignment
  async assignToUser(userId: string) {
    const assignButton = await this.assignBtn.isVisible() ? this.assignBtn : this.reassignBtn;
    await assignButton.click();
    await this.page.locator('[data-testid="assignee-select"], select[name="assignee"]').selectOption(userId);
    await this.page.getByRole('button', { name: /confirm|assign/i }).click();
    await this.waitForLoading();
  }

  // Notes
  async addNote(note: string) {
    await this.addNoteBtn.click();
    await expect(this.noteModal).toBeVisible();
    await this.noteInput.fill(note);
    await this.saveNoteBtn.click();
    await this.waitForLoading();
  }

  async getActivityCount(): Promise<number> {
    return await this.activityItems.count();
  }

  // Data operations (for export requests)
  async selectDataCategories(categories: string[]) {
    for (const category of categories) {
      const checkbox = this.page.locator(`input[type="checkbox"][value="${category}"]`);
      await checkbox.check();
    }
  }

  async generateDataExport() {
    await this.exportDataBtn.click();
    await this.waitForLoading();
  }

  // Deletion verification (for deletion requests)
  async completeVerification() {
    await this.verificationCompleteBtn.click();
    await this.waitForLoading();
  }

  async confirmDeletion() {
    await this.deleteDataBtn.click();
    if (await this.confirmationModal.isVisible()) {
      await this.page.getByRole('button', { name: /confirm|yes/i }).click();
    }
    await this.waitForLoading();
  }

  // Navigation
  async goBack() {
    await this.backLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  // Getters
  async getRequestStatus(): Promise<string | null> {
    return await this.requestStatus.textContent();
  }

  async getRequestType(): Promise<string | null> {
    return await this.requestType.textContent();
  }

  async isOverdue(): Promise<boolean> {
    const overdueIndicator = this.page.locator(':text("Overdue"), .overdue-indicator');
    return await overdueIndicator.isVisible().catch(() => false);
  }

  async getDaysRemaining(): Promise<number | null> {
    const text = await this.daysRemaining.textContent();
    const match = text?.match(/(-?\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}
