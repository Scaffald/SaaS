// tests/e2e/pages/broker/policy-detail.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerPolicyDetailPage extends BasePage {
  readonly url: string;

  readonly policyHeader: Locator;
  readonly policyNumber: Locator;
  readonly clientName: Locator;
  readonly carrierInfo: Locator;
  readonly coverageDetails: Locator;
  readonly limitsTable: Locator;
  readonly effectiveDates: Locator;
  readonly premiumInfo: Locator;
  readonly endorsementsList: Locator;
  readonly documentsSection: Locator;
  readonly renewButton: Locator;
  readonly editButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page, policyId: string = 'test-policy-1') {
    super(page);
    this.url = `/broker/insurance/policies/${policyId}`;
    this.policyHeader = page.locator('h1, h2, [data-testid="policy-header"]');
    this.policyNumber = page.locator('[data-testid="policy-number"], .policy-number');
    this.clientName = page.locator('[data-testid="client-name"], .client-name');
    this.carrierInfo = page.locator('[data-testid="carrier-info"], .carrier-info');
    this.coverageDetails = page.locator('[data-testid="coverage-details"], .coverage-section');
    this.limitsTable = page.locator('[data-testid="limits-table"], table, .limits-table');
    this.effectiveDates = page.locator('[data-testid="effective-dates"], .date-range');
    this.premiumInfo = page.locator('[data-testid="premium-info"], .premium');
    this.endorsementsList = page.locator('[data-testid="endorsements"], .endorsements-list');
    this.documentsSection = page.locator('[data-testid="documents"], .documents-section');
    this.renewButton = page.locator('button:has-text("Renew"), a:has-text("Renew")');
    this.editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
    this.statusBadge = page.locator('[data-testid="status-badge"], .status-badge');
  }

  async expectPolicyDetailVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('policy', 'coverage', 'limits', 'insurance', 'loading')).toBeTruthy();
  }

  async getPolicyStatus(): Promise<string> {
    if (await this.statusBadge.isVisible()) {
      return await this.statusBadge.textContent() || '';
    }
    return '';
  }

  async clickRenew() {
    await this.renewButton.click();
    await this.waitForLoading();
  }

  async clickEdit() {
    await this.editButton.click();
    await this.waitForLoading();
  }

  async hasEndorsements(): Promise<boolean> {
    return await this.endorsementsList.isVisible().catch(() => false);
  }

  async getDocumentCount(): Promise<number> {
    return await this.documentsSection.locator('[data-testid="document-item"], .document-item, a').count();
  }
}
