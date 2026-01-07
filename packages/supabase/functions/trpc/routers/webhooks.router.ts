/**
 * Webhooks Router
 * Manages webhook endpoints, deliveries, and events
 */

import { z } from 'zod'
import { router, authenticatedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../../../types/supabase'
import {
  CreateWebhookInputSchema,
  UpdateWebhookInputSchema,
  WebhookDeliveryFilterSchema,
  WebhookEventType,
} from '@scf/schemas'

// Generate a secure random secret for HMAC signing
function generateWebhookSecret(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const webhooksRouter = router({
  /**
   * List webhooks for the current user's organization
   */
  list: authenticatedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Verify user has access to the organization
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        })
      }

      // Get webhooks
      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch webhooks',
        })
      }

      return { data: webhooks }
    }),

  /**
   * Get a single webhook by ID
   */
  retrieve: authenticatedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      const { data: webhook, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', input.id)
        .single()

      if (error || !webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      // Verify user has access
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('id')
        .eq('organization_id', webhook.organization_id)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this webhook',
        })
      }

      return { data: webhook }
    }),

  /**
   * Create a new webhook
   */
  create: authenticatedProcedure
    .input(
      CreateWebhookInputSchema.extend({
        organizationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Verify user has admin role in organization
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('role')
        .eq('organization_id', input.organizationId)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment || !['owner', 'admin'].includes(roleAssignment.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to create webhooks',
        })
      }

      // Generate secret
      const secret = generateWebhookSecret()

      // Create webhook
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .insert({
          organization_id: input.organizationId,
          url: input.url,
          description: input.description,
          secret,
          events: input.events,
          retry_max_attempts: input.retry_max_attempts ?? 3,
          timeout_ms: input.timeout_ms ?? 10000,
          rate_limit_per_minute: input.rate_limit_per_minute,
          metadata: input.metadata ?? {},
          created_by: ctx.user.id,
        })
        .select()
        .single()

      if (error || !webhook) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create webhook',
        })
      }

      return {
        data: webhook,
        message: 'Webhook created successfully. Save the secret - it will not be shown again!',
      }
    }),

  /**
   * Update a webhook
   */
  update: authenticatedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: UpdateWebhookInputSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Get existing webhook
      const { data: existingWebhook, error: fetchError } = await supabase
        .from('webhooks')
        .select('organization_id')
        .eq('id', input.id)
        .single()

      if (fetchError || !existingWebhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      // Verify user has admin role
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('role')
        .eq('organization_id', existingWebhook.organization_id)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment || !['owner', 'admin'].includes(roleAssignment.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to update webhooks',
        })
      }

      // Update webhook
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .update({
          ...input.data,
          updated_by: ctx.user.id,
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error || !webhook) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update webhook',
        })
      }

      return { data: webhook }
    }),

  /**
   * Delete a webhook
   */
  delete: authenticatedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Get existing webhook
      const { data: existingWebhook, error: fetchError } = await supabase
        .from('webhooks')
        .select('organization_id')
        .eq('id', input.id)
        .single()

      if (fetchError || !existingWebhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      // Verify user has owner role
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('role')
        .eq('organization_id', existingWebhook.organization_id)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment || roleAssignment.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only organization owners can delete webhooks',
        })
      }

      // Delete webhook
      const { error } = await supabase.from('webhooks').delete().eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete webhook',
        })
      }

      return { success: true }
    }),

  /**
   * Get deliveries for a webhook
   */
  deliveries: authenticatedProcedure
    .input(
      z.object({
        webhookId: z.string().uuid(),
        filter: WebhookDeliveryFilterSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Get webhook and verify access
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('organization_id')
        .eq('id', input.webhookId)
        .single()

      if (webhookError || !webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      // Verify user has access
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('id')
        .eq('organization_id', webhook.organization_id)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this webhook',
        })
      }

      // Build query
      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', input.webhookId)

      // Apply filters
      if (input.filter?.event_type) {
        query = query.eq('event_type', input.filter.event_type)
      }
      if (input.filter?.status) {
        query = query.eq('status', input.filter.status)
      }

      // Apply pagination
      const limit = input.filter?.limit ?? 50
      const offset = input.filter?.offset ?? 0
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data: deliveries, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch webhook deliveries',
        })
      }

      return { data: deliveries }
    }),

  /**
   * Retry a failed webhook delivery
   */
  retryDelivery: authenticatedProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      )

      // Get delivery and verify access
      const { data: delivery, error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .select('webhook_id, status')
        .eq('id', input.deliveryId)
        .single()

      if (deliveryError || !delivery) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Delivery not found',
        })
      }

      // Get webhook
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('organization_id')
        .eq('id', delivery.webhook_id)
        .single()

      if (webhookError || !webhook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })
      }

      // Verify user has admin role
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('role')
        .eq('organization_id', webhook.organization_id)
        .eq('user_id', ctx.user.id)
        .single()

      if (!roleAssignment || !['owner', 'admin'].includes(roleAssignment.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to retry deliveries',
        })
      }

      // Update delivery status to retry
      const { error } = await supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          next_retry_at: new Date().toISOString(),
        })
        .eq('id', input.deliveryId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retry delivery',
        })
      }

      return { success: true, message: 'Delivery scheduled for retry' }
    }),

  /**
   * Get available webhook event types
   */
  eventTypes: authenticatedProcedure.query(async () => {
    return {
      data: WebhookEventType.options.map((type) => ({
        value: type,
        label: type
          .split('.')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        category: type.split('.')[0],
      })),
    }
  }),
})
