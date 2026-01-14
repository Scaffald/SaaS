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
    // Use role-based selector - most reliable for accessibility and works with Beyond UI
    // Verified via Playwright MCP browser inspection
    this.addButton = page.getByRole('button', { name: 'Add Subcontractor' });
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.subcontractorCards = page.locator('[data-testid="subcontractor-card"], .subcontractor-card');
  }

  async expectSubcontractorsVisible() {
    // Wait for navigation to complete
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for the Dashboard link to appear (indicates page has loaded)
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
    
    // Wait for loading to complete
    await this.waitForLoading();
    
    // Wait for either the page heading or empty state to appear
    // This ensures the page content has rendered
    await Promise.race([
      this.page.getByRole('heading', { name: 'Subcontractors' }).waitFor({ state: 'visible', timeout: 10000 }),
      this.page.getByText('No Subcontractors Yet').waitFor({ state: 'visible', timeout: 10000 }),
      this.page.getByText(/manage.*subcontractor/i).waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // If none found, continue - button check will provide better error
    });
    
    // Additional wait for React to finish rendering
    await this.page.waitForTimeout(1000);
  }

  async getSubcontractorCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.subcontractorCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickAddSubcontractor() {
    await this.addButton.click();
  }

  async expectAddButtonVisible() {
    // Use role-based selector - verified via Playwright MCP browser inspection
    const addButton = this.page.getByRole('button', { name: 'Add Subcontractor' });
    await expect(addButton).toBeVisible({ timeout: 15000 });
  }
}
