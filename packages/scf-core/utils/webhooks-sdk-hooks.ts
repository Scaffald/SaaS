/**
 * Webhooks Management SDK hooks. Use these instead of api.webhooks.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  CreateWebhookParams,
  UpdateWebhookParams,
  ListDeliveriesParams,
  WebhookResponse,
  WebhookCreatedResponse,
  RetryDeliveryResponse,
  DeleteWebhookResponse,
} from '@scaffald/sdk'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** List all webhooks for the user's organization */
export function useWebhooks(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['webhooks', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.list()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get a single webhook by ID */
export function useWebhook(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['webhooks', 'retrieve', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.webhooks.retrieve(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** List deliveries for a webhook */
export function useWebhookDeliveries(
  webhookId: string | undefined,
  params?: ListDeliveriesParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['webhooks', 'deliveries', webhookId, params],
    queryFn: async () => {
      if (!client || !webhookId) throw new Error('Missing client or webhookId')
      return client.webhooks.listDeliveries(webhookId, params)
    },
    enabled: !!client && !!webhookId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute - delivery status changes frequently
  })
}

/** Get available webhook event types */
export function useWebhookEventTypes(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['webhooks', 'event-types'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.eventTypes()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 60 * 1000, // 1 hour - event types rarely change
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Create a new webhook */
export function useCreateWebhookMutation(
  options?: UseMutationOptions<WebhookCreatedResponse, Error, CreateWebhookParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateWebhookParams) => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.create(params)
    },
    ...options,
  })
}

/** Update a webhook */
export function useUpdateWebhookMutation(
  options?: UseMutationOptions<WebhookResponse, Error, { id: string; params: UpdateWebhookParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateWebhookParams }) => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.update(id, params)
    },
    ...options,
  })
}

/** Delete a webhook */
export function useDeleteWebhookMutation(
  options?: UseMutationOptions<DeleteWebhookResponse, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.delete(id)
    },
    ...options,
  })
}

/** Retry a failed webhook delivery */
export function useRetryDeliveryMutation(
  options?: UseMutationOptions<RetryDeliveryResponse, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (deliveryId: string) => {
      if (!client) throw new Error('Missing client')
      return client.webhooks.retryDelivery(deliveryId)
    },
    ...options,
  })
}
