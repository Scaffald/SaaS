import {
  Button,
  ListToolbar,
  Row,
  ScreenHeader,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { useMemo, useState } from 'react'
import type { ApplicationStatus } from './types'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import { useApplications } from './hooks/useApplications'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { STATUS_MAP } from './hooks/useApplicationStatusChange'
import { toATSApplication } from './transform'
import { colors } from '@scaffald/ui/tokens'

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
  const [tipCollapsed, setTipCollapsed] = useState(false)
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

  // The job filter's options. `jobs={[]}` was hardcoded, so "Filter by Job" was
  // a permanently empty dropdown. Only open jobs — filtering a pipeline by a
  // closed req is not a case worth the extra rows.
  const jobsQuery = useOfficeListJobs({ status: 'open', limit: 100 })
  const jobOptions = useMemo(
    () =>
      (jobsQuery.data?.jobs ?? []).map((job) => ({
        id: job.id,
        title: job.title,
        company: job.organization?.name ?? '',
      })),
    [jobsQuery.data]
  )

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
  // One shared transform with the detail route, so a field cannot render on
  // a card and be blank on the detail page (#537).
  const transformedApplications = useMemo(() => applications.map(toATSApplication), [applications])

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
      {/* Header — the shared ScreenHeader, so this screen reads the same as
          every other one. The count moved out of the subtitle and into the
          toolbar's result slot, which owns the "{n} {noun}" template. */}
      <ScreenHeader
        kicker="Employer view — applicant workflow"
        title="Applications"
        tip="Move candidates between stages with the arrows — the worker sees each move as honest progress, not silence."
        collapsed={tipCollapsed}
        onToggleCollapsed={() => setTipCollapsed((v) => !v)}
        style={{ marginBottom: 16 }}
        actions={
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
        }
      >
        <ListToolbar
          resultCount={filteredApplications.length}
          resultNoun="application"
        />
      </ScreenHeader>

      {/* Filters - Note: needs jobs list from API */}
      <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={jobOptions} />

      {/* Content */}
      {viewMode === 'metrics' ? (
        <ATSMetricsDashboard applications={filteredApplications} isLoading={isLoading} />
      ) : (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      )}
    </Stack>
  )
}
