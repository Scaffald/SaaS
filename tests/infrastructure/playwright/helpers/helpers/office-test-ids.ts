export const OFFICE_TEST_IDS = {
  jobForm: {
    organization: 'job-organization-select',
    title: 'job-title-input',
    description: 'job-description-input',
    employmentType: 'job-employment-type-select',
    remoteOption: 'job-remote-option-select',
    payMin: 'job-pay-min-input',
    payMax: 'job-pay-max-input',
    payType: 'job-pay-type-select',
    positionLevel: 'job-position-level-input',
    cancel: 'job-cancel-button',
    saveDraft: 'job-save-draft-button',
    publish: 'job-publish-button',
  },
  organizationForm: {
    name: 'org-form-name',
    slug: 'org-form-slug',
    industry: 'org-form-industry',
    logoUrl: 'org-form-logo-url',
    visibility: 'org-form-visibility',
    save: 'org-form-save-btn',
    cancel: 'org-form-cancel-btn',
  },
} as const

type OfficeTestIdSections = typeof OFFICE_TEST_IDS

type ExtractValues<T> = T extends Record<string, infer V> ? V : never

export type OfficeTestId = ExtractValues<OfficeTestIdSections[keyof OfficeTestIdSections]>
