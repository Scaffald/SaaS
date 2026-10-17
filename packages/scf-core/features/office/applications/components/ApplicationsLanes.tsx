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
 *
 * A row opens the candidate and ends in the Board's Move menu (#1196), and its
 * cells sit at fixed widths so they line up down a lane (#1198).
 */

import { useMemo } from 'react'
import { Pressable, type TextStyle, View } from 'react-native'
import { Lane, LaneGroup, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import type { ApplicationStatus, ATSApplication } from '../types'
import { daysInStage, formatStageAge, isStageOverdue, stageOverdueReason } from '../stage-timing'
import { allowedTargetsFor } from '../hooks/useApplicationStatusChange'
import { assigneeLabel, formatScore } from '../row-labels'
import { MoveMenu } from './MoveMenu'

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

/** The Move menu's names for each stage — the lane titles, so the two agree. */
const STAGE_LABELS = Object.fromEntries([
  ...STAGES.map((stage) => [stage.status, stage.label]),
  ['withdrawn', 'Withdrawn'],
]) as Record<ApplicationStatus, string>

/**
 * Fixed cell widths on a wide row (#1198).
 *
 * Lane sizes its identity block to the title, so cells used to start wherever
 * the job title ended — 765, 807 and 847px on three rows of one lane. Fixing
 * the name block and every cell puts each column at one x down the lane.
 *
 * The note and action slots are fixed too, and filled on every row (empty
 * where a row has no note or no move). Lane lets its blocks shrink when a row
 * is wider than the screen, and a row with a note and a Move menu shrank its
 * name block more than a row without — so cells started 655–688px apart
 * across lanes. Rows with identical slot widths shrink identically.
 */
const WIDTH = {
  identity: 220,
  score: 80,
  source: 80,
  union: 128,
  assignee: 120,
  note: 180,
  actions: 72,
} as const

export interface ApplicationsLanesProps {
  applications: ATSApplication[]
  onSelect?: (application: ATSApplication) => void
  /**
   * Move a candidate from the row (#1196). The caller routes it through
   * useApplicationStatusChange, so a reject confirms exactly as on the Board.
   * Without it the rows carry no Move menu.
   */
  onMove?: (application: ATSApplication, toStatus: ApplicationStatus) => void
  /** The viewer, so a row assigned to them reads "You". */
  currentUserId?: string | null
  selectedId?: string | null
  /** Injected in tests so the age columns are not clock-dependent. */
  now?: number
}

export const ApplicationsLanes = ({
  applications,
  onSelect,
  onMove,
  currentUserId,
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

  const muted: TextStyle = { fontSize: fontSize.md, color: colors.text[theme].tertiary }
  const secondary: TextStyle = { fontSize: fontSize.md, color: colors.text[theme].secondary }

  /**
   * One cell at a fixed width, value only, as in the prototype.
   *
   * Every cell used to carry its label — "Score 0 Source Scaffald Union —
   * Assignee Unassigned Outcome —" — which doubled the row's height to say
   * what position says once the columns line up (#1198). Score keeps its word
   * because a bare number beside a day count is ambiguous.
   */
  const cell = (key: string, w: number, content: string, style: TextStyle = secondary) => (
    <View key={key} style={{ width: w }}>
      <Text style={style} numberOfLines={1}>
        {content}
      </Text>
    </View>
  )

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
              const score = formatScore(app.score)
              // An unscored candidate is "Not scored", never "Score 0" (#1198).
              const scoreText = score != null ? `score ${score}` : 'Not scored'
              const sourceText = app.source ? (SOURCE_LABELS[app.source] ?? app.source) : null
              const unionText = union?.isUnionMember
                ? [union.unionName, union.localNumber, union.journeymanStatus]
                    .filter(Boolean)
                    .join(' · ') || 'Union'
                : null
              const assignedId = app.team?.assignedUserId ?? null
              const assigneeText = assigneeLabel(
                assignedId ? { id: assignedId, name: app.team?.assignedUserName } : null,
                currentUserId
              )
              // Withdrawn shares the Closed lane with rejected, so the row has
              // to say which it is — the conflation the data model works to
              // prevent. Open lanes have no outcome, so they say nothing here
              // (#1198); a terminal row is never overdue, so the outcome takes
              // the note's slot rather than a column of its own.
              const outcome =
                app.status === 'withdrawn'
                  ? 'Withdrawn by candidate'
                  : app.status === 'rejected'
                    ? 'Not moved forward'
                    : null
              const noteText = reason ?? outcome
              const targets = onMove ? allowedTargetsFor(app.status) : []

              const scoreStyle: TextStyle =
                score != null
                  ? {
                      fontSize: fontSize.md,
                      color: colors.text[theme].primary,
                      fontVariant: ['tabular-nums'],
                    }
                  : muted

              // Stacked there is no grid to keep, so the cells collapse into
              // one meta line rather than a labelled line each, and the empty
              // ones drop out.
              const columns = stacked
                ? [
                    <Text key="meta" style={secondary}>
                      {[scoreText, sourceText, unionText, assigneeText].filter(Boolean).join(' · ')}
                    </Text>,
                  ]
                : [
                    cell('score', WIDTH.score, scoreText, scoreStyle),
                    cell('source', WIDTH.source, sourceText ?? '—', sourceText ? secondary : muted),
                    cell('union', WIDTH.union, unionText ?? '—', unionText ? secondary : muted),
                    cell('assignee', WIDTH.assignee, assigneeText, assignedId ? secondary : muted),
                  ]

              const note =
                noteText != null || !stacked ? (
                  <View style={stacked ? undefined : { width: WIDTH.note }}>
                    {noteText != null ? (
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: fontSize.md,
                          fontStyle: 'italic',
                          color: overdue
                            ? colors.text[theme].attention
                            : colors.text[theme].tertiary,
                        }}
                      >
                        {noteText}
                      </Text>
                    ) : null}
                  </View>
                ) : undefined

              const move =
                targets.length > 0 && onMove ? (
                  <MoveMenu
                    targets={targets}
                    labels={STAGE_LABELS}
                    candidateName={app.candidate.name}
                    onMove={(target) => onMove(app, target)}
                  />
                ) : null

              const lane = (
                <Lane
                  testID={onSelect ? undefined : `lane-row-${app.id}`}
                  age={formatStageAge(days) ?? undefined}
                  overdue={overdue}
                  // Name and job in one fixed-width block, so the cells after
                  // it start at the same x on every row.
                  title={
                    <View style={stacked ? undefined : { width: WIDTH.identity }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: fontSize.lg,
                          lineHeight: lineHeight.lg,
                          fontWeight: fontWeight.semibold,
                          color: colors.text[theme].primary,
                        }}
                      >
                        {app.candidate.name}
                      </Text>
                      <Text numberOfLines={1} style={secondary}>
                        {app.job.title}
                      </Text>
                    </View>
                  }
                  selected={selectedId === app.id}
                  note={note}
                  columns={columns}
                  actions={
                    stacked ? (
                      (move ?? undefined)
                    ) : (
                      <View style={{ width: WIDTH.actions, alignItems: 'flex-end' }}>{move}</View>
                    )
                  }
                />
              )

              if (!onSelect) return <View key={app.id}>{lane}</View>

              // The row opens the candidate (#1196). The press lives on this
              // wrapper rather than on Lane's own onPress: Lane makes the row
              // a button element, and the Move trigger is a button inside it —
              // invalid HTML, which the server-rendered page's parser splits
              // apart. A link-role wrapper renders as a div, and the Move
              // trigger stops its own click from reaching it.
              return (
                <Pressable
                  key={app.id}
                  testID={`lane-row-${app.id}`}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${app.candidate.name}, ${app.job.title}`}
                  onPress={() => onSelect(app)}
                >
                  {lane}
                </Pressable>
              )
            })}
          </LaneGroup>
        )
      })}
    </View>
  )
}
