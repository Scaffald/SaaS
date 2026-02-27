// src/api/webhooks/ccpa.ts
// CCPA Compliance Implementation
//
// Webhook handler for CCPA requests from Scaffald.
// Handles export and deletion requests, contributing Forsured-specific data.

import { scaffaldClient } from '../../lib/scaffald/client';
import { logWebhookEvent } from '../../services/webhookLogService';
import {
  collectForsuredData,
  initializeForsuredDataCollector,
} from '../../lib/ccpa/forsured-data-collector';
import {
  handleCCPADeletion,
  initializeForsuredDeletionHandler,
} from '../../lib/ccpa/forsured-deletion-handler';
import type { CCPAWebhookPayload, CCPAWebhookEventType } from '../../lib/scaffald/types';

// App identification
const FORSURED_APP_ID = 'forsured';

/**
 * Verify webhook signature using HMAC-SHA256
 * In production, this should use the webhook_secret from the OAuth app registry
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.warn('[CCPA Webhook] Missing signature or secret');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    // Parse hex signature
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    );
  } catch (error) {
    console.error('[CCPA Webhook] Signature verification failed:', error);
    return false;
  }
}

/**
 * Handle export request webhook from Scaffald
 */
async function handleExportRequest(
  payload: CCPAWebhookPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any
): Promise<{ success: boolean; error?: string }> {
  const { request_id, user_id } = payload;

  console.log('[CCPA Webhook] Processing export request:', request_id, 'for user:', user_id);

  // Initialize the collector with Supabase client
  initializeForsuredDataCollector(supabaseClient);

  // Collect Forsured data
  const collectResult = await collectForsuredData(user_id);

  if (!collectResult.success || !collectResult.data) {
    return {
      success: false,
      error: collectResult.error?.message || 'Failed to collect data',
    };
  }

  // Contribute data to Scaffald
  const contribution = {
    app_id: collectResult.data.app_id,
    app_name: collectResult.data.app_name,
    exported_at: collectResult.data.exported_at,
    categories: collectResult.data.categories,
    total_records: collectResult.data.total_records,
  };

  const contributeResult = await scaffaldClient.ccpa.contributeExportData(
    request_id,
    FORSURED_APP_ID,
    contribution
  );

  return {
    success: contributeResult.success,
    error: contributeResult.success ? undefined : 'Failed to contribute data to Scaffald',
  };
}

/**
 * Handle deletion request webhook from Scaffald
 */
async function handleDeletionRequest(
  payload: CCPAWebhookPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any
): Promise<{ success: boolean; error?: string }> {
  const { request_id, user_id } = payload;

  console.log('[CCPA Webhook] Processing deletion request:', request_id, 'for user:', user_id);

  // Initialize the deletion handler with Supabase client
  initializeForsuredDeletionHandler(supabaseClient);

  // Process deletion
  const deletionResult = await handleCCPADeletion(user_id, request_id);

  if (!deletionResult.success || !deletionResult.data) {
    return {
      success: false,
      error: deletionResult.error?.message || 'Failed to process deletion',
    };
  }

  // Confirm deletion to Scaffald
  const confirmResult = await scaffaldClient.ccpa.confirmDeletion(
    request_id,
    FORSURED_APP_ID,
    deletionResult.data
  );

  return {
    success: confirmResult.success,
    error: confirmResult.success ? undefined : 'Failed to confirm deletion to Scaffald',
  };
}

/**
 * Handle opt-out request webhook from Scaffald
 */
async function handleOptOutRequest(
  payload: CCPAWebhookPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _supabaseClient: any
): Promise<{ success: boolean; error?: string }> {
  const { request_id, user_id, data } = payload;

  console.log('[CCPA Webhook] Processing opt-out request:', request_id, 'for user:', user_id);

  // For opt-out requests, we just need to acknowledge receipt
  // The actual opt-out is handled centrally by Scaffald
  // Forsured respects opt-out status by checking Scaffald before any data sharing

  console.log('[CCPA Webhook] Opt-out categories:', data?.categories);

  // Nothing to do locally - Forsured checks opt-out status via scaffaldClient.ccpa.getOptOutStatus()
  // before any data sharing operations

  return { success: true };
}

/**
 * Main CCPA webhook handler
 *
 * @param req - Incoming webhook request
 * @param supabaseClient - Supabase client for database operations
 * @returns Response
 */
