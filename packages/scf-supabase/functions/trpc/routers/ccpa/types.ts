/**
 * CCPA Data Collector Type Definitions
 *
 * Provides TypeScript interfaces for CCPA data export structures,
 * organized by CCPA data categories.
 */

// ========================================================
// ENUMS AND CONSTANTS
// ========================================================

/**
 * CCPA data categories as defined by California law
 */
export type CCPADataCategory =
  | 'personal_information'
  | 'professional_information'
  | 'financial_information'
  | 'usage_information'
  | 'sensitive_information'
  | 'communications'

/**
 * Data retention periods for different data types
 */
export type RetentionPeriod =
  | 'indefinite'
  | '7_years'
  | '5_years'
  | '3_years'
  | '1_year'
  | '90_days'
  | '30_days'

/**
 * Data source metadata
 */
export interface DataSource {
  /**
   * Table/schema name
   */
  source: string
  /**
   * Human-readable description
   */
  description: string
  /**
   * When this data was collected
   */
  collectedAt: string
  /**
   * Retention period for this data
   */
  retentionPeriod: RetentionPeriod
}

// ========================================================
// PERSONAL INFORMATION
// ========================================================

export interface PersonalInformation {
  /**
   * User's email address
   */
  email: string | null
  /**
   * User's phone number
   */
  phone: string | null
  /**
   * First name
   */
  firstName: string | null
  /**
   * Last name
   */
  lastName: string | null
  /**
   * Physical address (JSONB)
   */
  address: Record<string, unknown> | null
  /**
   * Avatar/profile picture path
   */
  avatarPath: string | null
  /**
   * Account creation date
   */
  accountCreatedAt: string | null
  /**
   * Last sign in date
   */
  lastSignInAt: string | null
  /**
   * Auth provider used
   */
  authProvider: string | null
  /**
   * App-level metadata
   */
  appMetadata: Record<string, unknown> | null
  /**
   * User-level metadata
   */
  userMetadata: Record<string, unknown> | null
}

// ========================================================
// PROFESSIONAL INFORMATION
// ========================================================

export interface EducationEntry {
  id: string
  institutionName: string
  universityId: string | null
  degreeType: string | null
  fieldOfStudy: string | null
  startDate: string | null
  endDate: string | null
  isVerified: boolean
  gpa: number | null
  description: string | null
}

export interface SkillEntry {
  id: string
  skillId: string
  skillName: string | null
  taxonomyType: string | null
  yearsExperience: number | null
  proficiencyLevel: string | null
  isVerified: boolean
}

export interface ExperienceEntry {
  id: string
  companyName: string | null
  jobTitle: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string | null
  location: string | null
}

export interface CertificationEntry {
  id: string
  certificationName: string
  issuingOrganization: string | null
  issueDate: string | null
  expirationDate: string | null
  credentialId: string | null
  isVerified: boolean
}

export interface WorkLogEntry {
  id: string
  projectId: string | null
  logDate: string | null
  totalHours: number | null
  workDescription: string | null
  status: string
  tasksCompleted: unknown[]
  skillsUsed: unknown[]
  visibility: string
  submittedAt: string | null
  verifiedAt: string | null
}

export interface ProfessionalInformation {
  /**
   * Public profile slug/username
   */
  slug: string | null
  /**
   * Profile headline
   */
  headline: string | null
  /**
   * About/bio (rich text)
   */
  about: Record<string, unknown> | null
  /**
   * Education history
   */
  education: EducationEntry[]
  /**
   * Skills list
   */
  skills: SkillEntry[]
  /**
   * Work experience
   */
  experience: ExperienceEntry[]
  /**
   * Certifications
   */
  certifications: CertificationEntry[]
  /**
   * Work logs
   */
  workLogs: WorkLogEntry[]
}

// ========================================================
// FINANCIAL INFORMATION
// ========================================================

export interface PaymentEntry {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  description: string | null
}

export interface FinancialInformation {
  /**
   * Stripe customer ID (if connected)
   */
  stripeCustomerId: string | null
  /**
   * Payment history (limited info)
   */
  payments: PaymentEntry[]
  /**
   * Whether Stripe is connected
   */
  stripeConnected: boolean
}

// ========================================================
// USAGE INFORMATION
// ========================================================

export interface ProfileViewEntry {
  id: string
  viewerId: string | null
  viewedAt: string
  viewerType: string | null
}

export interface LoginHistoryEntry {
  signedInAt: string
  ipAddress: string | null
  userAgent: string | null
}

export interface UsageInformation {
  /**
   * Profile views received
   */
  profileViews: ProfileViewEntry[]
  /**
   * Login history (from auth metadata)
   */
  loginHistory: LoginHistoryEntry[]
  /**
   * Total number of job applications
   */
  applicationCount: number
  /**
   * Total number of connections
   */
  connectionCount: number
}

// ========================================================
// SENSITIVE INFORMATION
// ========================================================

export interface BackgroundCheckEntry {
  id: string
  provider: string
  status: string
  requestedAt: string
  completedAt: string | null
  resultSummary: string | null
}

export interface IdVerificationEntry {
  id: string
  provider: string
  status: string
  verifiedAt: string | null
  documentType: string | null
}

export interface PersonalityAssessmentEntry {
  id: string
  assessmentType: string
  completedAt: string | null
  results: Record<string, unknown> | null
}

export interface SensitiveInformation {
  /**
   * Background check records
   */
  backgroundChecks: BackgroundCheckEntry[]
  /**
   * ID verification records
   */
  idVerifications: IdVerificationEntry[]
  /**
   * Personality assessment results
   */
  personalityAssessments: PersonalityAssessmentEntry[]
}

// ========================================================
// COMMUNICATIONS
// ========================================================

export interface ReviewEntry {
  id: string
  reviewType: 'given' | 'received'
  rating: number | null
  content: string | null
  createdAt: string
  projectId: string | null
}

export interface FeedbackEntry {
  id: string
  feedbackType: string
  content: string | null
  createdAt: string
  status: string
}

export interface CommunicationsData {
  /**
   * Reviews given and received
   */
  reviews: ReviewEntry[]
  /**
   * Platform feedback submitted
   */
  feedback: FeedbackEntry[]
}

// ========================================================
// MAIN EXPORT STRUCTURE
// ========================================================

/**
 * Complete user data export structure
 */
export interface UserDataExport {
  /**
   * Export metadata
   */
  metadata: {
    /**
     * User ID
     */
    userId: string
    /**
     * When the export was generated
     */
    exportedAt: string
    /**
     * Export format version
     */
    formatVersion: string
    /**
     * Data sources included
     */
    dataSources: DataSource[]
    /**
     * Total record count across all categories
     */
    totalRecords: number
    /**
     * Approximate size in bytes (for JSON)
     */
    approximateSizeBytes: number
    /**
     * How long collection took (ms)
     */
    collectionDurationMs: number
  }
  /**
   * Personal information (identifiers, contact info)
   */
  personalInformation: PersonalInformation
  /**
   * Professional information (profile, skills, education, work history)
   */
  professionalInformation: ProfessionalInformation
  /**
   * Financial information (payments, subscriptions)
   */
  financialInformation: FinancialInformation
  /**
   * Usage information (activity, analytics)
   */
  usageInformation: UsageInformation
  /**
   * Sensitive information (background checks, ID verification)
   */
  sensitiveInformation: SensitiveInformation
  /**
   * Communications (reviews, feedback, messages)
   */
  communications: CommunicationsData
}

/**
 * Collection result with partial success support
 */
export interface CollectionResult {
  success: boolean
  data: UserDataExport | null
  errors: Array<{
    source: string
    error: string
  }>
}
