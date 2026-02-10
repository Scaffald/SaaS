import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export interface GeneralImportEntry {
  first_name?: string
  last_name?: string
  headline?: string
  summary?: string
  confidence_score?: number
}

export interface ExperienceImportEntry {
  job_title: string
  company_name: string
  start_date?: string | null
  end_date?: string | null
  is_current?: boolean
  confidence_score?: number
}

export interface EducationImportEntry {
  institution: string
  degree?: string
  start_date?: string | null
  end_date?: string | null
  confidence_score?: number
}

export interface SkillImportEntry {
  name: string
  taxonomy?: string
  confidence_score?: number
}

export interface CertificationImportEntry {
  name: string
  issuer?: string
  issue_date?: string | null
  confidence_score?: number
}

export interface ImportPayload {
  general: GeneralImportEntry[]
  experience: ExperienceImportEntry[]
  education: EducationImportEntry[]
  skills: SkillImportEntry[]
  certifications: CertificationImportEntry[]
}

export interface ImportMetadata {
  version: number
  source: 'resume' | 'json' | 'linkedin' | 'manual'
  storedAt: string
  expiresAt: string
  payload: ImportPayload
}

export interface SaveImportDataParams {
  payload: ImportPayload
  source: 'resume' | 'json' | 'linkedin' | 'manual'
}

export interface SaveImportDataResponse {
  metadata: ImportMetadata
}

export interface ClearImportDataResponse {
  success: boolean
}

// ============================================================================
// ProfileImport Resource
// ============================================================================

/**
 * Profile Import Resource
 * Handles profile data import from various sources
 */
export class ProfileImport extends Resource {
  /**
   * Get saved import data (TTL: 24 hours)
   */
  async getImportData(): Promise<ImportMetadata | null> {
    return this.get<ImportMetadata | null>('/v1/profiles/import/data')
  }

  /**
   * Save import data for review (expires after 24 hours)
   */
  async saveImportData(params: SaveImportDataParams): Promise<SaveImportDataResponse> {
    return this.post<SaveImportDataResponse>('/v1/profiles/import/data', params)
  }

  /**
   * Clear saved import data
   */
  async clearImportData(): Promise<ClearImportDataResponse> {
    return this.del<ClearImportDataResponse>('/v1/profiles/import/data')
  }
}
