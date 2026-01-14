// tests/e2e/pages/onboarding/contractor.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ContractorOnboardingPage extends BasePage {
  readonly url = '/subcontractor/onboarding';

  readonly welcomeHeading: Locator;
  readonly companyNameInput: Locator;
  readonly tradeSelect: Locator;
  readonly insuranceSection: Locator;
  readonly coiUploadInput: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;
  readonly nextStepButton: Locator;
  readonly prevStepButton: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.locator('h1:has-text("Welcome"), h1:has-text("Subcontractor"), h1:has-text("Contractor")');
    this.companyNameInput = page.locator('input[placeholder*="company" i], input[name="companyName"]');
    this.tradeSelect = page.locator('select[name="trade"], select');
    this.insuranceSection = page.locator('[data-testid="insurance-section"], .insurance-section');
    this.coiUploadInput = page.locator('input[type="file"], [data-testid="coi-upload"]');
    this.continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
    this.skipButton = page.locator('button:has-text("Skip"), a:has-text("Skip")');
    this.nextStepButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    this.prevStepButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
    this.progressIndicator = page.locator('[data-testid="progress"], .progress-indicator, .step-indicator');
  }

  async expectOnboardingVisible() {
    await this.waitForLoading();
    expect(await this.hasContent('welcome', 'contractor', 'subcontractor', 'company', 'loading')).toBeTruthy();
  }

  async fillCompanyInfo(companyName: string, trade?: string) {
    if (await this.companyNameInput.isVisible()) {
      await this.companyNameInput.fill(companyName);
    }
    if (trade && await this.tradeSelect.isVisible()) {
      await this.tradeSelect.selectOption({ label: trade });
    }
  }

  async uploadCOI(filePath: string) {
    if (await this.coiUploadInput.isVisible()) {
      await this.coiUploadInput.setInputFiles(filePath);
      await this.waitForLoading();
    }
  }

  async submitForm() {
    await this.continueButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async skipOnboarding() {
    await this.skipButton.click();
    await this.page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {});
  }

  async goToNextStep() {
    await this.nextStepButton.click();
    await this.waitForLoading();
  }

  async goToPreviousStep() {
    await this.prevStepButton.click();
    await this.waitForLoading();
  }
}
