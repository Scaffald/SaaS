import { Page, Locator } from '@playwright/test';

export class TaskModalComponent {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="task-modal"], [role="dialog"], .modal');
    this.titleInput = this.modal.locator('input[name="title"], input[placeholder*="title" i]');
    this.descriptionInput = this.modal.locator('textarea[name="description"], textarea[placeholder*="description" i]');
    this.prioritySelect = this.modal.locator('select[name="priority"], [data-testid="priority-select"]');
    this.statusSelect = this.modal.locator('select[name="status"], [data-testid="status-select"]');
    this.saveButton = this.modal.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")');
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');
    this.closeButton = this.modal.locator('button[aria-label="Close"], [data-testid="close-modal"]');
  }

  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  async waitForOpen() {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 });
  }

  async fillTask(title: string, description?: string, priority?: string) {
    await this.waitForOpen();
    if (await this.titleInput.isVisible()) {
      await this.titleInput.fill(title);
    }
    if (description && await this.descriptionInput.isVisible()) {
      await this.descriptionInput.fill(description);
    }
    if (priority && await this.prioritySelect.isVisible()) {
      await this.prioritySelect.selectOption(priority);
    }
  }

  async save() {
    await this.saveButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async cancel() {
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async close() {
    if (await this.closeButton.isVisible()) {
      await this.closeButton.click();
    } else if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    }
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}
