export type SearchResultType = 'job' | 'skill' | 'professional'

export interface UniversalSearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  avatarUrl?: string
  route: string
}

export interface UniversalSearchGroup {
  type: SearchResultType
  label: string
  results: UniversalSearchResult[]
  isLoading: boolean
  seeAllRoute?: string
}
