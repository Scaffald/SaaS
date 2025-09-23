import type { Database, Json } from '@app/supabase/types'

import {
  type VerificationStatus,
  verificationStatuses,
  type WorkerPrivateUpdateInput,
  type WorkerProfileUpdateInput,
  type WorkerPublicUpdateInput,
} from './schema'

export type WorkerVerificationStatus = {
  status: VerificationStatus
  verifiedAt: string | null
  verifiedBy: string | null
  revokedAt: string | null
}

export function normaliseVerificationStatus(payload: unknown): WorkerVerificationStatus {
  if (!payload || typeof payload !== 'object') {
    return { status: 'unknown', verifiedAt: null, verifiedBy: null, revokedAt: null }
  }

  const record = payload as Record<string, unknown>

  const rawStatus = [
    typeof record.status === 'string' ? record.status : undefined,
    typeof record.current_status === 'string' ? record.current_status : undefined,
  ].find((value): value is string => typeof value === 'string')

  const status = verificationStatuses.includes(rawStatus as VerificationStatus)
    ? (rawStatus as VerificationStatus)
    : 'unknown'

  const verifiedAt =
    typeof record.verified_at === 'string'
      ? record.verified_at
      : typeof record.verifiedAt === 'string'
        ? record.verifiedAt
        : null

  const verifiedBy =
    typeof record.verified_by === 'string'
      ? record.verified_by
      : typeof record.verifiedBy === 'string'
        ? record.verifiedBy
        : null

  const revokedAt =
    typeof record.revoked_at === 'string'
      ? record.revoked_at
      : typeof record.revokedAt === 'string'
        ? record.revokedAt
        : null

  return {
    status,
    verifiedAt,
    verifiedBy,
    revokedAt,
  }
}

const LIKE_WILDCARD = /[%_]/g

export function buildIlikeFilter(value: string) {
  return `%${value.replace(LIKE_WILDCARD, '\\$&')}%`
}

export function mapPublicUpdates(input: WorkerPublicUpdateInput | undefined) {
  if (!input) return null

  const payload: Partial<Database['public']['Tables']['users']['Update']> = {}

  if (input.displayName !== undefined) payload.display_name = input.displayName
  if (input.username !== undefined) payload.username = input.username
  if (input.slug !== undefined) payload.slug = input.slug
  if (input.headline !== undefined) payload.headline = input.headline
  if (input.bio !== undefined) payload.bio = input.bio
  if (input.industryId !== undefined) payload.industry_id = input.industryId
  if (input.openToWork !== undefined) payload.open_to_work = input.openToWork
  if (input.yearsOfExperience !== undefined) payload.years_of_experience = input.yearsOfExperience
  if (input.skillsSummary !== undefined) payload.skills_summary = input.skillsSummary as Json | null
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl
  if (input.avatarMediaId !== undefined) payload.avatar_media_id = input.avatarMediaId

  return Object.keys(payload).length ? payload : null
}

export function mapPrivateUpdates(input: WorkerPrivateUpdateInput | undefined) {
  if (!input) return null

  const payload: Partial<Database['public']['Tables']['user_private']['Insert']> = {}

  if (input.email !== undefined) payload.email = input.email
  if (input.phone !== undefined) payload.phone = input.phone
  if (input.address !== undefined) payload.address = (input.address ?? null) as Json | null
  if (input.location !== undefined) payload.location = input.location ?? null
  if (input.openToTravel !== undefined) payload.open_to_travel = input.openToTravel
  if (input.travelMileage !== undefined) payload.travel_mileage = input.travelMileage
  if (input.usResident !== undefined) payload.us_resident = input.usResident
  if (input.usPassport !== undefined) payload.us_passport = input.usPassport
  if (input.veteran !== undefined) payload.veteran = input.veteran
  if (input.educationLevel !== undefined) payload.education_level = input.educationLevel ?? null
  if (input.hourlyRateCents !== undefined) payload.hourly_rate_cents = input.hourlyRateCents
  if (input.contactPrefs !== undefined) payload.contact_prefs = input.contactPrefs ?? null
  if (input.availability !== undefined) payload.availability = input.availability ?? null
  if (input.certifications !== undefined) payload.certifications = input.certifications ?? null
  if (input.phoneOs !== undefined) payload.phone_os = input.phoneOs ?? null
  if (input.driversLicenseClass !== undefined)
    payload.drivers_license_class = input.driversLicenseClass ?? null

  return Object.keys(payload).length ? payload : null
}

export function mergeUpdatePayloads<T extends Record<string, unknown>>(
  ...payloads: Array<T | null | undefined>
): T | null {
  let merged: T | null = null

  for (const payload of payloads) {
    if (!payload) continue
    if (merged) {
      merged = { ...merged, ...payload } as T
    } else {
      merged = { ...payload } as T
    }
  }

  return merged
}

export function mapProfileUpdates(input: WorkerProfileUpdateInput | undefined) {
  if (!input) return null

  const payload: Partial<{ name: string | null; about: string | null; avatar_url: string | null }> = {}

  if (input.name !== undefined) payload.name = input.name
  if (input.about !== undefined) payload.about = input.about
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl

  return Object.keys(payload).length ? payload : null
}
