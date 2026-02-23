/**
 * Resume types for the Scaffald SDK
 */

export type ResumeSection =
  | 'general'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'employment'

export type ResumeMergeStrategyMode = 'replace' | 'append' | 'keepExisting'

// ===== Upload =====

export interface UploadResumeParams {
  fileData: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UploadResumeResponse {
  success: true
  resumeId: string
  filePath: string
}

// ===== Parse =====

export interface ParseResumeParams {
  resumeId: string
  sections?: ResumeSection[]
}

export interface ParsedGeneralEntry {
  firstName?: string
  lastName?: string
  headline?: string
  bio?: string
}

export interface ParsedExperienceEntry {
  title?: string
  company?: string
  startDate?: string
  endDate?: string | null
  isCurrent?: boolean
  summary?: string
}

export interface ParsedEducationEntry {
  school?: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string | null
}

export interface ParsedCertificationEntry {
  name?: string
  issuer?: string
  issuedOn?: string | null
  expiresOn?: string | null
}

export interface ParsedSkillEntry {
  name: string
  confidence?: number
}

export interface ParsedEmploymentEntry {
  hourlyRate?: number
  locations?: string[]
  openToTravel?: boolean
  travelDistanceMiles?: number
}

export interface ParsedResumeData {
  general?: ParsedGeneralEntry[]
  experience?: ParsedExperienceEntry[]
  education?: ParsedEducationEntry[]
  certifications?: ParsedCertificationEntry[]
  skills?: ParsedSkillEntry[]
  employment?: ParsedEmploymentEntry
}

export interface ResumeParseError {
  section: ResumeSection
  message: string
  rawText?: string
}

export interface ParseResumeResponse {
  success: true
  parsedData: ParsedResumeData
  errors?: ResumeParseError[]
}

// ===== Has Uploaded =====

export interface HasUploadedResumeResponse {
  hasUploaded: boolean
}

// ===== Wizard State =====

export interface ResumeWizardState {
  id: string
  userId: string
  resumeId: string
  currentStep: number
  completedSteps: number[]
  parsedData?: ParsedResumeData
  errors?: ResumeParseError[]
  startedAt: string
  updatedAt: string
  completedAt: string | null
}

// ===== Save Section =====

export interface SaveResumeSectionParams {
  section: ResumeSection
  data: unknown
  wizardState: {
    resumeId: string
    currentStep: number
    completedSteps: number[]
  }
  mergeStrategy?: {
    mode: ResumeMergeStrategyMode
  }
}

export interface SaveResumeSectionResponse {
  success: boolean
}

// ===== Update Progress =====

export interface UpdateResumeProgressParams {
  resumeId: string
  currentStep: number
  completedSteps?: number[]
}

export interface UpdateResumeProgressResponse {
  success: boolean
}
