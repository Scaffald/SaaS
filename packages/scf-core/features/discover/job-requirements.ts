/**
 * A posting's requirements, checked against the viewer's own profile.
 *
 * The SCF prototype leads its job detail with "5 of 7 met" and a ✓ or ✗ per
 * line, because the question a tradesperson actually has is not "what does
 * this job want" but "can I get this one". Our screen listed the same
 * requirements with no answer to that.
 *
 * Three of them can be answered honestly from data the app already holds:
 * education, years of experience, and a driver's licence. The rest —
 * background check, drug test, security clearance, travel — are not profile
 * fields, and a screen that guessed at them would be worse than one that
 * says nothing. So a requirement is `met`, `unmet`, or `unknown`, and only
 * the first two are counted.
 *
 * `unknown` is also what an anonymous visitor gets for everything: the
 * public job page renders the same list with no marks at all.
 */

/** Education levels, weakest first. Matching is "at least this". */
const EDUCATION_RANK: Record<string, number> = {
  none: 0,
  high_school: 1,
  ged: 1,
  certificate: 2,
  associate: 3,
  bachelor: 4,
  bachelors: 4,
  master: 5,
  masters: 5,
  doctorate: 6,
  phd: 6,
}

/** Degree types as the profile stores them, mapped onto the same scale. */
const DEGREE_RANK: Record<string, number> = {
  high_school: 1,
  ged: 1,
  certificate: 2,
  certification: 2,
  diploma: 2,
  associate: 3,
  associates: 3,
  bachelor: 4,
  bachelors: 4,
  master: 5,
  masters: 5,
  doctorate: 6,
  phd: 6,
  doctoral: 6,
}

function rank(table: Record<string, number>, value: string | null | undefined): number | null {
  if (!value) return null
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  return key in table ? table[key] : null
}

export type RequirementStatus = 'met' | 'unmet' | 'unknown'

export interface JobRequirement {
  id: string
  label: string
  status: RequirementStatus
}

export interface RequirementInputs {
  /** The posting. Only the requirement fields are read. */
  job: {
    minimum_education_level?: string | null
    minimum_years_experience?: number | null
    require_background_check?: boolean | null
    require_drug_test?: boolean | null
    require_drivers_license?: boolean | null
    security_clearance_required?: string | null
    travel_percentage?: number | null
    background_check_type?: string | null
    drivers_license_type?: string | null
  }
  /** The viewer's profile, or undefined when signed out or still loading. */
  profile?: {
    education?: Array<{ degree_type?: string | null }> | null
    experience?: Array<{
      start_date?: string | null
      end_date?: string | null
      is_current?: boolean | null
    }> | null
    driversLicenseClasses?: string[] | null
  }
}

/**
 * Total years across every experience entry, counted as elapsed months so a
 * six-month gig is not rounded to a year. Overlapping roles are counted once
 * each — a worker who held two jobs at once did do both — which is the same
 * convention a résumé uses.
 */
export function totalYearsOfExperience(
  entries: Array<{
    start_date?: string | null
    end_date?: string | null
    is_current?: boolean | null
  }>,
  now: Date = new Date()
): number {
  let months = 0
  for (const entry of entries) {
    if (!entry.start_date) continue
    const start = new Date(entry.start_date)
    if (Number.isNaN(start.getTime())) continue
    const rawEnd = entry.is_current ? now : entry.end_date ? new Date(entry.end_date) : now
    const end = Number.isNaN(rawEnd.getTime()) ? now : rawEnd
    if (end <= start) continue
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  }
  return months / 12
}

