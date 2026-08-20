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
import { Lane, LaneGroup, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus, ATSApplication } from '../types'
import {
  daysInStage,
  formatStageAge,
  isStageOverdue,
  stageOverdueReason,
} from '../stage-timing'

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
                  columns={[
                    <Text key="score" style={muted}>
                      score{' '}
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.text[theme].primary,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {app.score}
                      </Text>
                    </Text>,
                    <Text key="source" style={muted}>
                      {app.source ? (SOURCE_LABELS[app.source] ?? app.source) : '—'}
                    </Text>,
                    <Text key="union" style={muted}>
                      {union?.isUnionMember
                        ? [union.unionName, union.localNumber, union.journeymanStatus]
                            .filter(Boolean)
                            .join(' · ')
                        : '—'}
                    </Text>,
                    <Text key="assignee" style={muted}>
                      {assignee ? 'Assigned' : 'Unassigned'}
                    </Text>,
                    // Withdrawn shares the Closed lane with rejected, so the
                    // row has to say which it is. The brief calls out the
                    // conflation as the thing the data model works to prevent.
                    <Text
                      key="outcome"
                      style={{
                        fontSize: 14,
                        color:
                          app.status === 'withdrawn'
                            ? colors.text[theme].tertiary
                            : colors.text[theme].secondary,
                      }}
                    >
                      {app.status === 'withdrawn'
                        ? 'Withdrawn by candidate'
                        : app.status === 'rejected'
                          ? 'Not moved forward'
                          : ''}
                    </Text>,
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
