import type { Locator, Page } from '@playwright/test'

type UserType = 'worker' | 'employer' | 'customer'

const USER_TYPE_TEST_IDS: Record<UserType, string> = {
  worker: 'checkbox-user-type-worker',
  employer: 'checkbox-user-type-employer',
  customer: 'checkbox-user-type-customer',
}

const LEGAL_TEST_IDS = {
  privacy: 'checkbox-legal-privacy-policy',
  terms: 'checkbox-legal-terms-of-service',
} as const

export class PrerequisiteFormHelpers {
  constructor(private readonly page: Page) {}

  getUserTypeCheckbox(type: UserType): Locator {
    return this.page.getByTestId(USER_TYPE_TEST_IDS[type])
  }

  getPrivacyPolicyCheckbox(): Locator {
    return this.page.getByTestId(LEGAL_TEST_IDS.privacy)
  }

  getTermsOfServiceCheckbox(): Locator {
    return this.page.getByTestId(LEGAL_TEST_IDS.terms)
  }

  async isCheckboxCheckedByTestId(testId: string): Promise<boolean> {
    const checkbox = this.page.getByTestId(testId)
    const ariaChecked = await checkbox.getAttribute('aria-checked')
    return ariaChecked === 'true'
  }

  async selectUserType(type: UserType): Promise<void> {
    await this.getUserTypeCheckbox(type).click()
  }

  async deselectUserType(type: UserType): Promise<void> {
    await this.getUserTypeCheckbox(type).click()
  }

  async acceptLegalAgreements(): Promise<void> {
    await this.getPrivacyPolicyCheckbox().click()
    await this.getTermsOfServiceCheckbox().click()
  }

  async getSelectedUserTypes(): Promise<UserType[]> {
    const selected: UserType[] = []
    for (const [type, testId] of Object.entries(USER_TYPE_TEST_IDS) as [UserType, string][]) {
      if (await this.isCheckboxCheckedByTestId(testId)) {
        selected.push(type)
      }
    }
    return selected
  }

  getCheckboxesByRole(): Locator {
    return this.page.getByRole('checkbox')
  }

  getCheckboxByRoleName(name: string | RegExp): Locator {
    return this.page.getByRole('checkbox', { name })
  }
}

