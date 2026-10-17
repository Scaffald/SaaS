/**
 * Rows for the CMS Teams table.
 *
 * `GET /v1/teams` returns the raw `core.teams` rows — snake_case — while the
 * SDK's `Team` type promises camelCase. The table read `team.updatedAt` and
 * `team.defaultRole`, neither of which the wire carries, so Updated was "—"
 * and Default role was "Member" on every row (#1206). Read both spellings.
 *
 * Pure, so vitest can reach it.
 */

export type TeamVisibility = 'public' | 'organization' | 'private'

const VISIBILITIES: readonly TeamVisibility[] = ['public', 'organization', 'private']

export interface TeamRow {
  id: string
  name: string
  organizationId: string | null
  /** The owning organization's name, or null when the caller cannot see it. */
  organizationName: string | null
  visibility: TeamVisibility
  defaultRole: string | null
  /** updated_at, falling back to created_at — a never-edited team was "—". */
  updatedAt: string | null
}

type RawTeam = Record<string, unknown>

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function roleLabel(key: string): string {
  const words = key.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function toTeamRow(raw: RawTeam, organizationNames: Map<string, string>): TeamRow {
  const organizationId = str(raw.organizationId) ?? str(raw.organization_id)
  const visibilityRaw = str(raw.visibility)
  const visibility = VISIBILITIES.includes(visibilityRaw as TeamVisibility)
    ? (visibilityRaw as TeamVisibility)
    : 'organization'
  const defaultRole = raw.defaultRole as { name?: unknown; key?: unknown } | null | undefined
  const roleKey = str(defaultRole?.key) ?? str(raw.defaultRoleKey) ?? str(raw.default_role_key)

  return {
    id: String(raw.id),
    name: str(raw.name) ?? 'Untitled team',
    organizationId,
    organizationName: organizationId ? (organizationNames.get(organizationId) ?? null) : null,
    visibility,
    defaultRole: str(defaultRole?.name) ?? (roleKey ? roleLabel(roleKey) : null),
    updatedAt:
      str(raw.updatedAt) ?? str(raw.updated_at) ?? str(raw.createdAt) ?? str(raw.created_at),
  }
}

/** Search across the name, the organization and the default role. */
export function filterTeamRows(
  rows: TeamRow[],
  query: string,
  organizationId: string | null
): TeamRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (organizationId && row.organizationId !== organizationId) return false
    if (!q) return true
    return [row.name, row.organizationName, row.defaultRole].some((value) =>
      (value ?? '').toLowerCase().includes(q)
    )
  })
}
