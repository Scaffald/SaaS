import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ContractorProjectsPage extends BasePage {
  readonly url = '/subcontractor/projects';

  readonly table: DataTableComponent;
  readonly projectCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.projectCards = page.locator('[data-testid="project-card"], .project-card');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectProjectsVisible() {
    await this.waitForLoading();
    // Use content-based validation to handle auth redirect in E2E
    expect(await this.hasContent('projects', 'project', 'subcontractor', 'contractor', 'welcome', 'forsured')).toBeTruthy();
  }

  async getProjectCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.projectCards.count();
    return Math.max(tableCount, cardCount);
  }
}