export async function handleCCPAWebhook(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any
): Promise<Response> {
  // Get signature from headers
  const signature = req.headers.get('x-scaffald-ccpa-signature');

  // Read body as text for signature verification
  let bodyText: string;
  let payload: CCPAWebhookPayload;

  try {
    bodyText = await req.text();
    payload = JSON.parse(bodyText);
  } catch (error) {
    console.error('[CCPA Webhook] Failed to parse webhook body:', error);
    await logWebhookEvent({
      direction: 'inbound',
      action: 'CCPA_PARSE_ERROR',
      result: 'error',
      error_message: `Failed to parse body: ${error}`,
      entity_data: null,
    });
    return new Response('Invalid JSON body', { status: 400 });
  }

  // Get webhook secret from environment
  const webhookSecret = process.env.SCAFFALD_CCPA_WEBHOOK_SECRET || '';

  // Verify signature (skip in development if no secret configured)
  if (webhookSecret) {
    const isValid = await verifyWebhookSignature(bodyText, signature, webhookSecret);
    if (!isValid) {
      console.error('[CCPA Webhook] Invalid signature');
      await logWebhookEvent({
        direction: 'inbound',
        action: 'CCPA_SIGNATURE_VERIFICATION',
        result: 'error',
        error_message: 'Invalid signature',
        entity_data: payload,
      });
      return new Response('Invalid signature', { status: 401 });
    }
  } else {
    console.warn('[CCPA Webhook] No webhook secret configured - skipping signature verification');
  }

  // Validate payload structure
  if (!payload.event || !payload.request_id || !payload.user_id) {
    console.error('[CCPA Webhook] Invalid payload structure');
    await logWebhookEvent({
      direction: 'inbound',
      action: 'CCPA_INVALID_PAYLOAD',
      result: 'error',
      error_message: 'Missing required fields: event, request_id, user_id',
      entity_data: payload,
    });
    return new Response('Invalid payload', { status: 400 });
  }

  // Log incoming webhook
  console.log('[CCPA Webhook] Received event:', payload.event, 'request:', payload.request_id);

  let result: { success: boolean; error?: string };

  try {
    // Route to appropriate handler
    switch (payload.event as CCPAWebhookEventType) {
      case 'ccpa.export_requested':
        result = await handleExportRequest(payload, supabaseClient);
        break;

      case 'ccpa.deletion_requested':
        result = await handleDeletionRequest(payload, supabaseClient);
        break;

      case 'ccpa.opt_out_requested':
      case 'ccpa.opt_in_requested':
        result = await handleOptOutRequest(payload, supabaseClient);
        break;

      case 'ccpa.correction_requested':
        // Correction requests need manual handling - just acknowledge receipt
        console.log('[CCPA Webhook] Correction request received - requires manual processing');
        result = { success: true };
        break;

      default:
        console.warn('[CCPA Webhook] Unknown event type:', payload.event);
        await logWebhookEvent({
          direction: 'inbound',
          action: `CCPA_${payload.event}`,
          result: 'skipped',
          error_message: 'Unknown event type',
          entity_data: payload,
        });
        return new Response('Unknown event type', { status: 400 });
    }

    // Log result
    await logWebhookEvent({
      direction: 'inbound',
      action: `CCPA_${payload.event.toUpperCase()}`,
      result: result.success ? 'success' : 'error',
      error_message: result.error,
      entity_data: {
        request_id: payload.request_id,
        user_id: payload.user_id,
        event: payload.event,
      },
    });

    if (!result.success) {
      console.error('[CCPA Webhook] Handler failed:', result.error);
      return new Response(result.error || 'Processing failed', { status: 500 });
    }

    console.log('[CCPA Webhook] Successfully processed:', payload.event);
    return new Response('OK', { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CCPA Webhook] Unhandled error:', errorMessage);

    await logWebhookEvent({
      direction: 'inbound',
      action: `CCPA_${payload.event.toUpperCase()}`,
      result: 'error',
      error_message: errorMessage,
      entity_data: payload,
    });

    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

/**
 * Register Forsured with Scaffald's CCPA system
 * Should be called on app initialization
 */
export async function registerForsuredWithScaffald(): Promise<boolean> {
  try {
    const webhookUrl = `${process.env.VITE_APP_URL || ''}/api/webhooks/ccpa`;
    const webhookSecret = process.env.SCAFFALD_CCPA_WEBHOOK_SECRET || '';

    const result = await scaffaldClient.ccpa.registerDataCategories({
      app_id: FORSURED_APP_ID,
      app_name: 'Forsured Insurance Compliance',
      data_categories: [
        'insurance_policies',
        'compliance_records',
        'documents',
        'tasks',
        'projects',
        'broker_acknowledgements',
      ],
      webhook_url: webhookUrl,
      webhook_secret: webhookSecret,
    });

    console.log('[CCPA] Forsured registered with Scaffald:', result.success);
    return result.success;
  } catch (error) {
    console.error('[CCPA] Failed to register Forsured with Scaffald:', error);
    return false;
  }
}
