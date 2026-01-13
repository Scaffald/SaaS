import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerProjectsPage extends BasePage {
  readonly url = '/broker/projects';

  readonly table: DataTableComponent;
  readonly projectCards: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.projectCards = page.locator('[data-testid="project-card"], .project-card');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
  }

  async expectProjectsVisible() {
    await this.waitForLoading();
    // Wait for the Dashboard link in sidebar to confirm page loaded
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getProjectCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.projectCards.count();
    return Math.max(tableCount, cardCount);
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
