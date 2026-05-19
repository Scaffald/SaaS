/**
 * Reload the current page / view.
 *
 * Web: full `window.location.reload()`.
 * Native: no-op. Callers that want a "refresh" on native should invalidate
 *   their react-query cache (`queryClient.invalidateQueries`) — there is no
 *   native equivalent of reloading a browser tab.
 *
 * Use sparingly: most "retry on error" buttons should invalidate queries
 * instead of forcing a hard reload — that path works identically on both
 * platforms.
 */

export type ReloadPage = () => void

export const reloadPage: ReloadPage = () => {
  // no-op default
}
