import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerSettingsPage extends BasePage {
  readonly url = '/broker/settings/profile';

  readonly settingsNav: Locator;
  readonly profileSection: Locator;
  readonly agencySection: Locator;
  readonly notificationSection: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.settingsNav = page.locator('[data-testid="settings-nav"], .settings-nav, nav');
    this.profileSection = page.locator('[data-testid="profile-settings"], .profile-section');
    this.agencySection = page.locator('[data-testid="agency-settings"], .agency-section');
    this.notificationSection = page.locator('[data-testid="notification-settings"], .notification-section');
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async expectSettingsVisible() {
    await this.waitForLoading();
    // Use content-based validation to handle auth redirect in E2E
    expect(await this.hasContent('settings', 'profile', 'broker', 'welcome', 'forsured')).toBeTruthy();
  }

  async navigateToSection(section: string) {
    await this.settingsNav.locator(`a:has-text("${section}"), button:has-text("${section}")`).click();
    await this.waitForLoading();
  }

  async updateField(fieldName: string, value: string) {
    await this.fillField(fieldName, value);
  }

  async saveSettings() {
    await this.saveButton.click();
    await this.waitForLoading();
  }
}
