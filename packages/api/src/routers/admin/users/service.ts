import type { Database, Json } from '@app/supabase/types'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'

import {
  normaliseVerificationStatus,
  type WorkerVerificationStatus,
} from './mappers'
import {
  verificationSubjectTypes,
  type VerificationSubjectType,
} from './schema'

const VERIFY_WORKER_RPC = 'admin_verify_worker' as const
const REVOKE_WORKER_VERIFICATION_RPC = 'admin_revoke_worker_verification' as const
const GET_VERIFICATION_STATUS_RPC = 'admin_get_worker_verification_status' as const

type WorkerSummaryBase = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'display_name' | 'username' | 'slug' | 'headline' | 'open_to_work' | 'created_at' | 'updated_at'
>

export type WorkerSummaryRow = WorkerSummaryBase & {
  profile: { name: string | null } | null
  user_private: Pick<Database['public']['Tables']['user_private']['Row'], 'email' | 'phone'> | null
}

type WorkerDetailBase = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'id'
  | 'display_name'
  | 'username'
  | 'slug'
  | 'headline'
  | 'bio'
  | 'industry_id'
  | 'avatar_url'
  | 'avatar_media_id'
  | 'open_to_work'
  | 'years_of_experience'
  | 'skills_summary'
  | 'created_at'
  | 'updated_at'
>

type WorkerDetailRow = WorkerDetailBase & {
  user_private:
    | (Pick<
        Database['public']['Tables']['user_private']['Row'],
        | 'address'
        | 'availability'
        | 'certifications'
        | 'contact_prefs'
        | 'created_at'
        | 'drivers_license_class'
        | 'education_level'
        | 'email'
        | 'hourly_rate_cents'
        | 'location'
        | 'open_to_travel'
        | 'phone'
        | 'phone_os'
        | 'travel_mileage'
        | 'updated_at'
        | 'us_passport'
        | 'us_resident'
        | 'user_id'
        | 'veteran'
      > & {
        geo?: Database['public']['Tables']['user_private']['Row']['geo']
      })
    | null
  profile: { name: string | null; about: string | null; avatar_url: string | null } | null
}

export type WorkerProfile = {
  name: string | null
  about: string | null
  avatarUrl: string | null
}

export type WorkerVerificationLedgerEntry = {
  id: string
  subjectType: VerificationSubjectType
  field: string
  verifiedAt: string
  verifiedBy: string
  revokedAt: string | null
  source: string | null
  notes: string | null
}

export type WorkerVerification = WorkerVerificationStatus & {
  fields: string[]
  history: WorkerVerificationLedgerEntry[]
}

export type WorkerDetail = {
  id: string
  displayName: string | null
  username: string | null
  slug: string | null
  headline: string | null
  bio: string | null
  industryId: string | null
  avatarUrl: string | null
  avatarMediaId: string | null
  openToWork: boolean | null
  yearsOfExperience: number | null
  skillsSummary: Database['public']['Tables']['users']['Row']['skills_summary']
  createdAt: string
  updatedAt: string
  profile: WorkerProfile | null
  privateData: {
    userId: string
    email: string | null
    phone: string | null
    address: Json | null
    location: string | null
    openToTravel: boolean | null
    travelMileage: number | null
    usResident: boolean | null
    usPassport: boolean | null
    veteran: boolean | null
    educationLevel: string | null
    hourlyRateCents: number | null
    contactPrefs: string[] | null
    availability: string[] | null
    certifications: string[] | null
    phoneOs: string | null
    driversLicenseClass: string | null
    createdAt: string
    updatedAt: string
  } | null
  verification: WorkerVerification
}

export async function fetchVerificationStatus(
  supabase: SupabaseClient<Database>,
  workerId: string,
  organizationId: string | null,
): Promise<WorkerVerificationStatus> {
  const { data, error } = await supabase.rpc(
    GET_VERIFICATION_STATUS_RPC as never,
    {
      worker_id: workerId,
      organization_id: organizationId,
    } as never,
  )

  if (error) {
    const pgError = error as PostgrestError
    console.warn('Unable to load verification status', pgError)
    return { status: 'unknown', verifiedAt: null, verifiedBy: null, revokedAt: null }
  }

  return normaliseVerificationStatus(data)
}

export async function loadActiveVerificationFields(
  supabase: SupabaseClient<Database>,
  workerIds: string[],
) {
  const map = new Map<string, string[]>()
  if (!workerIds.length) {
    return map
  }

  const { data, error } = await supabase
    .from('profile_verifications')
    .select('subject_id, field')
    .in('subject_id', workerIds)
    .in('subject_type', verificationSubjectTypes)
    .is('revoked_at', null)

  if (error) {
    console.warn('Failed to load active verification fields', error)
    return map
  }

  for (const row of (data ?? []) as { subject_id: string; field: string }[]) {
    if (!row.subject_id || !row.field) continue
    const existing = map.get(row.subject_id) ?? []
    if (!existing.includes(row.field)) {
      existing.push(row.field)
    }
    map.set(row.subject_id, existing)
  }

  return map
}

