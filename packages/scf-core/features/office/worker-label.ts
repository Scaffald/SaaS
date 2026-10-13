/** The fields a worker label can draw on. */
export type WorkerIdentity = {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  username?: string | null
  email?: string | null
}

/**
 * Who this row is, in order of what a person would recognise: their name, the
 * name they chose to show, their handle, their email. The table used to show
 * first and last name only, so a worker without a profile name read "-", "-"
 * and a truncated UUID (#1116).
 */
export function workerLabel(user: WorkerIdentity): string {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  return fullName || user.display_name || user.username || user.email || 'Unnamed worker'
}
