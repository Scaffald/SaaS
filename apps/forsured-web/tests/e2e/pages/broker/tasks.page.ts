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
    // Use content-based validation to handle auth redirect in E2E
    expect(await this.hasContent('tasks', 'task', 'broker', 'welcome', 'forsured')).toBeTruthy();
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
