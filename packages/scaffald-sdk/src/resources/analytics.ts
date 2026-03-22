import { Resource } from './base.js'

// ============================================================================
// Types
// ============================================================================

export interface MetricWithSparkline {
  total: number
  previous: number
  sparkline: number[]
}

export interface AnalyticsSummary {
  profileViews: MetricWithSparkline
  searchAppearances: MetricWithSparkline
  jobViews: MetricWithSparkline
  applications: MetricWithSparkline
  totalEngagement: MetricWithSparkline
  liveViewers: number
}

export interface GetSummaryParams {
  days?: number
}

export interface EngagementTimelineEntry {
  date: string
  profileViews: number
  jobViews: number
  applications: number
  searches: number
  total: number
}

export interface GetEngagementTimelineParams {
  days?: number
  granularity?: 'day' | 'week'
  eventTypes?: string[]
}

export interface EngagementTimelineResponse {
  timeline: EngagementTimelineEntry[]
}

export interface AnalyticsVisitor {
  viewerId: string | null
  viewerName: string | null
  viewerAvatar: string | null
  viewerHeadline: string | null
  viewedAt: string
  roleType: string | null
  industryName: string | null
}

export interface GetVisitorsParams {
  days?: number
  limit?: number
  offset?: number
}

export interface VisitorsResponse {
  visitors: AnalyticsVisitor[]
  total: number
  byIndustry: Array<{ industry: string; count: number }>
  byRoleType: Array<{ roleType: string; count: number }>
}

export interface VisibilityTimelineEntry {
  date: string
  searchResults: number
  recommendations: number
  feedAppearances: number
  clicks: number
  ctr: number
}

export interface GetVisibilityTimelineParams {
  days?: number
  granularity?: 'day' | 'week'
}

export interface VisibilityTimelineResponse {
  timeline: VisibilityTimelineEntry[]
}

export interface SearchKeyword {
  query: string
  impressions: number
  clicks: number
  ctr: number
  avgPosition: number
}

export interface GetSearchKeywordsParams {
  days?: number
  limit?: number
}

export interface SearchKeywordsResponse {
  keywords: SearchKeyword[]
}

export interface SearchTimelineEntry {
  date: string
  impressions: number
  clicks: number
  ctr: number
}

export interface GetSearchTimelineParams {
  days?: number
}

export interface SearchTimelineResponse {
  timeline: SearchTimelineEntry[]
}

export interface TrackImpressionParams {
  userId: string
  impressionType: 'search_result' | 'recommendation' | 'feed_appearance'
  searchQuery?: string
  searchFilters?: Record<string, unknown>
  position?: number
}

// ============================================================================
// Analytics Resource
// ============================================================================

export class Analytics extends Resource {
  /**
   * Get analytics summary with KPIs and sparklines
   */
  async getSummary(params?: GetSummaryParams): Promise<AnalyticsSummary> {
    return this.get<AnalyticsSummary>('/v1/analytics/summary', params)
  }

  /**
   * Get engagement timeline for charts
   */
  async getEngagementTimeline(
    params?: GetEngagementTimelineParams
  ): Promise<EngagementTimelineResponse> {
    return this.get<EngagementTimelineResponse>('/v1/analytics/engagement/timeline', params)
  }

  /**
   * Get recent profile visitors with demographics
   */
  async getVisitors(params?: GetVisitorsParams): Promise<VisitorsResponse> {
    return this.get<VisitorsResponse>('/v1/analytics/engagement/visitors', params)
  }

  /**
   * Get visibility/impression timeline
   */
  async getVisibilityTimeline(
    params?: GetVisibilityTimelineParams
  ): Promise<VisibilityTimelineResponse> {
    return this.get<VisibilityTimelineResponse>('/v1/analytics/visibility/timeline', params)
  }

  /**
   * Get top search keywords that led to profile appearances
   */
  async getSearchKeywords(params?: GetSearchKeywordsParams): Promise<SearchKeywordsResponse> {
    return this.get<SearchKeywordsResponse>('/v1/analytics/search/keywords', params)
  }

  /**
   * Get search appearance timeline
   */
  async getSearchTimeline(params?: GetSearchTimelineParams): Promise<SearchTimelineResponse> {
    return this.get<SearchTimelineResponse>('/v1/analytics/search/timeline', params)
  }

  /**
   * Track a search impression (server-side)
   */
  async trackImpression(params: TrackImpressionParams): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/v1/analytics/impressions/track', params)
  }
}
