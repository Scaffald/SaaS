/**
 * Holds the tip's line while completion is still loading. A space would
 * collapse; a no-break space keeps one line of the tip's own text style, so
 * the header does not grow when the real tip arrives.
 */
export const HOME_TIP_PLACEHOLDER = '\u00A0'

/**
 * The line under the greeting. Says nothing about completion until completion
 * has loaded: with no data `total` was 0, so the tip fell through to "Your
 * profile is complete" for every worker on first paint (#1083).
 *
 * `searchAppearances` is how often the worker turned up in someone else's
 * search (the analytics summary, the same figure as Home's metric row). It was
 * fed the worker's own searches, so "Employers found you 12 times" counted the
 * worker searching (#1249).
 */
export function homeTip({
  searchAppearances,
  completion,
  completionPending,
}: {
  searchAppearances: number
  completion: { totalComplete: number; totalItems: number } | null
  completionPending: boolean
}): string | undefined {
  const found =
    searchAppearances > 0
      ? `Employers found you ${searchAppearances.toLocaleString()} ${searchAppearances === 1 ? 'time' : 'times'} in search in the last 30 days.`
      : null

  if (completionPending) return HOME_TIP_PLACEHOLDER
  // Completion failed to load: claim neither finished nor unfinished.
  if (!completion) return found ?? undefined

  const incomplete = completion.totalItems > 0 && completion.totalComplete < completion.totalItems
  if (found) {
    return incomplete ? `${found} Finishing your profile puts you in front of more of them.` : found
  }
  return incomplete
    ? 'Finish your profile so employers searching for your trade can find you.'
    : 'Your profile is complete. Keep it current and employers searching your trade will find you.'
}
