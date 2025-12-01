// Shared types for external job import system

export interface ExternalJobFeed {
  id: string
  name: string
  url: string
  feed_type: 'rss' | 'api'
  parser_config: Record<string, unknown>
  is_active: boolean
  fetch_interval_hours: number
  last_fetched_at?: string
  last_success_at?: string
  error_count: number
  last_error?: string
  created_at: string
  updated_at: string
}

export interface ParsedJob {
  external_guid: string
  title: string
  description?: string
  company_name?: string
  company_logo?: string
  company_website?: string
  company_headquarters?: string
  job_location?: string
  job_type?: string
  job_category?: string
  job_tags?: string[]
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  compensation_min?: number
  compensation_max?: number
  compensation_currency?: string
  compensation_period?: string
  application_url: string
  external_url: string
  posted_date?: Date
  expires_date?: Date
  featured?: boolean
  raw_data?: Record<string, unknown>
}

export interface ExternalJob extends ParsedJob {
  id: string
  feed_id: string
  is_active: boolean
  archived_at?: string
  content_hash: string
  created_at: string
  updated_at: string
  last_processed_at: string
}

export interface IndustryMapping {
  industry_id: string
  industry_name: string
  confidence_score: number
  mapped_by: 'rule' | 'ai' | 'manual'
}

export interface SkillMapping {
  skill_id: string
  skill_name: string
  required_level: number
  confidence_score: number
  extracted_by: 'rule' | 'ai' | 'manual'
}

export interface JobImportResult {
  feed_id: string
  feed_name: string
  total_parsed: number
  new_jobs: number
  updated_jobs: number
  skipped_duplicates: number
  skipped_no_industry: number
  errors: Array<{
    job_guid: string
    error: string
  }>
}

export interface ImportOrchestrationResult {
  success: boolean
  timestamp: string
  source: 'cron' | 'manual'
  feeds_processed: number
  results: JobImportResult[]
  total_new_jobs: number
  total_errors: number
  duration_ms: number
}

// RSS Feed item (generic structure)
export interface RSSItem {
  guid?: string
  title?: string
  link?: string
  description?: string
  content?: string
  contentSnippet?: string
  pubDate?: string
  category?: string | string[]
  [key: string]: unknown
}

export interface RSSFeed {
  title?: string
  description?: string
  link?: string
  language?: string
  lastBuildDate?: string
  items: RSSItem[]
}

// Jooble API response
export interface JoobleJob {
  title: string
  location: string
  snippet: string
  salary: string
  source: string
  type: string
  link: string
  company: string
  updated: string
  id: string
}

export interface JoobleResponse {
  totalCount: number
  jobs: JoobleJob[]
}

// Parser interface
export interface JobParser {
  name: string
  parseJobs(feed: ExternalJobFeed): Promise<ParsedJob[]>
}

// Database operations
export interface JobWriteResult {
  success: boolean
  job_id?: string
  is_new: boolean
  error?: string
}

export interface DeduplicationResult {
  is_duplicate: boolean
  existing_job_id?: string
  similarity_score?: number
  reason?: string
}
