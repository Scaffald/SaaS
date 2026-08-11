/**
 * The ATS domain type.
 *
 * Previously this was `MockApplication`, exported from
 * `features/office/mock-data/ats-mock-data.ts` — a file whose header says it
 * exists so the UI can be built "WITHOUT needing a backend". Fourteen
 * production components imported their domain type from it, so the mock file
 * could not be deleted and the real shape could not be stated (#536).
 *
 * ─── Reconciled against the employer endpoint ─────────────────────────────
 *
 * The version this replaces described a `v_applications_with_user_profiles`
 * view that exists in no migration. Three groups of fields have been dealt
 * with rather than carried over:
 *
 *   Dropped   `autoRejected` — there is no `auto_rejected` column anywhere.
 *             `notes` / `messages` — `NotesTab` and `MessagesTab` fetch their
 *             own data; on this object they were always `[]`, which is why the
 *             detail tab read "Notes (0)" no matter how many notes existed.
 *
 *   Optional  Everything the employer payload does not carry: candidate
 *             contact details (gated behind the success fee and fetched by
 *             `useContactInfo`), skills, certifications, experience, and the
 *             job's company name. Optional rather than dropped because they
 *             are real concepts a future endpoint may return — but a consumer
 *             now has to acknowledge they may be absent instead of reading an
 *             empty array as "this candidate has no certifications".
 *
 *   Kept      Everything `toATSApplication` populates from real columns.
 *
 * `ats-mock-data.ts` is deleted rather than demoted to a fixture, which is
 * what #536 proposed. Once every import was repointed here, nothing referenced
 * it at all — not the fixtures, not the helpers, not a Storybook story. It was
 * 700 lines of dead code whose only remaining role was to be the file the
 * domain type lived in.
 */

export type ApplicationStatus =
  | 'new'
  | 'screen'
  | 'inquired'
  | 'interview'
  | 'offer'
  | 'hired'
  /**
   * The employer's decision.
   */
  | 'rejected'
  /**
   * The candidate pulled out. Distinct from `rejected` — the two were
   * collapsed, which made funnel conversion and EEO adverse-impact counts
   * wrong (#533). The board groups them into one terminal column with a
   * badge; the data keeps them apart.
   */
  | 'withdrawn'

export interface ATSCandidate {
  id: string
  name: string
  location: string
  photo: string
  title: string
  yearsExperience: number
  /** Unlocked by the success fee; fetched separately by `useContactInfo`. */
  email?: string
  /** Unlocked by the success fee; fetched separately by `useContactInfo`. */
  phone?: string
  /** Not in the employer payload. Absent is not the same as none. */
  skills?: Array<{
    name: string
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
  /** Not in the employer payload. Absent is not the same as none. */
  certifications?: Array<{
    name: string
    state?: string
    issueDate?: string
  }>
  /** Not in the employer payload. Absent is not the same as none. */
  experience?: Array<{
    title: string
    company: string
    duration: string
    description: string
  }>
}

export interface ATSJob {
  id: string
  title: string
  location: string
  payRange: string
  /** Not in the employer payload — the embed carries `organization_id` only. */
  company?: string
  organizationId?: string | null
  payRangeMinCents?: number | null
  payRangeMaxCents?: number | null
  payRangeType?: 'hourly' | 'salary' | 'contract' | 'project' | string | null
  employmentType?: string | null
  targetStartDate?: string | null
}

export interface ATSApplication {
  id: string
  organizationId?: string | null
  workerUserId?: string | null
  candidate: ATSCandidate
  job: ATSJob
  team?: {
    id: string | null
    name?: string | null
    assignedUserId?: string | null
  }
  status: ApplicationStatus
  /** How the candidate found the job (#91). */
  source?: 'scaffald' | 'referral' | 'external_board' | 'social_media' | 'company_website' | 'other'
  /** Union-aware hiring workflows (#98). */
  unionStatus?: {
    isUnionMember: boolean
    unionName?: string
    localNumber?: string
    membershipId?: string
    journeymanStatus?: 'apprentice' | 'journeyman' | 'master'
    prevailingWageEligible?: boolean
  }
  appliedAt: string
  updatedAt: string
  score: number
  screeningAnswers: {
    currentLocation: string
    willingToRelocate: boolean
    yearsExperience: number
    isAuthorizedToWork: boolean
    earliestStartDate: string
  }
  customAnswers: Array<{
    question: string
    answer: string
  }>
  attachments: {
    resume?: {
      filename: string
      size: number
      uploadedAt: string
    }
    coverLetter?: {
      filename: string
      size: number
      uploadedAt: string
    }
    portfolio?: {
      filename: string
      size: number
      uploadedAt: string
    }
  }
  stageHistory: Array<{
    fromStage: ApplicationStatus | null
    toStage: ApplicationStatus
    changedBy: string
    changedAt: string
    reason?: string
  }>
  inquiry?: {
    id: string
    sections: Array<{
      section_name: string
      accepted_by: string | null
      accepted_at: string | null
    }>
    comments: Array<{
      sender_id: string
      read_by: string[]
    }>
    capabilityResponses: Array<{
      capability_name: string
    }>
  } | null
}