export function buildJobRequirements({ job, profile }: RequirementInputs): JobRequirement[] {
  const out: JobRequirement[] = []

  if (job.minimum_education_level) {
    const needed = rank(EDUCATION_RANK, job.minimum_education_level)
    const held = (profile?.education ?? [])
      .map((e) => rank(DEGREE_RANK, e.degree_type))
      .filter((n): n is number => n !== null)
    const best = held.length > 0 ? Math.max(...held) : null
    out.push({
      id: 'education',
      label: formatEducation(job.minimum_education_level),
      // An unrecognised level on either side is `unknown`, not `unmet`: the
      // vocabularies are free text and a mismatch may be a spelling, not a gap.
      status:
        !profile || needed === null || best === null ? 'unknown' : best >= needed ? 'met' : 'unmet',
    })
  }

  if (job.minimum_years_experience) {
    const entries = profile?.experience
    // An empty work history means "not filled in", not "no experience". The
    // seeded office account has none, and marking that ✗ would tell a
    // tradesperson with twenty years on the tools that they do not qualify
    // because they have not typed it in yet.
    const years = entries && entries.length > 0 ? totalYearsOfExperience(entries) : null
    out.push({
      id: 'experience',
      label: `${job.minimum_years_experience}+ years of experience`,
      status:
        !profile || years === null
          ? 'unknown'
          : years >= job.minimum_years_experience
            ? 'met'
            : 'unmet',
    })
  }

  if (job.require_drivers_license) {
    const classes = profile?.driversLicenseClasses
    out.push({
      id: 'drivers-license',
      label: job.drivers_license_type
        ? `Driver's licence (${job.drivers_license_type})`
        : "Driver's licence",
      // Any licence on file satisfies a plain requirement. A posting that
      // names a class is not checked against the classes held: "Class A" and
      // "CDL-A" are the same licence spelled two ways, and guessing wrong
      // here tells someone they cannot apply when they can.
      // Absent is "not recorded", not "does not hold one" — same reasoning
      // as the work history above. Only a licence actually on file answers
      // this, and only for a requirement that names no class.
      status:
        !profile || job.drivers_license_type || classes == null
          ? 'unknown'
          : classes.length > 0
            ? 'met'
            : 'unmet',
    })
  }

  // Not profile fields — listed, never marked.
  if (job.require_background_check) {
    out.push({
      id: 'background-check',
      label: job.background_check_type
        ? `Background check (${job.background_check_type})`
        : 'Background check',
      status: 'unknown',
    })
  }
  if (job.require_drug_test) {
    out.push({ id: 'drug-test', label: 'Drug test', status: 'unknown' })
  }
  if (job.security_clearance_required) {
    out.push({
      id: 'clearance',
      label: `Security clearance: ${job.security_clearance_required}`,
      status: 'unknown',
    })
  }
  if (job.travel_percentage && job.travel_percentage > 0) {
    out.push({
      id: 'travel',
      label: `Travel up to ${job.travel_percentage}%`,
      status: 'unknown',
    })
  }

  return out
}

/**
 * "3 of 4 met" — counting only what could be checked. Returns null when
 * nothing could be, so the screen shows the list without a score rather than
 * "0 of 0".
 */
export function requirementsSummary(
  requirements: JobRequirement[]
): { met: number; checkable: number } | null {
  const checkable = requirements.filter((r) => r.status !== 'unknown')
  if (checkable.length === 0) return null
  return { met: checkable.filter((r) => r.status === 'met').length, checkable: checkable.length }
}

/**
 * The posting's stored level as a requirement reads on screen. "bachelor" on
 * its own reads as a name, not a credential, so each known level gets its
 * full phrase and anything unrecognised falls back to title case rather than
 * being dropped.
 */
const EDUCATION_LABEL: Record<string, string> = {
  none: 'No formal education',
  high_school: 'High school diploma',
  ged: 'GED',
  certificate: 'Trade certificate',
  associate: "Associate's degree",
  bachelor: "Bachelor's degree",
  bachelors: "Bachelor's degree",
  master: "Master's degree",
  masters: "Master's degree",
  doctorate: 'Doctorate',
  phd: 'Ph.D.',
}

export function formatEducation(level: string): string {
  const key = level
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (key in EDUCATION_LABEL) return EDUCATION_LABEL[key]
  const spaced = level.replace(/[_-]+/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
