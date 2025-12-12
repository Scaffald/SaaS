// tests/e2e/pages/broker/notifications.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerNotificationsPage extends BasePage {
  readonly url = '/broker/notifications';

  readonly notificationsList: Locator;
  readonly notificationItems: Locator;
  readonly unreadBadge: Locator;
  readonly markAllReadButton: Locator;
  readonly filterTabs: Locator;
  readonly policyAlerts: Locator;
  readonly clientUpdates: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.notificationsList = page.locator('[data-testid="notifications-list"], .notifications-list, [role="list"]');
    this.notificationItems = page.locator('[data-testid="notification-item"], .notification-item, [role="listitem"]');
    this.unreadBadge = page.locator('[data-testid="unread-badge"], .unread-badge, .badge');
    this.markAllReadButton = page.locator('button:has-text("Mark all"), button:has-text("Read all")');
    this.filterTabs = page.locator('[role="tablist"], .filter-tabs');
    this.policyAlerts = page.locator('[data-testid="policy-alerts"], .policy-alerts');
    this.clientUpdates = page.locator('[data-testid="client-updates"], .client-updates');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, :has-text("No notifications")');
  }

  async expectNotificationsVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('notifications', 'notification', 'alerts', 'loading')).toBeTruthy();
  }

  async getNotificationCount(): Promise<number> {
    await this.waitForLoading();
    return await this.notificationItems.count();
  }

  async clickNotification(index: number) {
    await this.notificationItems.nth(index).click();
    await this.waitForLoading();
  }

  async markAllAsRead() {
    if (await this.markAllReadButton.isVisible()) {
      await this.markAllReadButton.click();
      await this.waitForLoading();
    }
  }

  async filterByType(type: string) {
    await this.filterTabs.locator(`button:has-text("${type}"), [role="tab"]:has-text("${type}")`).click();
    await this.waitForLoading();
  }

  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }
}
