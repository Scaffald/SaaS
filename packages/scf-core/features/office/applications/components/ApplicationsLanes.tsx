/**
 * Lanes — the pipeline as stage-grouped rows.
 *
 * The default view. Seven columns already overflow a laptop and the recruiter
 * and NationSearch flows have eleven and twelve, so the board's answer to
 * "more stages" is sideways scrolling that hides work. Stacking stages as
 * full-width groups puts every stage on screen and gives each row room for the
 * columns a card cannot carry.
 *
 * Closes several items from §12 of the ATS design brief:
 *   #7  days in stage, not days since applied, and it leads the row
 *   #8  score, source, union status and assignee are all on the row
 *   #9  one empty state per stage that says what to do, not "No applications"
 *       repeated seven times
 *   #17 Withdrawn reads as withdrawn, not as a grey pill inside a red column
 */

import { useMemo } from 'react'
import { View } from 'react-native'
import { Lane, LaneGroup, Row, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus, ATSApplication } from '../types'
import { daysInStage, formatStageAge, isStageOverdue, stageOverdueReason } from '../stage-timing'

/**
 * Stage order, label, and what the stage means. The hint is the part a bare
 * stage name cannot carry — "Screening" does not tell an employer that the
 * first-response clock is already running on everything above it.
 */
const STAGES: Array<{
  status: ApplicationStatus
  label: string
  hint: string
  /** What the employer should do when the stage is empty. */
  empty: string
}> = [
  {
    status: 'new',
    label: 'New',
    hint: 'untouched — the first-response clock is running',
    empty: 'Nothing waiting on a first response. This is the stage candidates feel most.',
  },
  {
    status: 'screen',
    label: 'Screening',
    hint: 'being reviewed',
    empty: 'Nothing in review. Move a candidate from New to start screening.',
  },
  {
    status: 'inquired',
    label: 'Inquired',
    hint: 'a question is out with the candidate',
    empty: 'No open inquiries. Send one from a candidate’s profile to ask before deciding.',
  },
  {
    status: 'interview',
    label: 'Interview',
    hint: 'scheduled or in progress',
    empty: 'No interviews booked.',
  },
  {
    status: 'offer',
    label: 'Offer',
    hint: 'terms are with the candidate',
    empty: 'No open offers.',
  },
  { status: 'hired', label: 'Hired', hint: 'placed', empty: 'No placements yet.' },
  {
    status: 'rejected',
    label: 'Closed',
    hint: 'turned down or withdrawn',
    empty: 'Nothing closed out.',
  },
]

/** `withdrawn` is grouped with `rejected` but keeps its own badge on the row. */
const laneFor = (status: ApplicationStatus): ApplicationStatus =>
  status === 'withdrawn' ? 'rejected' : status

const SOURCE_LABELS: Record<string, string> = {
  scaffald: 'Scaffald',
  referral: 'Referral',
  external_board: 'Job board',
  social_media: 'Social',
  company_website: 'Website',
  other: 'Other',
}

export interface ApplicationsLanesProps {
  applications: ATSApplication[]
  onSelect?: (application: ATSApplication) => void
  selectedId?: string | null
  /** Injected in tests so the age columns are not clock-dependent. */
  now?: number
}

