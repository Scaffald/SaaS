import { Resource } from './base.js'

export interface StorageTotals {
  totalBytes: number
  workLogBytes: number
  portfolioBytes: number
  certificationBytes: number
  userCount: number
  averageBytes: number
  totalLimitBytes: number
  utilizationPercent: number | null
  overLimitCount: number
  limitsConfiguredCount: number
  lastUpdatedAt: string | null
}

export interface StorageTopUser {
  userId: string
  displayName: string | null
  username: string | null
  totalBytes: number
  workLogBytes: number
  portfolioBytes: number
  certificationBytes: number
  storageLimitBytes: number | null
  usagePercentOfLimit: number | null
  updatedAt: string | null
}

export interface StorageBreakdownEntry {
  label: string
  bytes: number
  percent: number
}

export interface StorageAnalyticsResponse {
  totals: StorageTotals
  topUsers: StorageTopUser[]
  breakdown: StorageBreakdownEntry[]
}

export class OfficeStorage extends Resource {
  async getAnalytics(): Promise<StorageAnalyticsResponse> {
    return this.get<StorageAnalyticsResponse>('/v1/office/storage/analytics')
  }
}
