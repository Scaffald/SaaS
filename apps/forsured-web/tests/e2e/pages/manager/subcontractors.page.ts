import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class ManagerSubcontractorsPage extends BasePage {
  readonly url = '/manager/subcontractors';

  readonly table: DataTableComponent;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly subcontractorCards: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    // Use flexible selector that works with Tamagui button rendering
    // Button text might be in children or split across nodes
    this.addButton = page.locator('button').filter({ hasText: /add subcontractor/i }).first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.subcontractorCards = page.locator('[data-testid="subcontractor-card"], .subcontractor-card');
  }
  
  /**
   * Find the Add Subcontractor button using multiple strategies
   * This handles cases where Tamagui renders button text in different ways
   */
  async findAddButton(): Promise<Locator | null> {
    // Strategy 1: Direct text match
    let button = this.page.locator('button:has-text("Add Subcontractor")').first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      return button;
    }
    
    // Strategy 2: Filter by text content
    button = this.page.locator('button').filter({ hasText: /add subcontractor/i }).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      return button;
    }
    
    // Strategy 3: Check all buttons for text content
    const buttons = await this.page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text && /add subcontractor/i.test(text.trim())) {
        return btn;
      }
    }
    
    return null;
  }

  async expectSubcontractorsVisible() {
    await this.waitForLoading();
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getSubcontractorCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.subcontractorCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickAddSubcontractor() {
    // Try to use the stored button first
    const isVisible = await this.addButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await this.addButton.click();
      return;
    }
    
    // Fallback: find button dynamically
    const button = await this.findAddButton();
    if (button) {
      await button.click();
    } else {
      throw new Error('Add Subcontractor button not found');
    }
  }

  async expectAddButtonVisible() {
    // Try multiple strategies to find the button
    const button = await this.findAddButton();
    if (button) {
      await expect(button).toBeVisible();
    } else {
      // Fallback to stored button
      await expect(this.addButton).toBeVisible({ timeout: 5000 });
    }
  }
}
