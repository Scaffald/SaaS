import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerTasksPage extends BasePage {
  readonly url = '/broker/tasks';

  readonly table: DataTableComponent;
  readonly filterTabs: Locator;
  readonly searchInput: Locator;
  readonly taskCards: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.filterTabs = page.locator('[role="tablist"] button, .filter-tabs button');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.taskCards = page.locator('[data-testid="task-card"], .task-card, .task-item');
  }

  async expectTasksVisible() {
    await this.waitForLoading();
    // Wait for the Tasks link in sidebar to be visible (confirms React rendered and layout loaded)
    await this.page.getByRole('link', { name: 'Tasks' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getTaskCount(): Promise<number> {
    return await this.table.getRowCount();
  }

  async filterByStatus(status: string) {
    await this.filterTabs.locator(`button:has-text("${status}")`).click();
    await this.waitForLoading();
  }

  async searchTasks(query: string) {
    await this.table.search(query);
  }

  async clickTask(index: number) {
    await this.table.clickRow(index);
  }
}
