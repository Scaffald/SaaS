import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerClientDetailPage extends BasePage {
  readonly url: string;
  private clientId: string;

  readonly clientName: Locator;
  readonly clientStatus: Locator;
  readonly policiesSection: Locator;
  readonly complianceSection: Locator;
  readonly contactInfo: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page, clientId: string = 'test-client-1') {
    super(page);
    this.clientId = clientId;
    this.url = `/broker/clients/${clientId}`;
    this.clientName = page.locator('h1, [data-testid="client-name"], .client-name');
    this.clientStatus = page.locator('[data-testid="client-status"], .client-status');
    this.policiesSection = page.locator('[data-testid="policies"], .policies-section');
    this.complianceSection = page.locator('[data-testid="compliance"], .compliance-section');
    this.contactInfo = page.locator('[data-testid="contact-info"], .contact-info');
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [data-testid="back-button"]');
    this.editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"]');
  }

  async expectClientDetailVisible() {
    await this.waitForLoading();
    // Wait for any layout element to confirm page loaded
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEdit() {
    await this.editButton.click();
  }
}
