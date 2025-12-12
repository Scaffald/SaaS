// tests/e2e/pages/contractor/tasks.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ContractorTasksPage extends BasePage {
  readonly url = '/subcontractor/tasks';

  readonly table: DataTableComponent;
  readonly tasksList: Locator;
  readonly filterTabs: Locator;
  readonly searchInput: Locator;
  readonly pendingSection: Locator;
  readonly completedSection: Locator;
  readonly overdueSection: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.tasksList = page.locator('[data-testid="tasks-list"], .tasks-list, [role="list"]');
    this.filterTabs = page.locator('[role="tablist"], .filter-tabs');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.pendingSection = page.locator('[data-testid="pending-tasks"], .pending-section');
    this.completedSection = page.locator('[data-testid="completed-tasks"], .completed-section');
    this.overdueSection = page.locator('[data-testid="overdue-tasks"], .overdue-section');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state');
  }

  async expectTasksVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('tasks', 'task', 'pending', 'loading')).toBeTruthy();
  }

  async getTaskCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const listCount = await this.tasksList.locator('[data-testid="task-item"], .task-item').count();
    return Math.max(tableCount, listCount);
  }

  async clickTask(index: number) {
    const listItems = await this.tasksList.locator('[data-testid="task-item"], .task-item').count();
    if (listItems > 0) {
      await this.tasksList.locator('[data-testid="task-item"], .task-item').nth(index).click();
    } else {
      await this.table.clickRow(index);
    }
    await this.waitForLoading();
  }

  async filterByStatus(status: string) {
    await this.filterTabs.locator(`button:has-text("${status}")`).click();
    await this.waitForLoading();
  }

  async search(query: string) {
    await this.table.search(query);
  }

  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }
}
