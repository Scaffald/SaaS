import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description?: unknown | null // JSONB for rich text
  image_url?: string | null
  file_path?: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface ListPortfolioItemsParams {
  userId?: string // If provided, get portfolio for specific user (public profile)
}

export interface CreatePortfolioItemParams {
  title: string
  description?: unknown
  imageUrl?: string
  filePath?: string
  displayOrder?: number
}

export interface UpdatePortfolioItemParams {
  id: string
  title?: string
  description?: unknown
  imageUrl?: string | null
  filePath?: string | null
  displayOrder?: number
}

export interface DeletePortfolioItemParams {
  id: string
}

export interface DeletePortfolioItemResponse {
  success: boolean
  deletedItem: PortfolioItem
}

export interface ReorderPortfolioItemsParams {
  items: Array<{
    id: string
    displayOrder: number
  }>
}

export interface ReorderPortfolioItemsResponse {
  success: boolean
  updatedCount: number
}

export interface UploadPortfolioImageParams {
  portfolioItemId?: string
  file: string // base64 encoded file data
  fileName: string
  contentType: string
}

export interface UploadPortfolioImageResponse {
  filePath: string
  imageUrl: string
}

// ============================================================================
// Portfolio Resource
// ============================================================================

/**
 * Portfolio Resource
 * Handles user portfolio items - projects, work samples, achievements
 */
export class Portfolio extends Resource {
  /**
   * List portfolio items
   * Returns portfolio items ordered by display_order
   */
  async list(params?: ListPortfolioItemsParams): Promise<PortfolioItem[]> {
    return this.get<PortfolioItem[]>('/v1/profiles/portfolio', params)
  }

  /**
   * Create a new portfolio item
   */
  async create(params: CreatePortfolioItemParams): Promise<PortfolioItem> {
    return this.post<PortfolioItem>('/v1/profiles/portfolio', params)
  }

  /**
   * Update a portfolio item
   */
  async update(params: UpdatePortfolioItemParams): Promise<PortfolioItem> {
    const { id, ...updates } = params
    return this.patch<PortfolioItem>(`/v1/profiles/portfolio/${id}`, updates)
  }

  /**
   * Delete a portfolio item
   */
  async delete(params: DeletePortfolioItemParams): Promise<DeletePortfolioItemResponse> {
    return this.del<DeletePortfolioItemResponse>(`/v1/profiles/portfolio/${params.id}`)
  }

  /**
   * Reorder portfolio items
   * Updates display_order for multiple items at once
   */
  async reorder(params: ReorderPortfolioItemsParams): Promise<ReorderPortfolioItemsResponse> {
    return this.post<ReorderPortfolioItemsResponse>('/v1/profiles/portfolio/reorder', params)
  }

  /**
   * Upload portfolio image
   * Handles file upload to storage and returns file path + URL
   */
  async uploadImage(params: UploadPortfolioImageParams): Promise<UploadPortfolioImageResponse> {
    return this.post<UploadPortfolioImageResponse>('/v1/profiles/portfolio/upload-image', params)
  }
}
