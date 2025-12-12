import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';

export class BrokerTeamPage extends BasePage {
  readonly url = '/broker/team';

  readonly table: DataTableComponent;
  readonly addMemberButton: Locator;
  readonly memberCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.addMemberButton = page.locator('button:has-text("Add"), button:has-text("Invite"), button:has-text("New Member")');
    this.memberCards = page.locator('[data-testid="member-card"], .member-card, .team-member');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async expectTeamVisible() {
    await this.waitForLoading();
    // Wait for the Dashboard link in sidebar to confirm page loaded
    await this.page.getByRole('link', { name: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async getMemberCount(): Promise<number> {
    const tableCount = await this.table.getRowCount();
    const cardCount = await this.memberCards.count();
    return Math.max(tableCount, cardCount);
  }

  async clickAddMember() {
    await this.addMemberButton.click();
  }
}
