import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ManagerDashboardPage extends BasePage {
  readonly url = '/manager/dashboard';

  readonly metricCards: Locator;
  readonly taskList: Locator;
  readonly recentProjects: Locator;
  readonly quickActions: Locator;
  readonly createTaskButton: Locator;
  readonly viewAllTasksLink: Locator;

  constructor(page: Page) {
    super(page);
    this.metricCards = page.locator('[data-testid="metric-card"], .stat-card, .metric-card');
    this.taskList = page.locator('[data-testid="task-list"], .tasks-section, .task-list');
    this.recentProjects = page.locator('[data-testid="recent-projects"], .recent-projects');
    this.quickActions = page.locator('[data-testid="quick-actions"], .quick-actions');
    this.createTaskButton = page.locator('button:has-text("Create Task"), button:has-text("New Task"), a:has-text("Create Task")');
    this.viewAllTasksLink = page.locator('a:has-text("View All Tasks"), a:has-text("See All")');
  }

  async expectDashboardVisible() {
    await this.waitForLoading();
    // Wait for the Dashboard link in sidebar to be visible (confirms React rendered and layout loaded)
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getMetricCount(): Promise<number> {
    await this.waitForLoading();
    return await this.metricCards.count();
  }

  async clickFirstTask() {
    await this.taskList.locator('tr, [data-testid="task-row"], .task-item').first().click();
  }

  async clickCreateTask() {
    await this.createTaskButton.click();
  }

  async navigateToTasks() {
    await this.viewAllTasksLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}
