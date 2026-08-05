import { Button, H2, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import type { ApplicationStatus, MockApplication } from '../mock-data/ats-mock-data'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import type { ApplicationsListItem } from './hooks/useApplications'
import { useApplications } from './hooks/useApplications'
import { STATUS_MAP } from './hooks/useApplicationStatusChange'
import { colors } from '@scaffald/ui/tokens'

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

export type OfficeApplicationsView = 'kanban' | 'metrics'

export interface OfficeApplicationsScreenProps {
  /** Which view to open on. `/office/ats/metrics` passes 'metrics' — it used
   *  to render this screen on the kanban and rely on the user finding the tab. */
  initialView?: OfficeApplicationsView
}

export const OfficeApplicationsScreen = ({
  initialView = 'kanban',
}: OfficeApplicationsScreenProps = {}) => {
  const { theme } = useThemeContext()
  const [viewMode, setViewMode] = useState<OfficeApplicationsView>(initialView)
  const [filters, setFilters] = useState<{
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }>({
    jobId: null,
    status: null,
    minScore: 0,
  })

  // Filters go to the server. `filters.status` is a kanban stage name
  // (`new`, `screen`, …) and the API takes its own vocabulary (`pending`,
  // `reviewing`, …), so it has to be mapped — the previous code *cast* it,
  // which satisfied the compiler while sending a value the API enum rejects.
  const { applications, isLoading, isError, error } = useApplications({
    status: filters.status ? STATUS_MAP[filters.status] : undefined,
    job_id: filters.jobId ?? undefined,
    min_score: filters.minScore > 0 ? filters.minScore : undefined,
  })

  /**
   * Map the employer API's rows onto the shape the kanban components expect.
   *
   * The previous version of this block was written against a
   * `v_applications_with_user_profiles` view that does not exist in any
   * migration, and read ~25 fields that are not columns on core.applications.
   * Names below are the real ones:
   *
   *   score_total          not application_score
   *   created_at           not applied_at
   *   attachment_metadata  not attachments
   *   screening_answers.*  not flat current_location / years_experience / …
   *
   * There is no `auto_rejected` column at all; `rejected_at` is the closest
   * signal the database actually records.
   */
  const transformedApplications = useMemo(() => {
    return applications.map((app: ApplicationsListItem): MockApplication => {
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

      // `withdrawn` is folded into `rejected` only because the board has no
      // column for it. That conflation is wrong for funnel and EEO counts and
      // is tracked separately (#533).
      const statusMap: Record<string, ApplicationStatus> = {
        pending: 'new',
        reviewing: 'screen',
        inquired: 'inquired',
        interview: 'interview',
        offer: 'offer',
        hired: 'hired',
        rejected: 'rejected',
        withdrawn: 'rejected',
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
        source: app.source as MockApplication['source'],
        appliedAt: app.created_at,
        updatedAt: app.updated_at ?? app.created_at,
        score: app.score_total ?? 0,
        autoRejected: false,
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
        attachments: (app.attachment_metadata ?? {}) as MockApplication['attachments'],
        // Populated by #531 once stage transitions are recorded; the API does
        // not return them yet, and pretending otherwise is what made the
        // metrics dashboard silently compute zeroes.
        notes: [],
        messages: [],
        stageHistory: [],
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
    })
  }, [applications])

  // Score, status and job are all applied by the API now. Filtering here as
  // well would be wrong rather than merely redundant: it would run against the
  // current page only, so a paginated board would silently drop matches.
  const filteredApplications = transformedApplications

  // Loading state
  if (isLoading) {
    return (
      <Stack
        flex={1}
        align="center"
        justify="center"
        style={{ backgroundColor: colors.bg[theme].default }}
      >
        <Spinner variant="ios" size="lg" />
        <Text style={{ marginTop: 16, color: colors.text[theme].secondary }}>
          Loading applications...
        </Text>
      </Stack>
    )
  }

  // Error state - error from useApplications may be unknown
  const errorMessage =
    error != null && typeof (error as { message?: string }).message === 'string'
      ? (error as Error).message
      : 'Failed to load applications. Please try again.'

  if (isError) {
    return (
      <Stack flex={1} align="center" justify="center" padding="md">
        <Text style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}>
          Error Loading Applications
        </Text>
        <Stack align="center">
          <Text style={{ color: colors.text[theme].secondary, marginTop: 8 }}>{errorMessage}</Text>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
      {/* Header */}
      <Row justify="space-between" align="center" marginBottom={16}>
        <Stack>
          <H2>Applications</H2>
          <Text style={{ color: colors.text[theme].secondary }}>
            {filteredApplications.length} total applications
          </Text>
        </Stack>

        <Row gap={8}>
          <Button
            size="sm"
            onPress={() => setViewMode('kanban')}
            variant={viewMode === 'kanban' ? 'outline' : undefined}
          >
            Kanban
          </Button>
          <Button
            size="sm"
            onPress={() => setViewMode('metrics')}
            variant={viewMode === 'metrics' ? 'outline' : undefined}
          >
            Metrics
          </Button>
        </Row>
      </Row>

      {/* Filters - Note: needs jobs list from API */}
      <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={[]} />

      {/* Content */}
      {viewMode === 'metrics' ? (
        <ATSMetricsDashboard applications={filteredApplications} isLoading={isLoading} />
      ) : (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      )}
    </Stack>
  )
}
