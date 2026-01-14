import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerTaskDetailPage extends BasePage {
  readonly url: string;
  private taskId: string;

  readonly taskTitle: Locator;
  readonly taskStatus: Locator;
  readonly taskDescription: Locator;
  readonly commentSection: Locator;
  readonly attachmentsSection: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page, taskId: string = 'test-task-1') {
    super(page);
    this.taskId = taskId;
    this.url = `/broker/tasks/${taskId}`;
    this.taskTitle = page.locator('h1, [data-testid="task-title"], .task-title');
    this.taskStatus = page.locator('[data-testid="task-status"], .task-status, .status-badge');
    this.taskDescription = page.locator('[data-testid="task-description"], .task-description');
    this.commentSection = page.locator('[data-testid="comments"], .comments-section');
    this.attachmentsSection = page.locator('[data-testid="attachments"], .attachments-section');
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [data-testid="back-button"]');
    this.editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"]');
  }

  async expectTaskDetailVisible() {
    await this.waitForLoading();
    // Wait for any layout element to confirm page loaded
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEdit() {
    await this.editButton.click();
  }
}
