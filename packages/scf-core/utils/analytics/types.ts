export type AnalyticsEnvironment = 'development' | 'staging' | 'production'

export interface InitAnalyticsOptions {
  hasConsent: boolean
  debug?: boolean
}

export type SuperProperties = Record<string, string | number | boolean | undefined>

export type EventProperties = Record<string, unknown>

