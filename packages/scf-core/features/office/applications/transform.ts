/**
 * Map an employer API row onto the shape the ATS components expect.
 *
 * Extracted from office-applications-screen so the per-application detail
 * route builds its application exactly the way the kanban board does (#537).
 * Two copies of this transform would drift, and the drift would show up as a
 * field that renders on a card and is blank on the detail page.
 *
 * The previous version of this block was written against a
 * `v_applications_with_user_profiles` view that does not exist in any
 * migration, and read ~25 fields that are not columns on core.applications.
 * The names used here are the real ones:
 *
 *   score_total          not application_score
 *   created_at           not applied_at
 *   attachment_metadata  not attachments
 *   screening_answers.*  not flat current_location / years_experience / …
 *
 * `ATSApplication` is still the domain type these components share; renaming
 * it is #536.
 */

import type { ApplicationStatus, ATSApplication } from './types'
import type { ApplicationsListItem } from './hooks/useApplications'
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatPayRange(minCents?: number | null, maxCents?: number | null, type?: string | null) {
  if (!minCents && !maxCents) return ''
  const label =
    minCents && maxCents
      ? `${currencyFormatter.format(minCents / 100)} - ${currencyFormatter.format(maxCents / 100)}`
      : currencyFormatter.format((maxCents ?? minCents ?? 0) / 100)
  const suffix =
    type === 'hourly'
      ? '/hr'
      : type === 'salary'
        ? '/yr'
        : type === 'contract'
          ? ' (contract)'
          : type === 'project'
            ? ' (project)'
            : ''
  return `${label}${suffix}`
}

export function toATSApplication(app: ApplicationsListItem): ATSApplication {
  const screening = (app.screening_answers ?? {}) as {
    current_location?: string
    willing_to_relocate?: boolean
    years_experience?: number
    is_authorized_to_work?: boolean
    earliest_start_date?: string
    custom_question_answers?: Array<{
      question?: string
      answer?: string | boolean | string[]
    }>
  }

  const job = app.job
  const candidate = app.candidate

  // `withdrawn` stays distinct from `rejected`. Collapsing them made every
  // funnel conversion and EEO adverse-impact count wrong, since a candidate
  // who pulled out was counted as one the employer turned down (#533). The
  // board draws them in one terminal column; the data keeps them apart.
  const statusMap: Record<string, ApplicationStatus> = {
    pending: 'new',
    reviewing: 'screen',
    inquired: 'inquired',
    interview: 'interview',
    offer: 'offer',
    hired: 'hired',
    rejected: 'rejected',
    withdrawn: 'withdrawn',
  }

  const formatAnswer = (v: string | boolean | string[] | undefined): string =>
    typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : String(v ?? '')

  const unionStatus = app.union_status as {
    is_union_member?: boolean
    union_name?: string
    local_number?: string
    membership_id?: string
    journeyman_status?: 'apprentice' | 'journeyman' | 'master'
    prevailing_wage_eligible?: boolean
  } | null

  return {
    id: app.id,
    status: statusMap[app.status] ?? 'new',
    source: app.source as ATSApplication['source'],
    appliedAt: app.created_at,
    updatedAt: app.updated_at ?? app.created_at,
    score: app.score_total ?? 0,
    screeningAnswers: {
      currentLocation: screening.current_location ?? '',
      willingToRelocate: screening.willing_to_relocate ?? false,
      yearsExperience: screening.years_experience ?? 0,
      isAuthorizedToWork: screening.is_authorized_to_work ?? false,
      earliestStartDate: screening.earliest_start_date ?? '',
    },
    customAnswers: (screening.custom_question_answers ?? []).map((qa) => ({
      question: qa.question ?? '',
      answer: formatAnswer(qa.answer),
    })),
    attachments: (app.attachment_metadata ?? {}) as ATSApplication['attachments'],
    // Real transitions from core.application_activity. This was hardcoded
    // `[]`, which made time-to-hire and funnel conversion structurally
    // zero no matter what the pipeline actually did (#531).
    stageHistory: (app.stage_history ?? []).map((change) => ({
      fromStage: (change.from_status as ApplicationStatus | null) ?? null,
      toStage: change.to_status as ApplicationStatus,
      changedBy: change.actor_user_id ?? '',
      changedAt: change.changed_at,
    })),
    candidate: {
      id: candidate?.id ?? app.user_id,
      name: candidate?.display_name ?? candidate?.username ?? 'Unknown',
      email: '',
      phone: '',
      title: candidate?.headline ?? 'Applicant',
      photo: candidate?.avatar_url ?? candidate?.avatar_path ?? '',
      location: screening.current_location ?? '',
      yearsExperience: screening.years_experience ?? 0,
      skills: [],
      certifications: [],
      experience: [],
    },
    job: {
      id: job?.id ?? app.job_id,
      title: job?.title ?? 'Position',
      company: '',
      location: job?.location ?? '',
      payRange: formatPayRange(
        job?.pay_range_min_cents,
        job?.pay_range_max_cents,
        job?.pay_range_type
      ),
      organizationId: job?.organization_id ?? null,
      payRangeMinCents: job?.pay_range_min_cents ?? null,
      payRangeMaxCents: job?.pay_range_max_cents ?? null,
      payRangeType: job?.pay_range_type ?? null,
      employmentType: job?.employment_type ?? null,
      targetStartDate: null,
    },
    organizationId: job?.organization_id ?? null,
    workerUserId: app.user_id,
    // Team assignment lives in core.job_team_assignments, which the list
    // endpoint does not join yet. Left null rather than invented.
    team: {
      id: null,
      name: null,
      assignedUserId: app.assigned_to ?? null,
    },
    unionStatus: unionStatus
      ? {
          isUnionMember: unionStatus.is_union_member ?? false,
          unionName: unionStatus.union_name,
          localNumber: unionStatus.local_number,
          membershipId: unionStatus.membership_id,
          journeymanStatus: unionStatus.journeyman_status,
          prevailingWageEligible: unionStatus.prevailing_wage_eligible,
        }
      : undefined,
  }
}
