export interface NormalizedLocation {
  city?: string
  state?: string
  country?: string
  raw?: string
}

export interface NormalizedSalary {
  currency?: string
  frequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time'
  min?: number
  max?: number
  raw?: string
}

export interface NormalizedOrganization {
  id: string
  name: string
  website?: string
}

export interface NormalizedJob {
  /**
   * Stable identifier internal to our system.
   */
  id: string
  /**
   * Provider specific identifier.
   */
  externalId: string
  title: string
  description?: string
  organizationId: string
  source: string
  location?: NormalizedLocation
  salary?: NormalizedSalary
  postedAt?: string
  updatedAt?: string
  applyUrl?: string
  sourceUrl?: string
  metadata?: Record<string, unknown>
}
