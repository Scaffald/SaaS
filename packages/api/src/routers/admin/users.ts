import type { Database, Json } from '@app/supabase/types'
import { TRPCError } from '@trpc/server'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '../../trpc'

const VERIFY_WORKER_RPC = 'admin_verify_worker' as const
const REVOKE_WORKER_VERIFICATION_RPC = 'admin_revoke_worker_verification' as const
const GET_VERIFICATION_STATUS_RPC = 'admin_get_worker_verification_status' as const

const verificationStatuses = ['verified', 'revoked', 'pending', 'unverified', 'unknown'] as const
const verificationSubjectTypes = ['profile', 'user', 'user_private'] as const

type VerificationSubjectType = (typeof verificationSubjectTypes)[number]

type WorkerVerificationStatus = {
  status: (typeof verificationStatuses)[number]
  verifiedAt: string | null
  verifiedBy: string | null
  revokedAt: string | null
}

type WorkerSummaryRow = Database['public']['Tables']['users']['Row'] & {
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'name'> | null
  user_private: Pick<Database['public']['Tables']['user_private']['Row'], 'email' | 'phone'> | null
}

type WorkerDetailRow = Database['public']['Tables']['users']['Row'] & {
  user_private:
    | (Pick<Database['public']['Tables']['user_private']['Row'],
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
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'name' | 'about' | 'avatar_url'> | null
}

type AdminAccess = {
  role: 'super_admin' | 'partner_admin'
  organizationId: string | null
}

const baseAdminContextSchema = z.object({
  organizationId: z.string().uuid().optional(),
})

const searchWorkersInputSchema = baseAdminContextSchema.extend({
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

const workerIdentifierSchema = baseAdminContextSchema.extend({
  workerId: z.string().uuid(),
})

const workerPublicUpdateSchema = z
  .object({
    displayName: z.string().trim().max(120).nullable().optional(),
    username: z.string().trim().max(60).nullable().optional(),
    slug: z.string().trim().max(120).nullable().optional(),
    headline: z.string().trim().max(280).nullable().optional(),
    bio: z.string().nullable().optional(),
    industryId: z.string().uuid().nullable().optional(),
    openToWork: z.boolean().nullable().optional(),
    yearsOfExperience: z.number().int().min(0).max(100).nullable().optional(),
    skillsSummary: z.unknown().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
  })
  .strict()

const workerPrivateUpdateSchema = z
  .object({
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().max(60).nullable().optional(),
    address: z.record(z.unknown()).nullable().optional(),
    location: z.string().trim().max(160).nullable().optional(),
    openToTravel: z.boolean().nullable().optional(),
    travelMileage: z.number().int().min(0).max(10000).nullable().optional(),
    usResident: z.boolean().nullable().optional(),
    usPassport: z.boolean().nullable().optional(),
    veteran: z.boolean().nullable().optional(),
    educationLevel: z.string().trim().max(160).nullable().optional(),
    hourlyRateCents: z.number().int().min(0).nullable().optional(),
    contactPrefs: z.array(z.string().trim().max(120)).nullable().optional(),
    availability: z.array(z.string().trim().max(120)).nullable().optional(),
    certifications: z.array(z.string().trim().max(160)).nullable().optional(),
    phoneOs: z.string().trim().max(32).nullable().optional(),
    driversLicenseClass: z.string().trim().max(64).nullable().optional(),
  })
  .strict()

const updateWorkerInputSchema = workerIdentifierSchema
  .extend({
    profileData: workerProfileUpdateSchema.optional(),
    publicData: workerPublicUpdateSchema.optional(),
    privateData: workerPrivateUpdateSchema.optional(),
  })
  .refine((value) => value.profileData || value.publicData || value.privateData, {
    message: 'At least one of profileData, publicData, or privateData must be provided',
    path: ['profileData'],
  })

const verifyWorkerInputSchema = workerIdentifierSchema.extend({
  reason: z.string().trim().max(280).optional(),
  field: verificationFieldSchema,
  subjectType: verificationSubjectSchema,
})

type WorkerPublicUpdateInput = z.infer<typeof workerPublicUpdateSchema>
type WorkerPrivateUpdateInput = z.infer<typeof workerPrivateUpdateSchema>

const workerProfileUpdateSchema = z
  .object({
    name: z.string().trim().max(120).nullable().optional(),
    about: z.string().nullable().optional(),
    avatarUrl: z.string().url().trim().max(512).nullable().optional(),
  })
  .strict()

const verificationFieldSchema = z.string().trim().min(1).max(160)
const verificationSubjectSchema = z.enum(verificationSubjectTypes)

type WorkerProfileUpdateInput = z.infer<typeof workerProfileUpdateSchema>

type WorkerDetail = {
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

type WorkerProfile = {
  name: string | null
  about: string | null
  avatarUrl: string | null
}

type WorkerVerificationLedgerEntry = {
  id: string
  subjectType: VerificationSubjectType
  field: string
  verifiedAt: string
  verifiedBy: string
  revokedAt: string | null
  source: string | null
  notes: string | null
}

type WorkerVerification = WorkerVerificationStatus & {
  fields: string[]
  history: WorkerVerificationLedgerEntry[]
}

function normaliseVerificationStatus(payload: unknown): WorkerVerificationStatus {
  if (!payload || typeof payload !== 'object') {
    return { status: 'unknown', verifiedAt: null, verifiedBy: null, revokedAt: null }
  }

  const record = payload as Record<string, unknown>

  const rawStatus = [
    typeof record.status === 'string' ? record.status : undefined,
    typeof record.current_status === 'string' ? record.current_status : undefined,
  ].find((value): value is string => typeof value === 'string')

  const status = verificationStatuses.includes(rawStatus as (typeof verificationStatuses)[number])
    ? (rawStatus as (typeof verificationStatuses)[number])
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

function buildIlikeFilter(value: string) {
  return `%${value.replace(LIKE_WILDCARD, '\\$&')}%`
}

async function applyOrganizationContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const { error } = await supabase.rpc('set_org_context' as never, { p_org_id: organizationId } as never)
  if (error) {
    console.error('Failed to set organization context', error)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to apply organization context.' })
  }
}

async function ensureAdminAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId: string | undefined,
  { requireOrgContext = false }: { requireOrgContext?: boolean } = {},
): Promise<AdminAccess> {
  const { data: isSuperAdmin, error: superError } = await supabase.rpc('user_has_role', {
    p_user_id: userId,
    p_role_name: 'super_admin',
  })

  if (superError) {
    console.error('Failed to verify admin access', superError)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not verify administrator role.' })
  }

  if (isSuperAdmin) {
    if (organizationId) {
      await applyOrganizationContext(supabase, organizationId)
    }
    if (requireOrgContext && !organizationId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'organizationId is required for this operation.' })
    }
    return { role: 'super_admin', organizationId: organizationId ?? null }
  }

  if (!organizationId) {
    throw new TRPCError({
      code: requireOrgContext ? 'BAD_REQUEST' : 'FORBIDDEN',
      message: 'An organizationId is required for partner administrator operations.',
    })
  }

  const { data: isPartnerAdmin, error: partnerError } = await supabase.rpc('user_has_role', {
    p_user_id: userId,
    p_role_name: 'partner_admin',
    p_org_id: organizationId,
  })

  if (partnerError) {
    console.error('Failed to verify partner admin access', partnerError)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not verify partner administrator role.' })
  }

  if (!isPartnerAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' })
  }

  await applyOrganizationContext(supabase, organizationId)

  return { role: 'partner_admin', organizationId }
}

async function fetchVerificationStatus(
  supabase: SupabaseClient<Database>,
  workerId: string,
  organizationId: string | null,
): Promise<WorkerVerificationStatus> {
  const { data, error } = await supabase.rpc(GET_VERIFICATION_STATUS_RPC as never, {
    worker_id: workerId,
    organization_id: organizationId,
  } as never)

  if (error) {
    const pgError = error as PostgrestError
    console.warn('Unable to load verification status', pgError)
    return { status: 'unknown', verifiedAt: null, verifiedBy: null, revokedAt: null }
  }

  return normaliseVerificationStatus(data)
}

function mapPublicUpdates(input: WorkerPublicUpdateInput | undefined) {
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
  if (input.skillsSummary !== undefined)
    payload.skills_summary = input.skillsSummary as Json | null
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl
  if (input.avatarMediaId !== undefined) payload.avatar_media_id = input.avatarMediaId

  return Object.keys(payload).length ? payload : null
}

function mapPrivateUpdates(input: WorkerPrivateUpdateInput | undefined) {
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

function mapProfileUpdates(input: WorkerProfileUpdateInput | undefined) {
  if (!input) return null

  const payload: Partial<Database['public']['Tables']['profiles']['Update']> = {}

  if (input.name !== undefined) payload.name = input.name
  if (input.about !== undefined) payload.about = input.about
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl

  return Object.keys(payload).length ? payload : null
}

async function loadActiveVerificationFields(
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

async function loadWorkerDetail(
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
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to fetch worker details.' })
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

export const adminUsersRouter = createTRPCRouter({
  search: protectedProcedure.input(searchWorkersInputSchema).query(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId)

    const likeQuery = input.query?.trim()
    const rangeEnd = input.offset + input.limit - 1

    let query = supabase
      .from('users')
      .select(
        `
          id,
          display_name,
          username,
          slug,
          headline,
          open_to_work,
          created_at,
          updated_at,
          profile:profiles!left(name),
          user_private:user_private!left(email, phone)
        `,
        { count: 'exact' },
      )
      .order('display_name', { ascending: true })
      .range(input.offset, Math.max(input.offset, rangeEnd))

    if (likeQuery) {
      const filter = buildIlikeFilter(likeQuery)
      query = query.or(
        `display_name.ilike.${filter},username.ilike.${filter},user_private.email.ilike.${filter}`,
      )
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to search workers', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to search workers.' })
    }

    const rows = (data ?? []) as WorkerSummaryRow[]
    const verificationFieldMap = await loadActiveVerificationFields(
      supabase,
      rows.map((row) => row.id),
    )

    return {
      results: rows.map((row) => ({
        id: row.id,
        displayName: row.display_name,
        username: row.username,
        slug: row.slug,
        headline: row.headline,
        openToWork: row.open_to_work,
        fullName: row.profile?.name ?? null,
        email: row.user_private?.email ?? null,
        phone: row.user_private?.phone ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        verification: {
          fields: verificationFieldMap.get(row.id) ?? [],
        },
      })),
      count: typeof count === 'number' ? count : rows.length,
      organizationId,
    }
  }),

  detail: protectedProcedure.input(workerIdentifierSchema).query(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId)

    return loadWorkerDetail(supabase, input.workerId, organizationId)
  }),

  update: protectedProcedure.input(updateWorkerInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId)

    const profilePayload = mapProfileUpdates(input.profileData)
    const publicPayload = mapPublicUpdates(input.publicData)
    const privatePayload = mapPrivateUpdates(input.privateData)

    if (profilePayload) {
      const { error } = await supabase.from('profiles').update(profilePayload).eq('id', input.workerId)
      if (error) {
        console.error('Failed to update profile data', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update worker profile.' })
      }
    }

    if (publicPayload) {
      const { error } = await supabase.from('users').update(publicPayload).eq('id', input.workerId)
      if (error) {
        console.error('Failed to update public worker data', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update worker profile.' })
      }
    }

    if (privatePayload) {
      const { error } = await supabase
        .from('user_private')
        .upsert({ user_id: input.workerId, ...privatePayload }, { onConflict: 'user_id' })
      if (error) {
        console.error('Failed to update private worker data', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update worker private data.' })
      }
    }

    return loadWorkerDetail(supabase, input.workerId, organizationId)
  }),

  verify: protectedProcedure.input(verifyWorkerInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId, {
      requireOrgContext: true,
    })

    const rpcInput: Record<string, unknown> = {
      worker_id: input.workerId,
      organization_id: organizationId,
      field: input.field,
      subject_type: input.subjectType,
    }
    if (input.reason !== undefined) {
      rpcInput.reason = input.reason
    }

    const { error } = await supabase.rpc(VERIFY_WORKER_RPC as never, rpcInput as never)

    if (error) {
      console.error('Failed to verify worker', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to verify worker.' })
    }

    return fetchVerificationStatus(supabase, input.workerId, organizationId)
  }),

  revoke: protectedProcedure.input(verifyWorkerInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId, {
      requireOrgContext: true,
    })

    const rpcInput: Record<string, unknown> = {
      worker_id: input.workerId,
      organization_id: organizationId,
      field: input.field,
      subject_type: input.subjectType,
    }
    if (input.reason !== undefined) {
      rpcInput.reason = input.reason
    }

    const { error } = await supabase.rpc(REVOKE_WORKER_VERIFICATION_RPC as never, rpcInput as never)

    if (error) {
      console.error('Failed to revoke worker verification', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to revoke worker verification.' })
    }

    return fetchVerificationStatus(supabase, input.workerId, organizationId)
  }),
})
