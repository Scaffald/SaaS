/**
 * What the profile's identity block says about a person, as pure rules so the
 * wording and the "only what exists" filtering can be tested without React.
 *
 * Used by GeneralInfoWidget (the block on /profile and the public pages) and
 * by the worker profile an employer opens, which puts the same facts in its
 * page header instead (#1197).
 */

/** The fields of the general-info payload the facts line reads. */
export interface IdentityFactsSource {
  industries?: { name?: string | null } | null
  privateData?: { location?: string | null } | null
  calculatedYearsOfExperience?: number | null
  years_of_experience?: number | null
}

/**
 * Trade · location · years, the prototype's facts line. Location is private
 * data, so it appears only where privateData does (the owner's own view).
 */
export function identityFacts(data: IdentityFactsSource): string[] {
  const yearsValue =
    typeof data.calculatedYearsOfExperience === 'number'
      ? data.calculatedYearsOfExperience
      : data.years_of_experience
  const years =
    typeof yearsValue === 'number' && !Number.isNaN(yearsValue) && yearsValue > 0
      ? Number.isInteger(yearsValue)
        ? yearsValue
        : Number(yearsValue.toFixed(1))
      : null
  return [
    data.industries?.name,
    data.privateData?.location,
    years !== null ? `${years} ${years === 1 ? 'year' : 'years'} in the trade` : null,
  ].filter((fact): fact is string => !!fact)
}

/**
 * One tag in the identity block's proof row (#1187). `accent` is the tonal
 * tag for something an issuer checked; `outline` is for proof we derive.
 */
export interface TrustTag {
  key: string
  label: string
  tone: 'accent' | 'outline'
}

export interface TrustTagSources {
  /** The viewer's own checks — only ever passed for the owner's view. */
  backgroundChecks?: ReadonlyArray<{
    id: string
    status: string
    expires_at?: string | null
  }> | null
  /**
   * The certifications widget rows. `verification_status` is on the row the
   * API returns (it selects `*`) though the SDK type leaves it out.
   */
  certifications?: ReadonlyArray<{
    id: string
    name: string
    expiration_date?: string | null
    does_not_expire?: boolean | null
    verification_status?: string | null
  }> | null
  skills?: ReadonlyArray<{ verified: boolean }> | null
  now?: Date
}

/** A date-only or full ISO string that falls before `now`. */
function isPast(value: string | null | undefined, now: Date): boolean {
  if (!value) return false
  const time = new Date(value).getTime()
  return !Number.isNaN(time) && time < now.getTime()
}

/**
 * The proof under the name: a clear background check and each verified
 * certification as filled tags, then the count of verified skills as an
 * outlined one. Anything not on the record — or lapsed — is left out, so a
 * profile with nothing verified gets no row at all.
 */
export function buildTrustTags({
  backgroundChecks,
  certifications,
  skills,
  now = new Date(),
}: TrustTagSources): TrustTag[] {
  const tags: TrustTag[] = []

  const clearCheck = (backgroundChecks ?? []).find(
    (check) => check.status === 'completed_clear' && !isPast(check.expires_at, now)
  )
  if (clearCheck) {
    tags.push({ key: `bg-${clearCheck.id}`, label: '✓ Background check clear', tone: 'accent' })
  }

  for (const cert of certifications ?? []) {
    if (cert.verification_status !== 'verified') continue
    if (!cert.does_not_expire && isPast(cert.expiration_date, now)) continue
    tags.push({ key: `cert-${cert.id}`, label: `✓ ${cert.name} verified`, tone: 'accent' })
  }

  const verifiedSkills = (skills ?? []).filter((skill) => skill.verified).length
  if (verifiedSkills > 0) {
    tags.push({
      key: 'skills-verified',
      label: `◈ ${verifiedSkills} verified ${verifiedSkills === 1 ? 'skill' : 'skills'}`,
      tone: 'outline',
    })
  }

  return tags
}
