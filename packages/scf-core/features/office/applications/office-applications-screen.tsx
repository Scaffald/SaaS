import {
  Button,
  ListToolbar,
  ScreenHeader,
  SegmentedControl,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { useMemo, useState } from 'react'
import {
  activeFilterCount,
  clearFilter,
  EMPTY_FILTERS,
  filterChips,
  type ApplicationFilterState,
} from './filters'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ApplicationsLanes } from './components/ApplicationsLanes'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import { useApplications } from './hooks/useApplications'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { STATUS_MAP } from './hooks/useApplicationStatusChange'
import { toATSApplication } from './transform'
import { colors } from '@scaffald/ui/tokens'

/** `lanes` is the default — see ApplicationsLanes for why it beats the board. */
export type OfficeApplicationsView = 'lanes' | 'kanban' | 'metrics'

/** Order matters: it is the segmented control's left-to-right order. */
const VIEW_SEGMENTS: Array<{ view: OfficeApplicationsView; label: string }> = [
  { view: 'lanes', label: 'Lanes' },
  { view: 'kanban', label: 'Board' },
  { view: 'metrics', label: 'Metrics' },
]

export interface OfficeApplicationsScreenProps {
  /** Which view to open on. `/office/ats/metrics` passes 'metrics' — it used
   *  to render this screen on the kanban and rely on the user finding the tab. */
  initialView?: OfficeApplicationsView
}

export const OfficeApplicationsScreen = ({
  initialView = 'lanes',
}: OfficeApplicationsScreenProps = {}) => {
  const { theme } = useThemeContext()
  const [viewMode, setViewMode] = useState<OfficeApplicationsView>(initialView)
  const [tipCollapsed, setTipCollapsed] = useState(false)
  const [filters, setFilters] = useState<ApplicationFilterState>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filters go to the server. `filters.status` is a kanban stage name
  // (`new`, `screen`, …) and the API takes its own vocabulary (`pending`,
  // `reviewing`, …), so it has to be mapped — the previous code *cast* it,
  // which satisfied the compiler while sending a value the API enum rejects.
  const { applications, isLoading, isError, error, refetch } = useApplications({
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

  // Loading and error are NOT early returns any more (§12 #10, #11). They used
  // to replace the whole screen — header, view switch, filters and all — with
  // one centred spinner, so the page appeared to vanish while it refreshed and
  // an employer lost the controls they were mid-way through using. Both now
  // render inside the content region, below a header that stays put.
  const errorMessage =
    error != null && typeof (error as { message?: string }).message === 'string'
      ? (error as Error).message
      : 'Failed to load applications. Please try again.'

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
        // A segmented control, not three Buttons. The old switch gave the
        // ACTIVE view `variant="outline"` and left the others on the default
        // filled variant — so the two views you were not looking at rendered
        // as the primary action and the one you were on looked disabled.
        actions={
          <SegmentedControl
            segments={VIEW_SEGMENTS.map((s) => s.label)}
            selectedIndex={VIEW_SEGMENTS.findIndex((s) => s.view === viewMode)}
            onSelectionChange={(i) => setViewMode(VIEW_SEGMENTS[i].view)}
            testID="applications-view-switch"
            // Explicit width because SegmentedControl's segments are `flex: 1`
            // inside a container with no intrinsic width — left to the row it
            // collapsed to 160px and clipped "Metrics" to "Metr…".
            style={{ width: 260 }}
          />
        }
      >
        <ListToolbar
          // Undefined, not 0, while the query is in flight or failed: the
          // header stays mounted now, so a literal "0 applications" would be
          // asserting an empty pipeline before we know anything.
          resultCount={isLoading || isError ? undefined : filteredApplications.length}
          resultNoun="application"
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={activeFilterCount(filters)}
          filterContent={
            <ApplicationsFilters
              filters={filters}
              onFiltersChange={setFilters}
              jobs={jobOptions}
            />
          }
          chips={filterChips(filters, jobOptions).map((chip) => ({
            id: chip.id,
            label: chip.label,
            value: chip.value,
            active: true,
            onPress: () => setFiltersOpen(true),
            onClear: () => setFilters((f) => clearFilter(f, chip.id)),
          }))}
          onClearAll={
            activeFilterCount(filters) > 0 ? () => setFilters(EMPTY_FILTERS) : undefined
          }
        />
      </ScreenHeader>

      {/* Content */}
      {isLoading ? (
        <Stack flex={1} align="center" justify="center" padding="lg" gap={16}>
          <Spinner variant="ios" size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading applications...</Text>
        </Stack>
      ) : isError ? (
        <Stack flex={1} align="center" justify="center" padding="lg" gap={12}>
          <Text
            style={{
              color: theme === 'light' ? colors.error[700] : colors.error[300],
              fontWeight: '600',
            }}
          >
            Could not load applications
          </Text>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            {errorMessage}
          </Text>
          {/* The error state had no way out at all — the only recovery was a
              full page reload, which also lost the filters. */}
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            Try again
          </Button>
        </Stack>
      ) : viewMode === 'metrics' ? (
        <ATSMetricsDashboard applications={filteredApplications} isLoading={isLoading} />
      ) : viewMode === 'lanes' ? (
        <ApplicationsLanes applications={filteredApplications} />
      ) : (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      )}
    </Stack>
  )
}
