import { Resource } from './base.js'

export interface NewsArticle {
  id: string
  title: string | null
  description: string
  link: string | null
  pubDate: string
  imageUrl: string | null
  source: string | null
  category: string | null
  region: string | null
}

export interface GetNewsByIndustryParams {
  industryId: string
  limit?: number
  category?: string
  region?: string
}

export class News extends Resource {
  async getByIndustry(params: GetNewsByIndustryParams): Promise<NewsArticle[]> {
    const searchParams = new URLSearchParams()
    searchParams.set('industryId', params.industryId)
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
    if (params.category) searchParams.set('category', params.category)
    if (params.region) searchParams.set('region', params.region)
    return this.get<NewsArticle[]>(`/v1/news?${searchParams.toString()}`)
  }
}
