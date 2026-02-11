/**
 * ProfileViews Resource
 * Track and analyze profile views
 */

import { Resource } from './base.js'

// ============================================================================
// Types
// ============================================================================

export interface ProfileViewViewer {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  headline: string | null
  industry_id: string | null
  industries?: {
    id: string
    name: string
  } | null
}

export interface ProfileView {
  id: string
  viewed_at: string
  viewer: ProfileViewViewer | null
  viewer_role_type: string | null
  viewer_industry: {
    id: string
    name: string
  } | null
}

export interface ViewAnalytics {
  views30d: number
  viewsTotal: number
  lastViewAt: string | null
  trend: number
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface RecordViewParams {
  viewedUserId: string
}

export interface RecordViewResponse {
  success: boolean
  skipped: boolean
  reason?: 'own_profile' | 'already_viewed_today' | 'already_viewed_session' | 'duplicate_prevented'
}

export interface GetProfileViewsParams {
  limit?: number
  offset?: number
}

export interface GetProfileViewsResponse {
  views: ProfileView[]
  total: number
}

// ============================================================================
// ProfileViews Resource
// ============================================================================

export class ProfileViews extends Resource {
  /**
   * Record a profile view (with deduplication)
   */
  async recordView(params: RecordViewParams): Promise<RecordViewResponse> {
    return this.post('/v1/profile-views/record', {
      viewed_user_id: params.viewedUserId,
    })
  }

  /**
   * Get who viewed current user's profile
   */
  async getProfileViews(params?: GetProfileViewsParams): Promise<GetProfileViewsResponse> {
    return this.get('/v1/profile-views', {
      limit: params?.limit,
      offset: params?.offset,
    })
  }

  /**
   * Get aggregated view statistics
   */
  async getViewAnalytics(): Promise<ViewAnalytics> {
    return this.get('/profile-views/analytics')
  }
}
