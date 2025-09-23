import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '../../trpc'
import { ensureAdminAccess } from './users/access'
import {
  buildIlikeFilter,
  mapPrivateUpdates,
  mapProfileUpdates,
  mapPublicUpdates,
  mergeUpdatePayloads,
} from './users/mappers'
import {
  loadActiveVerificationFields,
  loadWorkerDetail,
  revokeWorkerVerification,
  verifyWorker,
  type WorkerSummaryRow,
} from './users/service'
import {
  searchWorkersInputSchema,
  updateWorkerInputSchema,
  verifyWorkerInputSchema,
  workerIdentifierSchema,
} from './users/schema'

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

    const rows = (data ?? []) as unknown as WorkerSummaryRow[]
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
    const publicPayload = mergeUpdatePayloads(
      mapPublicUpdates(input.profileData?.publicData),
      mapPublicUpdates(input.publicData),
    )
    const privatePayload = mergeUpdatePayloads(
      mapPrivateUpdates(input.profileData?.privateData),
      mapPrivateUpdates(input.privateData),
    )

    if (profilePayload) {
      const { error } = await supabase
        .from('profiles' as never)
        .update(profilePayload as never)
        .eq('id', input.workerId)
      if (error) {
        console.error('Failed to update profile data', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update worker profile.' })
      }
    }

    if (publicPayload) {
      const { error } = await supabase.from('users').update(publicPayload).eq('id', input.workerId)
      if (error) {
        console.error('Failed to update public worker data', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to update worker profile.',
        })
      }
    }

    if (privatePayload) {
      const { error } = await supabase
        .from('user_private')
        .upsert({ user_id: input.workerId, ...privatePayload }, { onConflict: 'user_id' })
      if (error) {
        console.error('Failed to update private worker data', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to update worker private data.',
        })
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

    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'organizationId is required for this operation.',
      })
    }

    return verifyWorker(supabase, {
      workerId: input.workerId,
      organizationId,
      field: input.field,
      subjectType: input.subjectType,
      reason: input.reason,
    })
  }),

  revoke: protectedProcedure.input(verifyWorkerInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    if (!user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { organizationId } = await ensureAdminAccess(supabase, user.id, input.organizationId, {
      requireOrgContext: true,
    })

    if (!organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'organizationId is required for this operation.',
      })
    }

    return revokeWorkerVerification(supabase, {
      workerId: input.workerId,
      organizationId,
      field: input.field,
      subjectType: input.subjectType,
      reason: input.reason,
    })
  }),
})
