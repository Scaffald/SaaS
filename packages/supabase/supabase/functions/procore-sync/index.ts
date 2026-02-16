/**
 * Procore Sync Edge Function
 *
 * Supabase Edge Function (Deno runtime) that periodically syncs Procore data
 * for all connected integrations. Triggered by pg_cron (every 5 min) or
 * manually via HTTP POST.
 *
 * For each due integration:
 *   1. Refresh OAuth token if expired
 *   2. Fetch projects and vendors from Procore API
 *   3. Update already-linked records directly
 *   4. Stage new (unlinked) records in sync_queue with collision detection
 *   5. Compute next sync interval using adaptive backoff
 *   6. Log the sync operation
 *
 * Uses service_role key to bypass RLS.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Environment validation — hard fail if required vars are missing
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PROCORE_CLIENT_ID = Deno.env.get("PROCORE_CLIENT_ID");
const PROCORE_CLIENT_SECRET = Deno.env.get("PROCORE_CLIENT_SECRET");

if (!SUPABASE_URL) throw new Error("Missing required env var: SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing required env var: SUPABASE_SERVICE_ROLE_KEY");
if (!PROCORE_CLIENT_ID)
  throw new Error("Missing required env var: PROCORE_CLIENT_ID");
if (!PROCORE_CLIENT_SECRET)
  throw new Error("Missing required env var: PROCORE_CLIENT_SECRET");

// ---------------------------------------------------------------------------
// Adaptive backoff configuration
// ---------------------------------------------------------------------------

const MIN_INTERVAL = Number(
  Deno.env.get("PROCORE_SYNC_MIN_INTERVAL_MINUTES") ?? "15"
);
const MAX_INTERVAL = Number(
  Deno.env.get("PROCORE_SYNC_MAX_INTERVAL_MINUTES") ?? "10080"
);
const BACKOFF_MULTIPLIER = Number(
  Deno.env.get("PROCORE_SYNC_BACKOFF_MULTIPLIER") ?? "2"
);
const COOLDOWN_MULTIPLIER = Number(
  Deno.env.get("PROCORE_SYNC_COOLDOWN_MULTIPLIER") ?? "0.5"
);

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "forsured" },
});

// ---------------------------------------------------------------------------
// Token encryption helpers
// ---------------------------------------------------------------------------

/**
 * Simple base64 encoding for MVP -- tokens are already protected by RLS +
 * service role access only.
 *
 * TODO: Replace with proper Web Crypto API AES-256-GCM before production.
 * The implementation must be compatible with the Node.js AES-256-GCM
 * encrypt/decrypt in apps/forsured-web/src/server/lib/procore/crypto.ts
 * so that tokens encrypted by the tRPC server can be decrypted here and
 * vice versa. Use the INTEGRATION_ENCRYPTION_KEY env var as the shared key.
 */
function encryptToken(plaintext: string): string {
  return btoa(plaintext);
}

function decryptToken(encrypted: string): string {
  return atob(encrypted);
}

// ---------------------------------------------------------------------------
// Procore API helpers
// ---------------------------------------------------------------------------

interface TokenRefreshResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Refresh an expired Procore OAuth token.
 */
async function refreshProcoreToken(
  refreshTokenEncrypted: string
): Promise<TokenRefreshResult> {
  const refreshToken = decryptToken(refreshTokenEncrypted);

  const response = await fetch("https://login.procore.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: PROCORE_CLIENT_ID,
      client_secret: PROCORE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Procore token refresh failed (${response.status}): ${body}`
    );
  }

  return (await response.json()) as TokenRefreshResult;
}

/**
 * Paginate through a Procore API endpoint, collecting all results.
 */
async function paginateAll(
  basePath: string,
  accessToken: string,
  companyId: number
): Promise<unknown[]> {
  const all: unknown[] = [];
  let offset = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const sep = basePath.includes("?") ? "&" : "?";
    const url = `https://api.procore.com${basePath}${sep}limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Procore-Company-Id": String(companyId),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Procore API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    all.push(...data);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

// ---------------------------------------------------------------------------
// Adaptive backoff
// ---------------------------------------------------------------------------

function computeNextInterval(
  currentIntervalMinutes: number,
  changesDetected: boolean
): number {
  const multiplier = changesDetected ? COOLDOWN_MULTIPLIER : BACKOFF_MULTIPLIER;
  const raw = currentIntervalMinutes * multiplier;
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, raw));
}

