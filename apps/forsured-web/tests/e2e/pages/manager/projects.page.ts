import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ManagerProjectsPage extends BasePage {
  readonly url = '/manager/projects';

  readonly table: DataTableComponent;
  readonly createButton: Locator;
  readonly projectCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Project"), a:has-text("Create")');
    this.projectCards = page.locator('[data-testid="project-card"], .project-card');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectProjectsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('projects', 'project', 'loading')).toBeTruthy();
  }

  async getProjectCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.projectCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickCreateProject() {
    await this.createButton.click();
  }

  async clickProject(index: number) {
    const cards = await this.projectCards.count();
    if (cards > 0) {
      await this.projectCards.nth(index).click();
    } else {
      await this.table.clickRow(index);
    }
  }

  async searchProjects(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.waitForLoading();
    }
  }
}
