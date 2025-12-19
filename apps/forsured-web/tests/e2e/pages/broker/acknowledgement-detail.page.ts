// tests/e2e/pages/broker/acknowledgement-detail.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class BrokerAcknowledgementDetailPage extends BasePage {
  readonly url: string;

  readonly formTitle: Locator;
  readonly clientInfo: Locator;
  readonly coverageSection: Locator;
  readonly certificationSection: Locator;
  readonly signatureSection: Locator;
  readonly submitButton: Locator;
  readonly saveAsDraftButton: Locator;
  readonly cancelButton: Locator;
  readonly statusBadge: Locator;
  readonly historySection: Locator;

  constructor(page: Page, formId: string = 'test-form-1') {
    super(page);
    this.url = `/broker/acknowledgements/${formId}`;
    this.formTitle = page.locator('h1, h2, [data-testid="form-title"]');
    this.clientInfo = page.locator('[data-testid="client-info"], .client-info');
    this.coverageSection = page.locator('[data-testid="coverage-section"], .coverage-verification');
    this.certificationSection = page.locator('[data-testid="certification-section"], .certification');
    this.signatureSection = page.locator('[data-testid="signature-section"], .signature');
    this.submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete")');
    this.saveAsDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("Save")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.statusBadge = page.locator('[data-testid="status-badge"], .status-badge');
    this.historySection = page.locator('[data-testid="history"], .history-section');
  }

  async expectFormVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('acknowledgement', 'form', 'coverage', 'certification', 'loading')).toBeTruthy();
  }

  async getFormStatus(): Promise<string> {
    if (await this.statusBadge.isVisible()) {
      return await this.statusBadge.textContent() || '';
    }
    return '';
  }

  async saveAsDraft() {
    await this.saveAsDraftButton.click();
    await this.waitForLoading();
  }

  async submit() {
    await this.submitButton.click();
    await this.waitForLoading();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
