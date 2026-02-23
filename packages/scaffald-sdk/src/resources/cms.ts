import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WelcomeSlide {
  id: string
  title: string
  description: string
  icon_name: string
  background_image_url: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GetActiveWelcomeSlidesResponse {
  slides: WelcomeSlide[]
}

export interface ListWelcomeSlidesParams {
  include_inactive?: boolean
}

export interface CreateWelcomeSlideParams {
  title: string
  description: string
  icon_name: string
  background_image_url: string
  display_order: number
  is_active?: boolean
}

export interface UpdateWelcomeSlideParams {
  id: string
  title: string
  description: string
  icon_name: string
  background_image_url: string
  display_order: number
  is_active: boolean
}

// ============================================================================
// CMS RESOURCE
// ============================================================================

/**
 * CMS resource for content management (welcome slides, etc.)
 */
export class CMS extends Resource {
  /**
   * Get active welcome slides (public)
   */
  async getActiveWelcomeSlides(): Promise<GetActiveWelcomeSlidesResponse> {
    const response = (await this.get<{ data: { slides: WelcomeSlide[] } }>(
      '/v1/cms/welcome-slides/active'
    )) as { data: { slides: WelcomeSlide[] } }
    return { slides: response.data.slides }
  }

  /**
   * List welcome slides (office role required for include_inactive)
   */
  async listWelcomeSlides(params?: ListWelcomeSlidesParams): Promise<GetActiveWelcomeSlidesResponse> {
    const response = (await this.get<{ data: { slides: WelcomeSlide[] } }>(
      '/v1/cms/welcome-slides',
      params
    )) as { data: { slides: WelcomeSlide[] } }
    return { slides: response.data.slides }
  }

  /**
   * Get single welcome slide by ID (office role required)
   */
  async getWelcomeSlide(id: string): Promise<{ slide: WelcomeSlide }> {
    const response = (await this.get<{ data: { slide: WelcomeSlide } }>(
      `/v1/cms/welcome-slides/${id}`
    )) as { data: { slide: WelcomeSlide } }
    return { slide: response.data.slide }
  }

  /**
   * Create welcome slide (office role required)
   */
  async createWelcomeSlide(params: CreateWelcomeSlideParams): Promise<{ slide: WelcomeSlide }> {
    const response = (await this.post<{ data: { slide: WelcomeSlide } }>(
      '/v1/cms/welcome-slides',
      params
    )) as { data: { slide: WelcomeSlide } }
    return { slide: response.data.slide }
  }

  /**
   * Update welcome slide (office role required)
   */
  async updateWelcomeSlide(params: UpdateWelcomeSlideParams): Promise<{ slide: WelcomeSlide }> {
    const { id, ...body } = params
    const response = (await this.patch<{ data: { slide: WelcomeSlide } }>(
      `/v1/cms/welcome-slides/${id}`,
      body
    )) as { data: { slide: WelcomeSlide } }
    return { slide: response.data.slide }
  }

  /**
   * Delete welcome slide (office role required)
   */
  async deleteWelcomeSlide(id: string): Promise<{ success: boolean }> {
    const response = (await this.del<{ data: { success: boolean } }>(
      `/v1/cms/welcome-slides/${id}`
    )) as { data: { success: boolean } }
    return { success: response.data.success }
  }
}
