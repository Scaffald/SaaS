// tests/e2e/pages/broker/project-detail.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerProjectDetailPage extends BasePage {
  readonly url: string;

  readonly projectHeader: Locator;
  readonly projectName: Locator;
  readonly clientInfo: Locator;
  readonly participantsList: Locator;
  readonly complianceStatus: Locator;
  readonly tasksList: Locator;
  readonly documentsList: Locator;
  readonly requirementsList: Locator;
  readonly activityTimeline: Locator;
  readonly editButton: Locator;

  constructor(page: Page, projectId: string = 'test-project-1') {
    super(page);
    this.url = `/broker/projects/${projectId}`;
    this.projectHeader = page.locator('h1, h2, [data-testid="project-header"]');
    this.projectName = page.locator('[data-testid="project-name"], .project-name');
    this.clientInfo = page.locator('[data-testid="client-info"], .client-info');
    this.participantsList = page.locator('[data-testid="participants"], .participants-list');
    this.complianceStatus = page.locator('[data-testid="compliance-status"], .compliance-status');
    this.tasksList = page.locator('[data-testid="tasks"], .tasks-list');
    this.documentsList = page.locator('[data-testid="documents"], .documents-list');
    this.requirementsList = page.locator('[data-testid="requirements"], .requirements-list');
    this.activityTimeline = page.locator('[data-testid="activity"], .activity-timeline');
    this.editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
  }

  async expectProjectDetailVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('project', 'participants', 'compliance', 'loading')).toBeTruthy();
  }

  async getParticipantCount(): Promise<number> {
    return await this.participantsList.locator('[data-testid="participant"], .participant-item, tr').count();
  }

  async getTaskCount(): Promise<number> {
    return await this.tasksList.locator('[data-testid="task"], .task-item, tr').count();
  }

  async clickEdit() {
    await this.editButton.click();
    await this.waitForLoading();
  }
}