async function loadVerificationLedger(
  supabase: SupabaseClient<Database>,
  workerId: string,
): Promise<WorkerVerificationLedgerEntry[]> {
  const { data, error } = await supabase
    .from('profile_verifications')
    .select('id, subject_type, field, verified_at, verified_by, revoked_at, source, notes')
    .eq('subject_id', workerId)
    .in('subject_type', verificationSubjectTypes)
    .order('verified_at', { ascending: false })

  if (error) {
    console.warn('Failed to load verification ledger', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    subjectType: row.subject_type as VerificationSubjectType,
    field: row.field,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    revokedAt: row.revoked_at,
    source: row.source ?? null,
    notes: row.notes ?? null,
  }))
}

export async function loadWorkerDetail(
  supabase: SupabaseClient<Database>,
  workerId: string,
  organizationId: string | null,
): Promise<WorkerDetail> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        id,
        display_name,
        username,
        slug,
        headline,
        bio,
        industry_id,
        avatar_url,
        avatar_media_id,
        open_to_work,
        years_of_experience,
        skills_summary,
        created_at,
        updated_at,
        profile:profiles!left(
          name,
          about,
          avatar_url
        ),
        user_private:user_private!left(
          user_id,
          email,
          phone,
          address,
          contact_prefs,
          veteran,
          us_resident,
          us_passport,
          travel_mileage,
          education_level,
          hourly_rate_cents,
          location,
          open_to_travel,
          drivers_license_class,
          phone_os,
          availability,
          certifications,
          created_at,
          updated_at
        )
      `,
    )
    .eq('id', workerId)
    .maybeSingle<WorkerDetailRow>()

  if (error) {
    console.error('Failed to load worker detail', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to fetch worker details.',
    })
  }

  if (!data) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Worker not found.' })
  }

  const profileRow = data.profile

  const profile: WorkerProfile | null = profileRow
    ? {
        name: profileRow.name,
        about: profileRow.about,
        avatarUrl: profileRow.avatar_url,
      }
    : null

  const privateRow = data.user_private

  const privateData = privateRow
    ? {
        userId: privateRow.user_id,
        email: privateRow.email,
        phone: privateRow.phone,
        address: (privateRow.address as Json | null) ?? null,
        location: privateRow.location ?? null,
        openToTravel: privateRow.open_to_travel ?? null,
        travelMileage: privateRow.travel_mileage ?? null,
        usResident: privateRow.us_resident ?? null,
        usPassport: privateRow.us_passport ?? null,
        veteran: privateRow.veteran ?? null,
        educationLevel: privateRow.education_level ?? null,
        hourlyRateCents: privateRow.hourly_rate_cents ?? null,
        contactPrefs: privateRow.contact_prefs ?? null,
        availability: privateRow.availability ?? null,
        certifications: privateRow.certifications ?? null,
        phoneOs: privateRow.phone_os ?? null,
        driversLicenseClass: privateRow.drivers_license_class ?? null,
        createdAt: privateRow.created_at,
        updatedAt: privateRow.updated_at,
      }
    : null

  const [verificationStatus, activeFieldMap, history] = await Promise.all([
    fetchVerificationStatus(supabase, workerId, organizationId),
    loadActiveVerificationFields(supabase, [workerId]),
    loadVerificationLedger(supabase, workerId),
  ])

  const fields = activeFieldMap.get(workerId) ?? []

  return {
    id: data.id,
    displayName: data.display_name,
    username: data.username,
    slug: data.slug,
    headline: data.headline,
    bio: data.bio,
    industryId: data.industry_id,
    avatarUrl: data.avatar_url,
    avatarMediaId: data.avatar_media_id,
    openToWork: data.open_to_work,
    yearsOfExperience: data.years_of_experience,
    skillsSummary: data.skills_summary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    profile,
    privateData,
    verification: { ...verificationStatus, fields, history },
  }
}

type VerificationActionInput = {
  workerId: string
  organizationId: string
  field: string
  subjectType: VerificationSubjectType
  reason?: string
}

function toVerificationRpcInput({
  workerId,
  organizationId,
  field,
  subjectType,
  reason,
}: VerificationActionInput) {
  const rpcInput: Record<string, unknown> = {
    worker_id: workerId,
    organization_id: organizationId,
    field,
    subject_type: subjectType,
  }

  if (reason !== undefined) {
    rpcInput.reason = reason
  }

  return rpcInput
}

export async function verifyWorker(
  supabase: SupabaseClient<Database>,
  params: VerificationActionInput,
): Promise<WorkerVerificationStatus> {
  const { error } = await supabase.rpc(VERIFY_WORKER_RPC as never, toVerificationRpcInput(params) as never)

  if (error) {
    console.error('Failed to verify worker', error)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to verify worker.' })
  }

  return fetchVerificationStatus(supabase, params.workerId, params.organizationId)
}

export async function revokeWorkerVerification(
  supabase: SupabaseClient<Database>,
  params: VerificationActionInput,
): Promise<WorkerVerificationStatus> {
  const { error } = await supabase.rpc(
    REVOKE_WORKER_VERIFICATION_RPC as never,
    toVerificationRpcInput(params) as never,
  )

  if (error) {
    console.error('Failed to revoke worker verification', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to revoke worker verification.',
    })
  }

  return fetchVerificationStatus(supabase, params.workerId, params.organizationId)
}
