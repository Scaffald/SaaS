import { useQuery } from '@tanstack/react-query'
import type { GetNewsByIndustryParams, NewsArticle } from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export function useNewsByIndustry(
  params: GetNewsByIndustryParams,
  options?: {
    staleTime?: number
    enabled?: boolean
    retry?: number
  }
) {
  const client = useScaffaldJobsClient()
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', 'by-industry', params.industryId, params.limit, params.category, params.region],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.news.getByIndustry(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 15 * 60 * 1000,
    retry: options?.retry ?? 2,
  })
}
