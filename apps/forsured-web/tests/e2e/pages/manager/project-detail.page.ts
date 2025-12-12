import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ManagerProjectDetailPage extends BasePage {
  readonly url: string;
  private projectId: string;

  readonly projectTitle: Locator;
  readonly projectStatus: Locator;
  readonly participantsSection: Locator;
  readonly documentsSection: Locator;
  readonly tasksSection: Locator;
  readonly backButton: Locator;

  constructor(page: Page, projectId: string = 'test-project-1') {
    super(page);
    this.projectId = projectId;
    this.url = `/manager/projects/${projectId}`;
    this.projectTitle = page.locator('h1, [data-testid="project-title"], .project-title');
    this.projectStatus = page.locator('[data-testid="project-status"], .project-status');
    this.participantsSection = page.locator('[data-testid="participants"], .participants-section');
    this.documentsSection = page.locator('[data-testid="documents"], .documents-section');
    this.tasksSection = page.locator('[data-testid="tasks"], .tasks-section');
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [data-testid="back-button"]');
  }

  async expectProjectDetailVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
