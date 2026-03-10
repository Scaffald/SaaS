import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FeedbackType = 'bug' | 'feature' | 'comment'

export interface FeedbackSubmitParams {
  feedbackType: FeedbackType
  feedbackText: string
  screenshotPath?: string
  pageUrl: string
  pageTitle?: string
  userAgent: string
  browserName?: string
  browserVersion?: string
  operatingSystem?: string
  screenResolution?: string
  viewportSize?: string
}

export interface FeedbackSubmitResponse {
  id: string
  status: 'pending' | 'synced' | 'failed'
  createdAt: string
}

export interface FeedbackGetUploadUrlParams {
  fileName: string
  fileType: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/gif' | 'image/webp'
  fileSize: number
}

export interface FeedbackGetUploadUrlResponse {
  uploadUrl: string
  token: string
  filePath: string
  bucket: string
  expiresIn: number
}

export interface FeedbackHistoryItem {
  id: string
  feedback_type: 'bug' | 'feature' | 'comment'
  feedback_text: string
  screenshot_path: string | null
  page_url: string
  page_title: string | null
  user_agent: string
  browser_name: string | null
  browser_version: string | null
  operating_system: string | null
  screen_resolution: string | null
  viewport_size: string | null
  created_at: string
  updated_at: string
}

export interface GetUserFeedbackParams {
  limit?: number
  offset?: number
}

export interface GetUserFeedbackResponse {
  items: FeedbackHistoryItem[]
  totalCount: number
  hasMore: boolean
  nextOffset: number | null
}

// ============================================================================
// FEEDBACK RESOURCE
// ============================================================================

/**
 * Feedback resource for user feedback submission.
 * Requires supabaseToken (user JWT) – user must be logged in.
 */
export class Feedback extends Resource {
  /**
   * Get current user's feedback history
   */
  async getUserFeedback(params?: GetUserFeedbackParams): Promise<GetUserFeedbackResponse> {
    const response = (await this.get<{ data: GetUserFeedbackResponse }>(
      '/v1/feedback/user-feedback',
      params as Record<string, unknown>
    )) as { data: GetUserFeedbackResponse }
    return response.data
  }

  /**
   * Submit user feedback
   */
  async submit(params: FeedbackSubmitParams): Promise<FeedbackSubmitResponse> {
    const response = (await this.post<{ data: FeedbackSubmitResponse }>(
      '/v1/feedback/submit',
      params
    )) as { data: FeedbackSubmitResponse }
    return response.data
  }

  /**
   * Get signed upload URL for feedback screenshot
   */
  async getUploadUrl(params: FeedbackGetUploadUrlParams): Promise<FeedbackGetUploadUrlResponse> {
    const response = (await this.post<{ data: FeedbackGetUploadUrlResponse }>(
      '/v1/feedback/upload-url',
      params
    )) as { data: FeedbackGetUploadUrlResponse }
    return response.data
  }
}
