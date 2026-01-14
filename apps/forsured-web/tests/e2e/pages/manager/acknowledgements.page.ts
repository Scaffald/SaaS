import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ManagerAcknowledgementsPage extends BasePage {
  readonly url = '/manager/acknowledgements';

  readonly table: DataTableComponent;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly acknowledgementCards: Locator;

  // Modal locators
  readonly createModal: Locator;
  readonly modalTitle: Locator;
  readonly projectSelect: Locator;
  readonly subcontractorSelect: Locator;
  readonly brokerAgencyInput: Locator;
  readonly brokerContactInput: Locator;
  readonly brokerEmailInput: Locator;
  readonly brokerPhoneInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly modalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.acknowledgementCards = page.locator('[data-testid="acknowledgement-card"], .acknowledgement-card');

    // Modal locators
    this.createModal = page.locator('text=Create Broker Acknowledgement Form').locator('..').locator('..');
    this.modalTitle = page.locator('text=Create Broker Acknowledgement Form');
    this.projectSelect = page.locator('text=Project').locator('..').locator('select').first();
    this.subcontractorSelect = page.locator('text=Subcontractor').locator('..').locator('select').first();
    this.brokerAgencyInput = page.locator('input[type="text"]').filter({ has: page.locator('text=/agency/i').locator('..') }).or(
      page.locator('input').filter({ has: page.locator('text=/Agency Name/i').locator('..') })
    );
    this.brokerContactInput = page.locator('input[type="text"]').filter({ has: page.locator('text=/contact/i').locator('..') });
    this.brokerEmailInput = page.locator('input[type="email"]');
    this.brokerPhoneInput = page.locator('input[type="tel"]');
    this.submitButton = page.locator('button:has-text("Create Form"), button[type="submit"]').last();
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.modalCloseButton = page.locator('button').filter({ has: page.locator('svg') }).first();
  }

  async expectAcknowledgementsVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getAcknowledgementCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.acknowledgementCards.count();
    return Math.max(tableCount, cardCount);
  }

  /**
   * Open the create acknowledgement form modal
   */
  async openCreateModal() {
    await this.createButton.waitFor({ state: 'visible' });
    await this.createButton.click();
    await this.modalTitle.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Close the create acknowledgement form modal
   */
  async closeCreateModal() {
    await this.cancelButton.waitFor({ state: 'visible' });
    await this.cancelButton.click();
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 3000 });
  }

  /**
   * Fill the create form with test data
   */
  async fillCreateForm(options: {
    projectId?: string;
    subcontractorOrgId?: string;
    brokerAgency?: string;
    brokerContact?: string;
    brokerEmail?: string;
    brokerPhone?: string;
  }) {
    if (options.projectId) {
      await this.projectSelect.selectOption(options.projectId);
    }

    if (options.subcontractorOrgId) {
      await this.subcontractorSelect.waitFor({ state: 'visible' });
      await this.page.waitForTimeout(500); // Wait for options to load
      await this.subcontractorSelect.selectOption(options.subcontractorOrgId);
    }

    if (options.brokerAgency) {
      await this.brokerAgencyInput.fill(options.brokerAgency);
    }

    if (options.brokerContact) {
      await this.brokerContactInput.fill(options.brokerContact);
    }

    if (options.brokerEmail) {
      await this.brokerEmailInput.fill(options.brokerEmail);
    }

    if (options.brokerPhone) {
      await this.brokerPhoneInput.fill(options.brokerPhone);
    }
  }

  /**
   * Submit the create form
   */
  async submitCreateForm() {
    await this.submitButton.waitFor({ state: 'visible' });
    await this.submitButton.click();
  }

  /**
   * Get available subcontractor options from dropdown
   */
  async getSubcontractorOptions(): Promise<Array<{ value: string; text: string }>> {
    await this.subcontractorSelect.waitFor({ state: 'visible' });
    const selectElement = await this.subcontractorSelect.elementHandle();
    if (!selectElement) return [];

    return await selectElement.$$eval('option', (opts) =>
      opts.map((opt) => ({ value: opt.value, text: opt.textContent || '' }))
    );
  }
}
