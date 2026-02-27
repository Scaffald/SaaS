export type CookieConsentCategoryId = string

export interface CookieConsentCategory {
  id: CookieConsentCategoryId
  label: string
  description: string
  required?: boolean
  defaultValue?: boolean
}

export type CookieConsentSelections = Record<CookieConsentCategoryId, boolean>

export interface CookieConsentState {
  version: string
  updatedAt: string
  selections: CookieConsentSelections
}

export interface CookieConsentStorage {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}
