/**
 * Procore Integration Router
 *
 * tRPC router with 9 procedures for managing Procore OAuth integration,
 * sync triggering, sync log viewing, and sync queue conflict resolution.
 *
 * Uses:
 *   - ProcoreClient for OAuth and API calls
 *   - encrypt/decrypt for token-at-rest security
 *   - canManualSync/minutesUntilManualSync for debounced manual syncs
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import { ProcoreClient } from '../../lib/procore/client';
import { encrypt } from '../../lib/procore/crypto';
import {
  canManualSync,
  minutesUntilManualSync,
} from '../../lib/procore/adaptive-backoff';

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------
const procoreClientSecret = process.env.PROCORE_CLIENT_SECRET;
if (!procoreClientSecret) {
  throw new Error('Missing required env var: PROCORE_CLIENT_SECRET');
}

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------
const procoreClient = new ProcoreClient();

// ---------------------------------------------------------------------------
// CSRF State Token Helpers
// ---------------------------------------------------------------------------

/**
 * Create a signed CSRF state token for the OAuth authorize redirect.
 *
 * Payload: base64url( JSON({ userId, exp, nonce }) ) + "." + base64url( HMAC-SHA256 )
 */
function createStateToken(userId: string): string {
  const nonce = randomBytes(16).toString('hex');
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = JSON.stringify({ userId, exp, nonce });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', procoreClientSecret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a state token: check HMAC, expiry, and userId match.
 *
 * @throws TRPCError if any verification step fails.
 */
function verifyStateToken(state: string, expectedUserId: string): void {
  const parts = state.split('.');
  if (parts.length !== 2) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid state token format',
    });
  }

  const [payloadB64, sig] = parts;

  // Verify HMAC
  const expectedSig = createHmac('sha256', procoreClientSecret)
    .update(payloadB64)
    .digest();
  const actualSig = Buffer.from(sig, 'base64url');

  if (
    expectedSig.length !== actualSig.length ||
    !timingSafeEqual(expectedSig, actualSig)
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid state token signature',
    });
  }

  // Decode payload
  let payload: { userId: string; exp: number; nonce: string };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Malformed state token payload',
    });
  }

  // Check expiry
  if (Date.now() > payload.exp) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'State token has expired',
    });
  }

  // Check userId
  if (payload.userId !== expectedUserId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'State token does not match current user',
    });
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const procoreRouter = createTRPCRouter({
  // -----------------------------------------------------------------------
  // 1. connect — build OAuth authorize URL with signed CSRF state
  // -----------------------------------------------------------------------
  connect: protectedProcedure.mutation(async ({ ctx }) => {
    const state = createStateToken(ctx.userId);
    const url = procoreClient.getAuthorizationUrl(state);
    return { url, state };
  }),

  // -----------------------------------------------------------------------
  // 2. callback — exchange code, store encrypted tokens, upsert integration
  // -----------------------------------------------------------------------
  callback: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1, 'Authorization code is required'),
        state: z.string().min(1, 'State token is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate CSRF state
      verifyStateToken(input.state, ctx.userId);

      // Exchange authorization code for tokens
      let tokenResponse;
      try {
        tokenResponse = await procoreClient.exchangeCode(input.code);
      } catch (err) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Failed to exchange authorization code with Procore',
          cause: err,
        });
      }

      // Fetch user info and companies from Procore
      let procoreUser;
      let procoreCompanies;
      try {
        [procoreUser, procoreCompanies] = await Promise.all([
          procoreClient.fetchMe(tokenResponse.access_token),
          procoreClient.fetchCompanies(tokenResponse.access_token),
        ]);
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Procore account information',
          cause: err,
        });
      }

      // Encrypt tokens for at-rest storage
      const encryptedAccessToken = encrypt(tokenResponse.access_token);
      const encryptedRefreshToken = encrypt(tokenResponse.refresh_token);

      // Upsert integration record (on conflict: user_id + provider)
      const { data, error } = await forsured('integrations')
        .upsert(
          {
            user_id: ctx.userId,
            provider: 'procore',
            status: 'connected',
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: encryptedRefreshToken,
            token_expires_at: new Date(
              Date.now() + tokenResponse.expires_in * 1000,
            ).toISOString(),
            provider_user_id: String(procoreUser.id),
            provider_user_name: procoreUser.name || procoreUser.login,
            provider_metadata: {
              companies: procoreCompanies.map((c) => ({
                id: c.id,
                name: c.name,
              })),
            },
            next_sync_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,provider' },
        )
        .select('id')
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save Procore integration',
          cause: error,
        });
      }

      return { integrationId: data.id };
    }),

  // -----------------------------------------------------------------------
  // 3. disconnect — soft-disconnect (clear tokens, keep synced data)
  // -----------------------------------------------------------------------
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await forsured('integrations')
      .update({
        status: 'disconnected',
        encrypted_access_token: null,
        encrypted_refresh_token: null,
        token_expires_at: null,
        next_sync_at: null,
      })
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore');

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to disconnect Procore integration',
        cause: error,
      });
    }

    return { disconnected: true };
  }),

  // -----------------------------------------------------------------------
  // 4. getStatus — current integration status with computed sync fields
  // -----------------------------------------------------------------------
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await forsured('integrations')
      .select(
        'id, status, provider_user_name, provider_metadata, last_synced_at, next_sync_at, manual_sync_requested_at, created_at, updated_at',
      )
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore')
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Procore integration status',
        cause: error,
      });
    }

    if (!data) {
      return null;
    }

    const lastManualSync = data.manual_sync_requested_at
      ? new Date(data.manual_sync_requested_at)
      : null;

    return {
      ...data,
      canManualSync: canManualSync(lastManualSync),
      minutesUntilManualSync: minutesUntilManualSync(lastManualSync),
    };
  }),

  // -----------------------------------------------------------------------
  // 5. triggerSync — request an immediate sync (debounced)
  // -----------------------------------------------------------------------
  triggerSync: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: integration, error: fetchError } = await forsured(
      'integrations',
    )
      .select('id, status, manual_sync_requested_at')
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore')
      .maybeSingle();

    if (fetchError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch integration for sync',
        cause: fetchError,
      });
    }

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Procore integration found',
      });
    }

    if (integration.status !== 'connected') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Procore integration is not connected',
      });
    }

    // Debounce check
    const lastManualSync = integration.manual_sync_requested_at
      ? new Date(integration.manual_sync_requested_at)
      : null;

    if (!canManualSync(lastManualSync)) {
      const remaining = minutesUntilManualSync(lastManualSync);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Please wait ${Math.ceil(remaining)} minute(s) before requesting another sync`,
      });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await forsured('integrations')
      .update({
        next_sync_at: now,
        manual_sync_requested_at: now,
      })
      .eq('id', integration.id);

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to schedule sync',
        cause: updateError,
      });
    }

    return { triggered: true };
  }),

  // -----------------------------------------------------------------------
  // 6. getSyncLog — paginated sync history
  // -----------------------------------------------------------------------
  getSyncLog: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get integration ID first
      const { data: integration, error: integrationError } = await forsured(
        'integrations',
      )
        .select('id')
        .eq('user_id', ctx.userId)
        .eq('provider', 'procore')
        .maybeSingle();

      if (integrationError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch integration',
          cause: integrationError,
        });
      }

      if (!integration) {
        return { logs: [], total: 0 };
      }

      const { data, error, count } = await forsured('sync_log')
        .select('*', { count: 'exact' })
        .eq('integration_id', integration.id)
        .order('started_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sync log',
          cause: error,
        });
      }

      return {
        logs: data || [],
        total: count || 0,
      };
    }),

  // -----------------------------------------------------------------------
  // 7. getSyncQueue — pending conflict items for current user
  // -----------------------------------------------------------------------
  getSyncQueue: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await forsured('sync_queue')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('resolution', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sync queue',
        cause: error,
      });
    }

    return data || [];
  }),

  // -----------------------------------------------------------------------
  // 8. resolveSyncItem — resolve a single conflict queue item
  // -----------------------------------------------------------------------
  resolveSyncItem: protectedProcedure
    .input(
      z.object({
        queueItemId: z.string().uuid('Queue item ID must be a valid UUID'),
        resolution: z.enum(['link', 'create_new', 'skip']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await resolveOneItem(ctx.userId, input.queueItemId, input.resolution);
      return { success: true };
    }),

  // -----------------------------------------------------------------------
  // 9. resolveSyncBatch — resolve multiple conflict queue items at once
  // -----------------------------------------------------------------------
  resolveSyncBatch: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              queueItemId: z.string().uuid(),
              resolution: z.enum(['link', 'create_new', 'skip']),
            }),
          )
          .min(1)
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const item of input.items) {
        try {
          await resolveOneItem(ctx.userId, item.queueItemId, item.resolution);
          results.push({ id: item.queueItemId, success: true });
        } catch (err) {
          const message =
            err instanceof TRPCError
              ? err.message
              : 'Unknown error resolving item';
          results.push({
            id: item.queueItemId,
            success: false,
            error: message,
          });
        }
      }

      return { results };
    }),
});

// ---------------------------------------------------------------------------
// Shared resolution logic
// ---------------------------------------------------------------------------

/**
 * Resolve a single sync queue item.
 *
 * - 'link': update matched forsured record with Procore ID
 * - 'create_new': insert a new forsured record from provider_data
 * - 'skip': no data change, just mark resolved
 */
async function resolveOneItem(
  userId: string,
  queueItemId: string,
  resolution: 'link' | 'create_new' | 'skip',
): Promise<void> {
  // Fetch the queue item and verify ownership
  const { data: queueItem, error: fetchError } = await forsured('sync_queue')
    .select('*')
    .eq('id', queueItemId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !queueItem) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Sync queue item not found or does not belong to you',
    });
  }

  if (queueItem.resolution !== 'pending') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'This sync queue item has already been resolved',
    });
  }

  const providerData = queueItem.provider_data;
  const entityType: string = queueItem.entity_type;
  const now = new Date().toISOString();

  if (resolution === 'link') {
    // Update the matched forsured record with the procore ID
    if (!queueItem.matched_entity_id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot link: no matched entity found for this queue item',
      });
    }

    if (entityType === 'project') {
      const { error } = await forsured('projects')
        .update({
          procore_id: String(providerData.id),
          procore_last_synced_at: now,
        })
        .eq('id', queueItem.matched_entity_id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to link project to Procore',
          cause: error,
        });
      }
    } else if (entityType === 'subcontractor' || entityType === 'vendor') {
      const { error } = await forsured('subcontractors')
        .update({
          procore_vendor_id: String(providerData.id),
          procore_last_synced_at: now,
        })
        .eq('id', queueItem.matched_entity_id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to link subcontractor to Procore',
          cause: error,
        });
      }
    }
  } else if (resolution === 'create_new') {
    if (entityType === 'project') {
      const { error } = await forsured('projects').insert({
        name: providerData.name,
        organization_id: queueItem.organization_id,
        procore_id: String(providerData.id),
        procore_last_synced_at: now,
      });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project from Procore data',
          cause: error,
        });
      }
    } else if (entityType === 'subcontractor' || entityType === 'vendor') {
      const { error } = await forsured('subcontractors').insert({
        name: providerData.name,
        company: providerData.name,
        organization_id: queueItem.organization_id,
        procore_vendor_id: String(providerData.id),
        procore_last_synced_at: now,
      });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create subcontractor from Procore data',
          cause: error,
        });
      }
    }
  }
  // 'skip' resolution: no data changes needed

  // Mark queue item as resolved
  const { error: resolveError } = await forsured('sync_queue')
    .update({
      resolution,
      resolved_by: userId,
      resolved_at: now,
    })
    .eq('id', queueItemId);

  if (resolveError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to mark sync queue item as resolved',
      cause: resolveError,
    });
  }
}
