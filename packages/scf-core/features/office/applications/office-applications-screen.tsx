import {
  Button,
  ListToolbar,
  Row,
  ScreenHeader,
  SegmentedControl,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { useRouter } from 'expo-router'
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
import { ApplicationStatusChangeModal } from './components/ApplicationStatusChangeModal'
import { formatDays, formatPct } from './transparency-stats'
import { useTransparencyStats } from './hooks/useTransparencyStats'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import { useApplications } from './hooks/useApplications'
import { useEmployerJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { STATUS_MAP, useApplicationStatusChange } from './hooks/useApplicationStatusChange'
import { toATSApplication } from './transform'
import { matchesPipelineSearch } from './row-labels'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUser } from '@scf/core/utils/useUser'
import { borderRadius, colors, fontSize } from '@scaffald/ui/tokens'
import { useScreenRhythm } from '@scf/core/constants/layout'

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
  /**
   * Open filtered to one job. My Listings' "View applicants" links here with
   * the job in the query string (#1199), and the filter stays removable as a
   * chip like any other.
   */
  initialJobId?: string | null
}

export const OfficeApplicationsScreen = ({
  initialView = 'lanes',
  initialJobId = null,
}: OfficeApplicationsScreenProps = {}) => {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { user } = useUser()
  const { gutter, verticalPadding } = useScreenRhythm()
  // Posting a job is the Office CMS form, which only office staff can open;
  // there is no employer-side job form yet (#1312). Offering the button to
  // anyone else sent them to the dashboard, so it is not offered.
  const { hasOfficeRole } = useUserRoles()
  const [viewMode, setViewMode] = useState<OfficeApplicationsView>(initialView)
  const [tipCollapsed, setTipCollapsed] = useState(false)
  const [filters, setFilters] = useState<ApplicationFilterState>(() => ({
    ...EMPTY_FILTERS,
    jobId: initialJobId || null,
  }))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')

  // The Lanes view's Move menu goes through the same hook as the Board's, so
  // a reject confirms in the same modal and a hire opens the same screen
  // (#1196). One input, not a second code path.
  const { changeStatus, isChanging, pendingChange, confirmChange, cancelChange } =
    useApplicationStatusChange()

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
  //
  // The employer's own postings (#1312): this read the office-only list, which
  // answered 403 to an employer without the office role, so their filter was
  // empty.
  const jobsQuery = useEmployerJobs({ status: 'open', limit: 100 })
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
  //
  // Search is the exception, and is client-side on purpose: the API has no
  // text search, so it narrows the loaded page by name and job title (#1198).
  const filteredApplications = useMemo(
    () => transformedApplications.filter((app) => matchesPipelineSearch(app, search)),
    [transformedApplications, search]
  )

  const pendingApplication = pendingChange
    ? transformedApplications.find((app) => app.id === pendingChange.applicationId)
    : null

  const viewSwitch = (
    <SegmentedControl
      segments={VIEW_SEGMENTS.map((s) => s.label)}
      selectedIndex={VIEW_SEGMENTS.findIndex((s) => s.view === viewMode)}
      onSelectionChange={(i) => setViewMode(VIEW_SEGMENTS[i].view)}
      testID="applications-view-switch"
      // Explicit width because SegmentedControl's segments are `flex: 1`
      // inside a container with no intrinsic width — left to the row it
      // collapsed to 160px and clipped "Metrics" to "Metr…".
      style={{ width: 240 }}
    />
  )

  // The employer's own record — response rate, first response, ghost rate.
  // Showing an employer their own ghost rate is the mechanism that changes
  // behaviour; a stats page nobody opens is not. Answers open question #5 of
  // the ATS brief (#539) with: loud.
  //
  // Read over the whole 12-month pipeline, not `filteredApplications`: that is
  // one page under the board's filters, so narrowing to a job used to move a
  // figure presented as the employer's record (#1177).
  const transparency = useTransparencyStats()

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
    <Stack
      flex={1}
      paddingHorizontal={gutter}
      paddingVertical={verticalPadding}
      style={{ backgroundColor: colors.bg[theme].default }}
    >
      {/* Header — the shared ScreenHeader, so this screen reads the same as
          every other one. The count moved out of the subtitle and into the
          toolbar's result slot, which owns the "{n} {noun}" template. */}
      <ScreenHeader
        kicker="Employer view — applicant workflow"
        title="Applications"
        tip="Open a row to see the candidate, or move them from its Move menu — the worker sees each move as honest progress, not silence."
        collapsed={tipCollapsed}
        onToggleCollapsed={() => setTipCollapsed((v) => !v)}
        style={{ marginBottom: 16 }}
      >
        {/* The prototype's transparency band, as one compact row (#1177).
            Hidden while loading or errored rather than rendering dashes: an
            employer glancing at "—" would read it as "we have no rate",
            which is a different claim from "not loaded yet".

            Tinted, and on its own ground (#838), so it does not read as one
            more row of the page's own statistics.

            It does not say candidates can see these: no worker-facing
            surface shows them until the server aggregate in #632 exists, and
            the band used to claim they appeared on every posting. There is
            no "Your public stats" link for the same reason — no such screen
            exists yet. */}
        {transparency.stats && transparency.count > 0 ? (
          <Row
            align="center"
            wrap
            gap={16}
            rowGap={4}
            testID="transparency-band"
            style={{
              marginBottom: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: borderRadius.l,
              backgroundColor: colors.bg[theme].attention,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.xxs,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                fontWeight: '500',
                color: colors.text[theme].attention,
              }}
            >
              Your response record
            </Text>
            <BandFigure
              label="Response rate"
              value={formatPct(transparency.stats.responseRatePct)}
              theme={theme}
            />
            <BandFigure
              label="Median first response"
              value={formatDays(transparency.stats.medianFirstResponseDays) ?? '—'}
              theme={theme}
            />
            <BandFigure
              label="Ghost rate"
              value={formatPct(transparency.stats.ghostRatePct)}
              // Up is bad here, so any ghosting reads in the attention hue.
              emphasis={(transparency.stats.ghostRatePct ?? 0) > 0}
              theme={theme}
            />
            <Text style={{ fontSize: fontSize.xs, color: colors.text[theme].tertiary }}>
              {transparency.truncated
                ? `Latest ${transparency.count} applications, last 12 months`
                : `${transparency.count} application${
                    transparency.count === 1 ? '' : 's'
                  }, last 12 months`}
            </Text>
          </Row>
        ) : null}

        <ListToolbar
          // Undefined, not 0, while the query is in flight or failed: the
          // header stays mounted now, so a literal "0 applications" would be
          // asserting an empty pipeline before we know anything.
          resultCount={isLoading || isError ? undefined : filteredApplications.length}
          resultNoun="application"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search candidates or jobs…"
          // The view switch and Post a job sit in the toolbar beside search
          // and Filters & sort, as in the prototype (#1198), rather than in
          // the header. A segmented control, not three Buttons: the old
          // switch rendered the two views you were not on as primary actions.
          actions={
            <Row gap={8} align="center" wrap>
              {viewSwitch}
              {hasOfficeRole ? (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
                >
                  Post a job
                </Button>
              ) : null}
            </Row>
          }
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={activeFilterCount(filters)}
          filterContent={
            <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={jobOptions} />
          }
          chips={filterChips(filters, jobOptions).map((chip) => ({
            id: chip.id,
            label: chip.label,
            value: chip.value,
            active: true,
            onPress: () => setFiltersOpen(true),
            onClear: () => setFilters((f) => clearFilter(f, chip.id)),
          }))}
          onClearAll={activeFilterCount(filters) > 0 ? () => setFilters(EMPTY_FILTERS) : undefined}
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
        <ApplicationsLanes
          applications={filteredApplications}
          currentUserId={user?.id ?? null}
          // A row opens the candidate's own page (#1196); before this Lanes
          // rows were plain Views with no way into a candidate at all.
          onSelect={(app) =>
            router.push(buildPath(ROUTES.HIRING.APPLICATIONS.DETAIL, { applicationId: app.id }))
          }
          onMove={(app, toStatus) =>
            changeStatus({
              applicationId: app.id,
              fromStatus: app.status,
              toStatus,
              candidateName: app.candidate?.name,
            })
          }
        />
      ) : (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      )}

      {pendingChange ? (
        <ApplicationStatusChangeModal
          open
          onClose={cancelChange}
          onConfirm={confirmChange}
          candidateName={pendingApplication?.candidate.name ?? ''}
          fromStatus={pendingChange.fromStatus}
          toStatus={pendingChange.toStatus}
          isLoading={isChanging}
        />
      ) : null}
    </Stack>
  )
}

/** One inline figure in the transparency band: label, then the value. */
function BandFigure({
  label,
  value,
  emphasis = false,
  theme,
}: {
  label: string
  value: string
  emphasis?: boolean
  theme: 'light' | 'dark'
}) {
  return (
    <Row align="baseline" gap={6}>
      <Text style={{ fontSize: fontSize.xs, color: colors.text[theme].tertiary }}>{label}</Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
          color: emphasis ? colors.text[theme].attention : colors.text[theme].primary,
        }}
      >
        {value}
      </Text>
    </Row>
  )
}
