/**
 * Notifications Proxy Router
 * 
 * Proxies requests to the Edge Function notifications router
 * This allows the frontend to use type-safe tRPC hooks while calling Edge Functions
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * Call Edge Function tRPC endpoint
 */
async function callEdgeFunctionTRPC(
  procedure: string,
  input: unknown,
  accessToken: string,
  type: 'query' | 'mutation' = 'query'
): Promise<unknown> {
  // Use process.env for server-side environment variables
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'http://localhost:54321'
  const baseUrl = `${supabaseUrl}/functions/v1/trpc/notifications.${procedure}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    apikey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      '',
  }

  let response: Response

  if (type === 'mutation') {
    // Mutations use POST with batch format
    response = await fetch(`${baseUrl}?batch=1`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        0: input ?? null,
      }),
    })
  } else {
    // Queries use GET with batch format
    const url =
      input === undefined
        ? `${baseUrl}?batch=1`
        : `${baseUrl}?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': input }))}`

    response = await fetch(url, {
      method: 'GET',
      headers,
    })
  }

  if (!response.ok) {
    const errorText = await response.text()
    let errorData: unknown
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = errorText
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Edge Function error: ${JSON.stringify(errorData)}`,
    })
  }

  const result = await response.json()
  // tRPC Edge Function returns results in batched format: [{ result: { data: ... } }]
  if (Array.isArray(result) && result.length > 0) {
    const firstResult = result[0]
    if (firstResult.result) {
      if (firstResult.result.error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: firstResult.result.error.message || 'Edge Function error',
        })
      }
      return firstResult.result.data
    }
    return firstResult
  }
  return result
}

export const notificationsProxyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['all', 'unread', 'read', 'archived']).default('all'),
          limit: z.number().int().min(1).max(100).default(25),
          cursor: z.string().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      // Get access token from context (set during context creation)
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      // Ensure input has defaults applied
      const queryInput = {
        status: input?.status ?? 'all',
        limit: input?.limit ?? 25,
        cursor: input?.cursor,
      }
      return callEdgeFunctionTRPC('list', queryInput, ctx.accessToken)
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({}).optional().default({}))
    .query(async ({ ctx }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('getUnreadCount', {}, ctx.accessToken)
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('markAsRead', input, ctx.accessToken, 'mutation')
    }),

  markAsUnread: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('markAsUnread', input, ctx.accessToken, 'mutation')
    }),

  markManyRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('markManyRead', input, ctx.accessToken, 'mutation')
    }),

  markManyUnread: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('markManyUnread', input, ctx.accessToken, 'mutation')
    }),

  archiveMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('archiveMany', input, ctx.accessToken, 'mutation')
    }),

  restoreMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('restoreMany', input, ctx.accessToken, 'mutation')
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('markAllAsRead', undefined, ctx.accessToken, 'mutation')
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.accessToken) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No access token' })
      }
      return callEdgeFunctionTRPC('deleteMany', input, ctx.accessToken, 'mutation')
    }),
})
