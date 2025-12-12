// tests/e2e/pages/contractor/project-detail.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ContractorProjectDetailPage extends BasePage {
  readonly url: string;

  readonly projectHeader: Locator;
  readonly projectName: Locator;
  readonly gcInfo: Locator;
  readonly myTasks: Locator;
  readonly complianceStatus: Locator;
  readonly documentRequirements: Locator;
  readonly insuranceRequirements: Locator;
  readonly submitDocumentButton: Locator;

  constructor(page: Page, projectId: string = 'test-project-1') {
    super(page);
    this.url = `/subcontractor/projects/${projectId}`;
    this.projectHeader = page.locator('h1, h2, [data-testid="project-header"]');
    this.projectName = page.locator('[data-testid="project-name"], .project-name');
    this.gcInfo = page.locator('[data-testid="gc-info"], .gc-info, .manager-info');
    this.myTasks = page.locator('[data-testid="my-tasks"], .my-tasks');
    this.complianceStatus = page.locator('[data-testid="compliance-status"], .compliance-status');
    this.documentRequirements = page.locator('[data-testid="document-requirements"], .document-requirements');
    this.insuranceRequirements = page.locator('[data-testid="insurance-requirements"], .insurance-requirements');
    this.submitDocumentButton = page.locator('button:has-text("Submit"), button:has-text("Upload")');
  }

  async expectProjectDetailVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('project', 'tasks', 'requirements', 'compliance', 'loading')).toBeTruthy();
  }

  async getMyTaskCount(): Promise<number> {
    return await this.myTasks.locator('[data-testid="task"], .task-item, tr').count();
  }

  async clickSubmitDocument() {
    await this.submitDocumentButton.click();
    await this.waitForLoading();
  }
}
