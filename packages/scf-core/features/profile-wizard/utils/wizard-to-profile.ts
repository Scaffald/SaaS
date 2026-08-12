import type { WizardStepData } from '../hooks/useProfileWizard'

/**
 * The wizard autosaves as the user types, so any step in progress can be
 * half-filled. These builders are handed whatever has accumulated so far, not a
 * complete shape — the parameter type has to say so or every call site lies.
 */
export type PartialWizardStepData = {
  [K in keyof WizardStepData]?: Partial<NonNullable<WizardStepData[K]>>
}

/**
 * Translate accumulated wizard step data into the payloads the profile editors
 * already send.
 *
 * The wizard collected six steps into core.preferences and stopped there —
 * POST /v1/profile-wizard/complete wrote wizard progress and nothing else, so
 * finishing it left the actual profile untouched (#584). Rather than give the
 * server a second write path for every profile section, the wizard now commits
 * through the same endpoints the editors use. One write path, one set of
 * validation rules, one place for a bug to live.
 *
 * Each builder returns `null` when the step has nothing worth sending, so the
 * caller can skip the request entirely rather than PATCH an empty object.
 */

export interface GeneralInfoPayload {
  first_name?: string
  last_name?: string
  headline?: string
  about?: string
}

/** Maps the general step onto PATCH /v1/profiles/general. */
export function buildGeneralPayload(data: PartialWizardStepData): GeneralInfoPayload | null {
  const step = data.general
  if (!step) return null

  const payload: GeneralInfoPayload = {}
  const firstName = step.firstName?.trim()
  const lastName = step.lastName?.trim()
  const headline = step.headline?.trim()
  const bio = step.bio?.trim()

  if (firstName) payload.first_name = firstName
  if (lastName) payload.last_name = lastName
  if (headline) payload.headline = headline
  // The wizard calls it "bio"; the profile stores it as `about`.
  if (bio) payload.about = bio

  return Object.keys(payload).length > 0 ? payload : null
}

export interface ExperiencePayload {
  career_level: null
  experience_entries: Array<{
    job_title: string
    company_name: string
    start_date?: string | null
    end_date?: string | null
    is_current: boolean
    is_remote: boolean
    description?: string | null
  }>
}

/** Maps the experience step onto POST /v1/profiles/experience. */
export function buildExperiencePayload(data: PartialWizardStepData): ExperiencePayload | null {
  const step = data.experience
  const jobTitle = step?.jobTitle?.trim()
  const companyName = step?.companyName?.trim()

  // The editor requires both; a half-filled entry is not worth writing.
  if (!jobTitle || !companyName) return null

  return {
    career_level: null,
    experience_entries: [
      {
        job_title: jobTitle,
        company_name: companyName,
        start_date: step?.startDate ?? null,
        end_date: step?.isCurrent ? null : (step?.endDate ?? null),
        is_current: Boolean(step?.isCurrent),
        is_remote: false,
        description: step?.summary?.trim() || null,
      },
    ],
  }
}

export interface CertificationsPayload {
  certifications: Array<{
    name: string
    issuing_organization: string
    issue_date?: string | null
    expiration_date?: string | null
  }>
}

/** Maps the certifications step onto the certifications write path. */
export function buildCertificationsPayload(data: PartialWizardStepData): CertificationsPayload | null {
  const entries = (data.certifications?.certifications ?? [])
    .map((cert) => ({
      name: cert.name?.trim() ?? '',
      issuing_organization: cert.issuer?.trim() ?? '',
      issue_date: cert.issuedOn ?? null,
      expiration_date: cert.expiresOn ?? null,
    }))
    // Completion scoring requires both fields; anything short of that is noise.
    .filter((cert) => cert.name && cert.issuing_organization)

  return entries.length > 0 ? { certifications: entries } : null
}

export interface EmploymentPayload {
  hourly_rate?: number
  availability?: string[]
  preferred_work_locations?: string[]
}

/** Maps the preferences step onto PATCH /v1/profiles/employment. */
export function buildEmploymentPayload(data: PartialWizardStepData): EmploymentPayload | null {
  const step = data.preferences
  if (!step) return null

  const payload: EmploymentPayload = {}

  const rate = step.hourlyRate?.trim()
  if (rate) {
    const parsed = Number.parseFloat(rate.replace(/[^0-9.]/g, ''))
    if (Number.isFinite(parsed) && parsed > 0) payload.hourly_rate = parsed
  }

  const availability = step.availability?.trim()
  if (availability) payload.availability = [availability]

  const location = step.locationPreference?.trim()
  if (location) payload.preferred_work_locations = [location]

  return Object.keys(payload).length > 0 ? payload : null
}

export interface SkillsPayload {
  skills: Array<{ skill_id: string; taxonomy: 'csi' | 'onet'; proficiency_level: number }>
}

/** Maps the skills step onto the skills write path. */
export function buildSkillsPayload(data: PartialWizardStepData): SkillsPayload | null {
  const entries = (data.skills?.skills ?? [])
    .filter((skill) => Boolean(skill?.id))
    .map((skill) => ({
      skill_id: skill.id,
      taxonomy: skill.taxonomy,
      proficiency_level: skill.proficiency,
    }))

  return entries.length > 0 ? { skills: entries } : null
}

export interface EducationPayload {
  education_entries: Array<{
    institution_name: string
    degree_type?: string | null
    start_date?: string | null
    end_date?: string | null
    is_current: boolean
  }>
}

/** Maps the education step onto POST /v1/profiles/education. */
export function buildEducationPayload(data: PartialWizardStepData): EducationPayload | null {
  const step = data.education
  const institution = step?.institutionName?.trim()
  if (!institution) return null

  return {
    education_entries: [
      {
        institution_name: institution,
        degree_type: step?.degreeType?.trim() || null,
        start_date: step?.startDate ?? null,
        end_date: step?.isCurrent ? null : (step?.endDate ?? null),
        is_current: Boolean(step?.isCurrent),
      },
    ],
  }
}
