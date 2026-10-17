/**
 * What a pipeline row says about score and assignee.
 *
 * Pulled out of ApplicationsLanes and CandidateDetailContent so the rules are
 * stated once and tested without mounting either (#1198, #1200). Both bugs
 * were the row asserting something the data does not: "Score 0" for a
 * candidate nobody has scored, and "Assigned" for a row whose assignee the
 * screen never named.
 */

/**
 * The score as the row shows it, or null when there is none.
 *
 * `score_total` is nullable and nothing populates it for most applications
 * yet (#534). The transform used to fall back to 0, so every seeded candidate
 * read "Score 0" — a verdict, where the truth is "not scored".
 */
export function formatScore(score: number | null | undefined): string | null {
  if (score == null || Number.isNaN(score)) return null
  return String(Math.round(score))
}

export interface AssigneeRef {
  id: string
  name?: string | null
}

/**
 * Who a row is assigned to, by name.
 *
 * "You" when it is the viewer — the prototype's form, and the only one that
 * needs no lookup. A row assigned to someone whose name did not come back
 * still says it is assigned rather than claiming it is free.
 */
export function assigneeLabel(
  assignee: AssigneeRef | null | undefined,
  currentUserId?: string | null
): string {
  if (!assignee?.id) return 'Unassigned'
  if (currentUserId && assignee.id === currentUserId) return 'You'
  const name = assignee.name?.trim()
  return name || 'Assigned'
}

/**
 * Case-insensitive match on the candidate's name and the job title — the two
 * things an employer types when looking for a row.
 */
export function matchesPipelineSearch(
  application: { candidate: { name: string }; job: { title: string } },
  term: string
): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return `${application.candidate.name} ${application.job.title}`.toLowerCase().includes(needle)
}