// ---------------------------------------------------------------------------
// Integration type
// ---------------------------------------------------------------------------

interface Integration {
  id: string;
  user_id: string;
  organization_id: string;
  provider_company_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  sync_interval_minutes: number;
  metadata: Record<string, unknown> | null;
}

interface ProcoreProject {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface ProcoreVendor {
  id: number;
  name: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Sync one integration
// ---------------------------------------------------------------------------

interface SyncResult {
  integrationId: string;
  status: "completed" | "failed";
  projectsFound: number;
  projectsChanged: number;
  vendorsFound: number;
  vendorsChanged: number;
  newItemsQueued: number;
  updatesApplied: number;
  intervalBefore: number;
  intervalAfter: number;
  error?: string;
}

async function syncIntegration(
  integration: Integration
): Promise<SyncResult> {
  const intervalBefore = integration.sync_interval_minutes;
  let projectsFound = 0;
  let projectsChanged = 0;
  let vendorsFound = 0;
  let vendorsChanged = 0;
  let newItemsQueued = 0;
  let updatesApplied = 0;

  // -------------------------------------------------------------------------
  // Step 1: Ensure valid access token
  // -------------------------------------------------------------------------

  let accessToken: string;

  if (
    !integration.access_token_encrypted ||
    !integration.refresh_token_encrypted
  ) {
    throw new Error("Integration is missing encrypted tokens");
  }

  const tokenExpiresAt = integration.token_expires_at
    ? new Date(integration.token_expires_at)
    : null;
  const isExpired = !tokenExpiresAt || tokenExpiresAt <= new Date();

  if (isExpired) {
    // Refresh the token
    let tokenResult: TokenRefreshResult;
    try {
      tokenResult = await refreshProcoreToken(
        integration.refresh_token_encrypted
      );
    } catch (err) {
      // Token refresh failure is fatal for this integration
      await supabase
        .from("integrations")
        .update({
          status: "error",
          sync_error: `Token refresh failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        })
        .eq("id", integration.id);

      throw err;
    }

    // Store refreshed tokens
    accessToken = tokenResult.access_token;
    const newExpiresAt = new Date(
      Date.now() + tokenResult.expires_in * 1000
    ).toISOString();

    await supabase
      .from("integrations")
      .update({
        access_token_encrypted: encryptToken(tokenResult.access_token),
        refresh_token_encrypted: encryptToken(tokenResult.refresh_token),
        token_expires_at: newExpiresAt,
      })
      .eq("id", integration.id);
  } else {
    accessToken = decryptToken(integration.access_token_encrypted);
  }

  // -------------------------------------------------------------------------
  // Step 2: Determine the Procore company ID
  // -------------------------------------------------------------------------

  let companyId: number;

  if (integration.provider_company_id) {
    companyId = Number(integration.provider_company_id);
  } else if (
    integration.metadata &&
    Array.isArray((integration.metadata as Record<string, unknown>).companies) &&
    ((integration.metadata as Record<string, unknown>).companies as Array<{ id: number }>).length > 0
  ) {
    companyId = (
      (integration.metadata as Record<string, unknown>).companies as Array<{ id: number }>
    )[0].id;
  } else {
    throw new Error(
      "No Procore company ID found on integration or in metadata"
    );
  }

  // -------------------------------------------------------------------------
  // Step 3: Fetch projects from Procore
  // -------------------------------------------------------------------------

  const rawProjects = await paginateAll(
    `/rest/v1.1/projects?company_id=${companyId}`,
    accessToken,
    companyId
  );
  const procoreProjects = rawProjects as ProcoreProject[];
  projectsFound = procoreProjects.length;

  // -------------------------------------------------------------------------
  // Step 4: Fetch vendors from Procore
  // -------------------------------------------------------------------------

  const rawVendors = await paginateAll(
    `/rest/v1/company-vendors?company_id=${companyId}`,
    accessToken,
    companyId
  );
  const procoreVendors = rawVendors as ProcoreVendor[];
  vendorsFound = procoreVendors.length;

  // -------------------------------------------------------------------------
  // Step 5: Process projects — update linked, stage unlinked
  // -------------------------------------------------------------------------

  for (const project of procoreProjects) {
    const procoreId = String(project.id);

    // Check if already linked to a forsured project
    const { data: linkedProject } = await supabase
      .from("projects")
      .select("id, name")
      .eq("procore_id", procoreId)
      .maybeSingle();

    if (linkedProject) {
      // Already linked — update directly
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          procore_last_synced_at: new Date().toISOString(),
        })
        .eq("id", linkedProject.id);

      if (!updateErr) {
        updatesApplied++;
        projectsChanged++;
      }
    } else {
      // Not linked — check for exact name collision within the org
      const { data: nameMatch } = await supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", integration.organization_id)
        .eq("name", project.name)
        .is("procore_id", null)
        .maybeSingle();

      // Check if already queued (avoid duplicates)
      const { data: existingQueueItem } = await supabase
        .from("sync_queue")
        .select("id")
        .eq("integration_id", integration.id)
        .eq("entity_type", "project")
        .eq("provider_entity_id", procoreId)
        .eq("resolution", "pending")
        .maybeSingle();

      if (!existingQueueItem) {
        const queueEntry: Record<string, unknown> = {
          integration_id: integration.id,
          user_id: integration.user_id,
          organization_id: integration.organization_id,
          entity_type: "project",
          provider_entity_id: procoreId,
          provider_data: project,
          resolution: "pending",
        };

        if (nameMatch) {
          queueEntry.match_status = "exact_match";
          queueEntry.matched_entity_id = nameMatch.id;
          queueEntry.match_confidence = 1.0;
          queueEntry.match_reason = "name_exact";
        } else {
          queueEntry.match_status = "no_match";
        }

        const { error: insertErr } = await supabase
          .from("sync_queue")
          .insert(queueEntry);

        if (!insertErr) {
          newItemsQueued++;
          projectsChanged++;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 6: Process vendors — update linked, stage unlinked
  // -------------------------------------------------------------------------

  for (const vendor of procoreVendors) {
    const procoreVendorId = String(vendor.id);

    // Check if already linked to a forsured subcontractor
    const { data: linkedVendor } = await supabase
      .from("subcontractors")
      .select("id, name")
      .eq("procore_vendor_id", procoreVendorId)
      .maybeSingle();

    if (linkedVendor) {
      // Already linked — update directly
      const { error: updateErr } = await supabase
        .from("subcontractors")
        .update({
          procore_last_synced_at: new Date().toISOString(),
        })
        .eq("id", linkedVendor.id);

      if (!updateErr) {
        updatesApplied++;
        vendorsChanged++;
      }
    } else {
      // Not linked — check for exact name collision within the org
      const { data: nameMatch } = await supabase
        .from("subcontractors")
        .select("id, name")
        .eq("organization_id", integration.organization_id)
        .eq("name", vendor.name)
        .is("procore_vendor_id", null)
        .maybeSingle();

      // Check if already queued
      const { data: existingQueueItem } = await supabase
        .from("sync_queue")
        .select("id")
        .eq("integration_id", integration.id)
        .eq("entity_type", "subcontractor")
        .eq("provider_entity_id", procoreVendorId)
        .eq("resolution", "pending")
        .maybeSingle();

      if (!existingQueueItem) {
        const queueEntry: Record<string, unknown> = {
          integration_id: integration.id,
          user_id: integration.user_id,
          organization_id: integration.organization_id,
          entity_type: "subcontractor",
          provider_entity_id: procoreVendorId,
          provider_data: vendor,
          resolution: "pending",
        };

        if (nameMatch) {
          queueEntry.match_status = "exact_match";
          queueEntry.matched_entity_id = nameMatch.id;
          queueEntry.match_confidence = 1.0;
          queueEntry.match_reason = "name_exact";
        } else {
          queueEntry.match_status = "no_match";
        }

        const { error: insertErr } = await supabase
          .from("sync_queue")
          .insert(queueEntry);

        if (!insertErr) {
          newItemsQueued++;
          vendorsChanged++;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 7: Compute adaptive interval
  // -------------------------------------------------------------------------

  const changesDetected =
    projectsChanged > 0 || vendorsChanged > 0;
  const intervalAfter = computeNextInterval(intervalBefore, changesDetected);

  // -------------------------------------------------------------------------
  // Step 8: Update integration row
  // -------------------------------------------------------------------------

  const now = new Date();
  const nextSyncAt = new Date(
    now.getTime() + intervalAfter * 60 * 1000
  ).toISOString();

  const integrationUpdate: Record<string, unknown> = {
    last_sync_at: now.toISOString(),
    sync_interval_minutes: intervalAfter,
    next_sync_at: nextSyncAt,
    sync_error: null,
  };

  if (changesDetected) {
    integrationUpdate.last_change_detected_at = now.toISOString();
  }

  await supabase
    .from("integrations")
    .update(integrationUpdate)
    .eq("id", integration.id);

  return {
    integrationId: integration.id,
    status: "completed",
    projectsFound,
    projectsChanged,
    vendorsFound,
    vendorsChanged,
    newItemsQueued,
    updatesApplied,
    intervalBefore,
    intervalAfter,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST (from pg_cron or manual trigger)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startedAt = new Date();
  const results: SyncResult[] = [];
  const errors: Array<{ integrationId: string; error: string }> = [];

  try {
    // Query integrations due for sync
    const { data: integrations, error: queryError } = await supabase
      .from("integrations")
      .select(
        "id, user_id, organization_id, provider_company_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, sync_interval_minutes, metadata"
      )
      .eq("status", "connected")
      .eq("provider", "procore")
      .or(`next_sync_at.is.null,next_sync_at.lte.${startedAt.toISOString()}`)
      .order("next_sync_at", { ascending: true, nullsFirst: true })
      .limit(10);

    if (queryError) {
      return new Response(
        JSON.stringify({
          error: "Failed to query integrations",
          details: queryError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No integrations due for sync",
          processedAt: startedAt.toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process each integration independently — one failure must not block others
    for (const integration of integrations as Integration[]) {
      // Determine trigger type for the sync_log
      const triggeredBy =
        integration.sync_interval_minutes === 15 &&
        !integration.token_expires_at
          ? "initial"
          : "scheduled";

      // Create sync_log entry (status = 'running')
      const { data: logEntry } = await supabase
        .from("sync_log")
        .insert({
          integration_id: integration.id,
          triggered_by: triggeredBy,
          started_at: new Date().toISOString(),
          status: "running",
          interval_before_minutes: integration.sync_interval_minutes,
        })
        .select("id")
        .single();

      const logId = logEntry?.id;

      try {
        const result = await syncIntegration(integration);
        results.push(result);

        // Update sync_log as completed
        if (logId) {
          await supabase
            .from("sync_log")
            .update({
              completed_at: new Date().toISOString(),
              status: "completed",
              projects_found: result.projectsFound,
              projects_changed: result.projectsChanged,
              vendors_found: result.vendorsFound,
              vendors_changed: result.vendorsChanged,
              new_items_queued: result.newItemsQueued,
              updates_applied: result.updatesApplied,
              interval_after_minutes: result.intervalAfter,
            })
            .eq("id", logId);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);

        errors.push({
          integrationId: integration.id,
          error: errorMessage,
        });

        // Update sync_log as failed
        if (logId) {
          await supabase
            .from("sync_log")
            .update({
              completed_at: new Date().toISOString(),
              status: "failed",
              error_message: errorMessage,
            })
            .eq("id", logId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        processedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        integrationsProcessed: integrations.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // Catch-all for unexpected errors in the main loop
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        error: "Unexpected error in procore-sync function",
        details: errorMessage,
        processedAt: startedAt.toISOString(),
        results,
        errors,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
