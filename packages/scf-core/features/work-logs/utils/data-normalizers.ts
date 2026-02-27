import type {
  ProjectSelectorOrganization,
  ProjectSelectorProject,
} from '../components/ProjectSelector'

export type ProjectOptionsData = {
  organizations: ProjectSelectorOrganization[]
  projects: ProjectSelectorProject[]
}

const toProjectSelectorOrganization = (
  input: Record<string, unknown>
): ProjectSelectorOrganization | null => {
  const id = typeof input.id === 'string' ? input.id : null
  if (!id) {
    return null
  }
  const name =
    typeof input.name === 'string' && input.name.trim().length > 0
      ? input.name
      : 'Unknown Organization'
  return {
    id,
    name,
    isAdmin: Boolean(
      (input as { isAdmin?: unknown }).isAdmin ?? (input as { is_admin?: unknown }).is_admin
    ),
    isOwner: Boolean(
      (input as { isOwner?: unknown }).isOwner ?? (input as { is_owner?: unknown }).is_owner
    ),
  }
}

const toProjectSelectorProject = (
  input: Record<string, unknown>
): ProjectSelectorProject | null => {
  const id = typeof input.id === 'string' ? input.id : null
  const organizationId =
    typeof (input as { organizationId?: unknown }).organizationId === 'string'
      ? (input as { organizationId: string }).organizationId
      : typeof (input as { organization_id?: unknown }).organization_id === 'string'
        ? (input as { organization_id: string }).organization_id
        : null

  if (!id || !organizationId) {
    return null
  }

  const name =
    typeof input.name === 'string' && input.name.trim().length > 0 ? input.name : 'Untitled Project'

  const startsAt =
    typeof (input as { startsAt?: unknown }).startsAt === 'string'
      ? (input as { startsAt: string }).startsAt
      : typeof (input as { starts_at?: unknown }).starts_at === 'string'
        ? (input as { starts_at: string }).starts_at
        : null

  const endsAt =
    typeof (input as { endsAt?: unknown }).endsAt === 'string'
      ? (input as { endsAt: string }).endsAt
      : typeof (input as { ends_at?: unknown }).ends_at === 'string'
        ? (input as { ends_at: string }).ends_at
        : null

  return {
    id,
    name,
    organizationId,
    status: typeof input.status === 'string' ? input.status : null,
    isArchived: Boolean(
      (input as { isArchived?: unknown }).isArchived ??
        (input as { is_archived?: unknown }).is_archived
    ),
    startsAt,
    endsAt,
  }
}

export const normalizeProjectOptions = (input: unknown): ProjectOptionsData => {
  if (!input || typeof input !== 'object') {
    return { organizations: [], projects: [] }
  }

  const organizationsSource = (input as { organizations?: unknown }).organizations
  const projectsSource = (input as { projects?: unknown }).projects

  const organizations = Array.isArray(organizationsSource)
    ? organizationsSource
        .map((organization) =>
          organization && typeof organization === 'object'
            ? toProjectSelectorOrganization(organization as Record<string, unknown>)
            : null
        )
        .filter((organization): organization is ProjectSelectorOrganization =>
          Boolean(organization)
        )
    : []

  const projects = Array.isArray(projectsSource)
    ? projectsSource
        .map((project) =>
          project && typeof project === 'object'
            ? toProjectSelectorProject(project as Record<string, unknown>)
            : null
        )
        .filter((project): project is ProjectSelectorProject => Boolean(project))
    : []

  return { organizations, projects }
}

export type ExplicitSkillRecord = Record<string, unknown>

const extractSkillId = (skill: ExplicitSkillRecord): string | null => {
  if (typeof skill.skill_id === 'string') {
    return skill.skill_id
  }
  if (typeof skill.id === 'string') {
    return skill.id
  }
  return null
}

const extractSkillName = (skill: ExplicitSkillRecord): string | null => {
  const candidates = [
    typeof skill.skill_name === 'string' ? skill.skill_name : null,
    typeof skill.name === 'string' ? skill.name : null,
    typeof skill.display_name === 'string' ? skill.display_name : null,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  return candidates.length > 0 ? candidates[0].trim() : null
}

export const extractExplicitSkills = (input: unknown): ExplicitSkillRecord[] => {
  if (!input || typeof input !== 'object') {
    return []
  }

  const explicitSkills = (input as { explicitSkills?: unknown }).explicitSkills
  if (!Array.isArray(explicitSkills)) {
    return []
  }

  return explicitSkills.filter(
    (skill): skill is ExplicitSkillRecord => Boolean(skill) && typeof skill === 'object'
  )
}

export const mapExplicitSkillsToOptions = (input: unknown): Array<{ id: string; name: string }> => {
  return extractExplicitSkills(input)
    .map((skill) => {
      const id = extractSkillId(skill)
      const name = extractSkillName(skill)
      return id && name ? { id, name } : null
    })
    .filter((value): value is { id: string; name: string } => Boolean(value))
}

export const buildSkillLookup = (input: unknown): Map<string, string> => {
  const lookup = new Map<string, string>()
  for (const skill of extractExplicitSkills(input)) {
    const id = extractSkillId(skill)
    const name = extractSkillName(skill)
    if (id && name) {
      lookup.set(id, name)
    }
  }
  return lookup
}
