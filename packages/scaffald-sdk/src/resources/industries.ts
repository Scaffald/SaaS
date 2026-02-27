import { Resource } from './base.js'

export interface Industry {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface IndustryListResponse {
  data: Industry[]
  total: number
}

/**
 * Industries resource for accessing industry lookup data
 */
export class Industries extends Resource {
  /**
   * List all industries
   *
   * @returns List of all industries sorted alphabetically
   *
   * @example
   * ```typescript
   * const industries = await client.industries.list()
   * console.log(`Found ${industries.total} industries`)
   * industries.data.forEach(ind => console.log(ind.name))
   * ```
   */
  async list(): Promise<IndustryListResponse> {
    return this.get<IndustryListResponse>('/v1/industries')
  }

  /**
   * Get an industry by slug
   *
   * @param slug - The industry slug (e.g., 'technology', 'healthcare')
   * @returns The industry object or null if not found
   *
   * @example
   * ```typescript
   * const tech = await client.industries.retrieve('technology')
   * if (tech) {
   *   console.log(tech.name) // "Technology"
   *   console.log(tech.description)
   * }
   * ```
   */
  async retrieve(slug: string): Promise<Industry | null> {
    try {
      const res = await this.get<{ data: Industry }>(`/v1/industries/${slug}`)
      return res?.data ?? null
    } catch {
      return null
    }
  }
}