export const ApplicationsLanes = ({
  applications,
  onSelect,
  selectedId,
  now,
}: ApplicationsLanesProps) => {
  const { theme } = useThemeContext()
  // Matches Lane's own stackBelow default, so the cells agree with the row
  // they sit in about what counts as narrow.
  const { width } = useResponsive()
  const stacked = width > 0 && width < 768
  const nowMs = now ?? Date.now()

  const byStage = useMemo(() => {
    const map = new Map<ApplicationStatus, ATSApplication[]>()
    for (const stage of STAGES) map.set(stage.status, [])
    for (const app of applications) {
      const lane = laneFor(app.status)
      map.get(lane)?.push(app)
    }
    // Stalest first — the row that most needs acting on is the one at the top.
    for (const [, rows] of map) {
      rows.sort((a, b) => (daysInStage(b, nowMs) ?? 0) - (daysInStage(a, nowMs) ?? 0))
    }
    return map
  }, [applications, nowMs])

  const muted = { fontSize: 14, color: colors.text[theme].tertiary }

  /**
   * One labelled cell: "Score 88".
   *
   * A null value means the row has nothing to say for this column. On a wide
   * row it still renders an em dash, because the columns line up across rows
   * and a missing cell would shift everything after it. Stacked, there is no
   * grid to keep, so it renders nothing rather than spending a line saying
   * nothing — which is what "Union —" and a blank "Outcome" were doing on a
   * phone.
   */
  const cell = (label: string, value: string | null, opts?: { emphasis?: boolean }) => {
    if (value == null && stacked) return null
    return (
      <Row gap={6} align="baseline">
        <Text style={{ fontSize: 13, color: colors.text[theme].tertiary }}>{label}</Text>
        <Text
          style={
            opts?.emphasis
              ? { fontSize: 14, color: colors.text[theme].primary, fontVariant: ['tabular-nums'] }
              : muted
          }
        >
          {value ?? '—'}
        </Text>
      </Row>
    )
  }

  return (
    <View style={{ width: '100%' }}>
      {STAGES.map((stage) => {
        const rows = byStage.get(stage.status) ?? []
        const anyOverdue = rows.some((app) => isStageOverdue(app, nowMs))

        return (
          <LaneGroup
            key={stage.status}
            title={stage.label}
            count={rows.length}
            hint={stage.hint}
            tone={anyOverdue ? 'attention' : rows.length > 0 ? 'active' : 'neutral'}
            emptyState={<Text style={muted}>{stage.empty}</Text>}
          >
            {rows.map((app) => {
              const days = daysInStage(app, nowMs)
              const overdue = isStageOverdue(app, nowMs)
              const reason = stageOverdueReason(app, nowMs)
              const union = app.unionStatus
              const assignee = app.team?.assignedUserId

              return (
                <Lane
                  key={app.id}
                  testID={`lane-row-${app.id}`}
                  age={formatStageAge(days) ?? undefined}
                  overdue={overdue}
                  title={app.candidate.name}
                  subtitle={app.job.title}
                  selected={selectedId === app.id}
                  onPress={onSelect ? () => onSelect(app) : undefined}
                  note={reason ?? undefined}
                  // Cells carry their own label.
                  //
                  // A Lane row has no column headings, so "88 | Scaffald | — |
                  // Unassigned" is a row of values with nothing saying what any
                  // of them are — and stacking it on a phone made that worse,
                  // because position stopped implying anything at all.
                  //
                  // The label is composed HERE rather than described to Lane as
                  // `{label, value}`. Lane used to discriminate that union at
                  // render time, and the guard evaluated differently under the
                  // app and under vitest — the raw descriptor reached React as
                  // a child and every row-rendering test in this file crashed.
                  // Composing the node leaves nothing to guess.
                  columns={[
                    cell('Score', String(app.score), { emphasis: true }),
                    cell('Source', app.source ? (SOURCE_LABELS[app.source] ?? app.source) : null),
                    cell(
                      'Union',
                      union?.isUnionMember
                        ? [union.unionName, union.localNumber, union.journeymanStatus]
                            .filter(Boolean)
                            .join(' · ')
                        : null
                    ),
                    cell('Assignee', assignee ? 'Assigned' : 'Unassigned'),
                    // Withdrawn shares the Closed lane with rejected, so the
                    // row has to say which it is. The brief calls out the
                    // conflation as the thing the data model works to prevent.
                    cell(
                      'Outcome',
                      app.status === 'withdrawn'
                        ? 'Withdrawn by candidate'
                        : app.status === 'rejected'
                          ? 'Not moved forward'
                          : null
                    ),
                  ]}
                />
              )
            })}
          </LaneGroup>
        )
      })}
    </View>
  )
}
