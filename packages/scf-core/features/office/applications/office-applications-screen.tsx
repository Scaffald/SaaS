import { Button, H2, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import type { ApplicationStatus, MockApplication } from '../mock-data/ats-mock-data'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import type { ApplicationsListItem } from './hooks/useApplications'
import { useApplications } from './hooks/useApplications'
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

export const OfficeApplicationsScreen = () => {
  const { theme } = useThemeContext()
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'metrics'>('kanban')
  const [filters, setFilters] = useState<{
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }>({
    jobId: null,
    status: null,
    minScore: 0,
  })

  // Fetch applications using tRPC
  const { applications, isLoading, isError, error } = useApplications({
    status:
      (filters.status as
        | 'pending'
        | 'reviewing'
        | 'interview'
        | 'offer'
        | 'hired'
        | 'rejected'
        | 'withdrawn'
        | undefined) || undefined,
  })

  // Transform real database records to MockApplication format for UI compatibility
  // Data comes from v_applications_with_user_profiles view with flattened fields
  const transformedApplications = useMemo(() => {
    return applications.map((app: ApplicationsListItem): MockApplication => {
      const a = app as ApplicationsListItem & {
        applied_at?: string
        job?: {
          primary_team_id?: string | null
          teamAssignments?: Array<{ teamId: string; isPrimary: boolean; team?: { name: string | null } }>
          pay_range_min_cents?: number | null
          pay_range_max_cents?: number | null
          pay_range_type?: string | null
          employment_type?: string | null
          organization_id?: string | null
        } | null
        application_score?: number
        auto_rejected?: boolean
        custom_question_answers?: Array<{ question: string; answer: string | boolean | string[] }>
        current_location?: string
        willing_to_relocate?: boolean
        years_experience?: number
        is_authorized_to_work?: boolean
        earliest_start_date?: string
        attachments?: MockApplication['attachments']
        candidate_id?: string
        candidate_name?: string
        profile_about?: string
        profile_avatar_path?: string
        job_id?: string
        job_title?: string
        job_location?: string
        user_id?: string
        assigned_to?: string | null
        source?: 'scaffald' | 'referral' | 'external_board' | 'social_media' | 'company_website' | 'other'
        union_status?: {
          is_union_member: boolean
          union_name?: string
          local_number?: string
          membership_id?: string
          journeyman_status?: 'apprentice' | 'journeyman' | 'master'
          prevailing_wage_eligible?: boolean
        }
      }
      const jobInfo = a.job ?? null
      const assignments = jobInfo?.teamAssignments ?? []
      const primaryAssignment =
        assignments.find((assignment) => assignment.isPrimary) ?? assignments[0] ?? null
      const primaryTeamId = jobInfo?.primary_team_id ?? primaryAssignment?.teamId ?? null
      const primaryTeamName = primaryAssignment?.team?.name ?? null

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

      const formatAnswer = (v: string | boolean | string[]): string =>
        typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : String(v)

      return {
        id: a.id,
        status: statusMap[a.status] ?? 'new',
        source: a.source,
        appliedAt: a.applied_at ?? a.updated_at,
        updatedAt: a.updated_at,
        score: a.application_score ?? 0,
        autoRejected: a.auto_rejected ?? false,
        screeningAnswers: {
          currentLocation: a.current_location ?? '',
          willingToRelocate: a.willing_to_relocate ?? false,
          yearsExperience: a.years_experience ?? 0,
          isAuthorizedToWork: a.is_authorized_to_work ?? false,
          earliestStartDate: a.earliest_start_date ?? '',
        },
        customAnswers: (a.custom_question_answers ?? []).map((qa) => ({
          question: qa.question ?? '',
          answer: formatAnswer(qa.answer),
        })),
        attachments: a.attachments ?? {},
        notes: [],
        messages: [],
        stageHistory: [],
        candidate: {
          id: a.candidate_id ?? a.user_id,
          name: a.candidate_name ?? 'Unknown',
          email: '',
          phone: '',
          title: a.profile_about ? a.profile_about.substring(0, 50) : 'Applicant',
          photo: a.profile_avatar_path ?? '',
          location: a.current_location ?? '',
          yearsExperience: a.years_experience ?? 0,
          skills: [],
          certifications: [],
          experience: [],
        },
        job: {
          id: a.job_id ?? '',
          title: a.job_title ?? 'Position',
          company: '',
          location: a.job_location ?? '',
          payRange: formatPayRange(
            jobInfo?.pay_range_min_cents,
            jobInfo?.pay_range_max_cents,
            jobInfo?.pay_range_type
          ),
          organizationId: jobInfo?.organization_id ?? null,
          payRangeMinCents: jobInfo?.pay_range_min_cents ?? null,
          payRangeMaxCents: jobInfo?.pay_range_max_cents ?? null,
          payRangeType: jobInfo?.pay_range_type ?? null,
          employmentType: jobInfo?.employment_type ?? null,
          targetStartDate: null,
        },
        organizationId: jobInfo?.organization_id ?? null,
        workerUserId: a.user_id ?? null,
        team: {
          id: primaryTeamId ?? null,
          name: primaryTeamName ?? null,
          assignedUserId: a.assigned_to ?? null,
        },
        unionStatus: a.union_status
          ? {
              isUnionMember: a.union_status.is_union_member,
              unionName: a.union_status.union_name,
              localNumber: a.union_status.local_number,
              membershipId: a.union_status.membership_id,
              journeymanStatus: a.union_status.journeyman_status,
              prevailingWageEligible: a.union_status.prevailing_wage_eligible,
            }
          : undefined,
      }
    })
  }, [applications])

  // Filter applications by score (client-side for now)
  const filteredApplications = useMemo(() => {
    return transformedApplications.filter((app: MockApplication) => {
      if (app.score < filters.minScore) return false
      return true
    })
  }, [transformedApplications, filters.minScore])

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
        <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Error Loading Applications</Text>
        <Stack align="center">
          <Text style={{ color: colors.text[theme].secondary, marginTop: 8 }}>
            {errorMessage}
          </Text>
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
            onPress={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'outline' : undefined}
          >
            List
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
      {viewMode === 'kanban' ? (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      ) : viewMode === 'metrics' ? (
        <ATSMetricsDashboard applications={filteredApplications} isLoading={isLoading} />
      ) : (
        <Stack padding="md">
          <Text>List view coming soon...</Text>
        </Stack>
      )}
    </Stack>
  )
}
