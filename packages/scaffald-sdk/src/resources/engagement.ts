import { Resource } from './base.js'

export type EngagementEventType =
  | 'profile_view'
  | 'job_view'
  | 'job_click'
  | 'application_start'
  | 'application_complete'
  | 'search'
  | 'filter_change'

export type EngagementTargetType = 'user' | 'job' | 'organization'

export interface TrackEventParams {
  eventType: EngagementEventType
  targetType?: EngagementTargetType
  targetId?: string
  metadata?: Record<string, unknown>
}

export interface EngagementEvent {
  id: string
  user_id: string
  event_type: EngagementEventType
  target_type?: EngagementTargetType
  target_id?: string
  event_metadata?: Record<string, unknown>
  occurred_at: string
  created_at: string
}

export interface GetRecentActivityParams {
  limit?: number
  eventTypes?: string[]
}

export interface GetEngagementMetricsParams {
  days?: number
}

export interface EngagementMetrics {
  profile_views: number
  job_views: number
  applications_started: number
  applications_completed: number
  searches: number
  total_events: number
}

export interface RecentActivityResponse {
  data: EngagementEvent[]
}

export class Engagement extends Resource {
  /**
   * Track an engagement event
   */
  async track(params: TrackEventParams): Promise<EngagementEvent> {
    return this.post<EngagementEvent>('/v1/engagement/track', params)
  }

  /**
   * Get recent activity for the current user
   */
  async getRecentActivity(params?: GetRecentActivityParams): Promise<RecentActivityResponse> {
    // Validate params
    if (params?.eventTypes !== undefined && params.eventTypes.length === 0) {
      throw new Error('eventTypes cannot be empty')
    }

    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.eventTypes) {
      for (const type of params.eventTypes) {
        queryParams.append('eventTypes[]', type)
      }
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.get<RecentActivityResponse>(`/v1/engagement/activity${query}`)
  }

  /**
   * Get engagement metrics for the current user
   */
  async getMetrics(params?: GetEngagementMetricsParams): Promise<EngagementMetrics> {
    const queryParams = new URLSearchParams()
    if (params?.days !== undefined) queryParams.append('days', params.days.toString())
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.get<EngagementMetrics>(`/v1/engagement/metrics${query}`)
  }
}
