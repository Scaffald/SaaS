/**
 * Global Privacy Control (GPC) Service
 *
 * Implements GPC signal detection and processing for CCPA compliance.
 * Under CCPA, businesses must honor GPC signals as valid opt-out requests.
 *
 * GPC is a browser/extension setting that sends the Sec-GPC: 1 header
 * to indicate the user doesn't want their data sold or shared.
 *
 * @see https://globalprivacycontrol.org/
 * @see https://oag.ca.gov/privacy/ccpa
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types.ts'

type DbClient = SupabaseClient<Database>

// ========================================================
// GPC CONFIGURATION
// ========================================================

/**
 * GPC-related constants and configuration
 */
export const GPC_CONFIG = {
  /** Header name for GPC signal */
  HEADER_NAME: 'Sec-GPC',

  /** Expected header value when GPC is enabled */
  ENABLED_VALUE: '1',

  /** Source identifier for GPC-based opt-outs */
  SOURCE: 'gpc',

  /** Categories that GPC applies to under CCPA */
  APPLICABLE_CATEGORIES: ['sale', 'sharing'] as const,

  /** All CCPA opt-out categories */
  ALL_CATEGORIES: ['sale', 'sharing', 'targeted_advertising', 'profiling'] as const,
} as const

export type GPCCategory = (typeof GPC_CONFIG.APPLICABLE_CATEGORIES)[number]
export type OptOutCategory = (typeof GPC_CONFIG.ALL_CATEGORIES)[number]

// ========================================================
// TYPES
// ========================================================

/**
 * GPC signal detection result
 */
export interface GPCSignalResult {
  detected: boolean
  headerValue: string | null
  timestamp: string
}

/**
 * GPC opt-out processing result
 */
export interface GPCOptOutResult {
  success: boolean
  processed: boolean
  categories: string[]
  alreadyOptedOut: boolean
  error?: string
}

/**
 * User's GPC status
 */
export interface GPCStatus {
  hasGPCOptOut: boolean
  gpcOptedOutAt: string | null
  categories: Array<{
    category: string
    optedOut: boolean
    source: string | null
    optedOutAt: string | null
  }>
}

// ========================================================
// GPC SIGNAL DETECTION
// ========================================================

/**
 * Detect GPC signal from request headers
 *
 * The GPC signal is sent via the Sec-GPC header with a value of "1".
 * This function checks for the presence and value of this header.
 *
 * @param headers - Request headers (from Deno.Request or similar)
 * @returns Detection result with signal status
 */
export function detectGPCSignal(headers: Headers): GPCSignalResult {
  const gpcValue = headers.get(GPC_CONFIG.HEADER_NAME)

  return {
    detected: gpcValue === GPC_CONFIG.ENABLED_VALUE,
    headerValue: gpcValue,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check if a header value indicates GPC is enabled
 */
export function isGPCEnabled(headerValue: string | null): boolean {
  return headerValue === GPC_CONFIG.ENABLED_VALUE
}

// ========================================================
// GPC OPT-OUT PROCESSING
// ========================================================

/**
 * Process a GPC signal for a user
 *
 * When a GPC signal is detected, this function:
 * 1. Checks if the user already has GPC-based opt-outs
 * 2. Creates opt-out records for applicable categories
 * 3. Records the GPC source for audit purposes
 *
 * Under CCPA, GPC must be honored for:
 * - Sale of personal information
 * - Sharing of personal information (for cross-context behavioral advertising)
 *
 * @param supabase - Database client
 * @param userId - User's ID
 * @param signal - GPC detection result
 * @returns Processing result
 */
export async function processGPCSignal(
  supabase: DbClient,
  userId: string,
  signal: GPCSignalResult
): Promise<GPCOptOutResult> {
  if (!signal.detected) {
    return {
      success: true,
      processed: false,
      categories: [],
      alreadyOptedOut: false,
    }
  }

  try {
    // Check existing GPC opt-outs
    const { data: existingOptOuts, error: queryError } = await supabase
      .schema('core')
      .from('ccpa_opt_outs')
      .select('category')
      .eq('user_id', userId)
      .eq('source', GPC_CONFIG.SOURCE)
      .in('category', [...GPC_CONFIG.APPLICABLE_CATEGORIES])

    if (queryError) {
      console.error('[gpc] Failed to check existing opt-outs:', queryError)
      return {
        success: false,
        processed: false,
        categories: [],
        alreadyOptedOut: false,
        error: queryError.message,
      }
    }

    const existingCategories = new Set(
      (existingOptOuts ?? []).map((o: { category: string }) => o.category)
    )

    // Check if all GPC categories are already opted out
    const allAlreadyOptedOut = GPC_CONFIG.APPLICABLE_CATEGORIES.every(
      (cat) => existingCategories.has(cat)
    )

    if (allAlreadyOptedOut) {
      return {
        success: true,
        processed: false,
        categories: [...GPC_CONFIG.APPLICABLE_CATEGORIES],
        alreadyOptedOut: true,
      }
    }

    // Create opt-out records for categories not yet opted out
    const categoriesToOptOut = GPC_CONFIG.APPLICABLE_CATEGORIES.filter(
      (cat) => !existingCategories.has(cat)
    )

    const optOutRecords = categoriesToOptOut.map((category) => ({
      user_id: userId,
      category,
      source: GPC_CONFIG.SOURCE,
      opted_out_at: signal.timestamp,
    }))

    const { error: insertError } = await supabase
      .schema('core')
      .from('ccpa_opt_outs')
      .upsert(optOutRecords, {
        onConflict: 'user_id,category',
        ignoreDuplicates: false,
      })

    if (insertError) {
      console.error('[gpc] Failed to create opt-out records:', insertError)
      return {
        success: false,
        processed: false,
        categories: [],
        alreadyOptedOut: false,
        error: insertError.message,
      }
    }

    // Log GPC processing event
    await logGPCEvent(supabase, userId, 'opt_out', {
      categories: categoriesToOptOut,
      signal,
    })

    console.log(
      `[gpc] Processed GPC signal for user ${userId}: opted out of ${categoriesToOptOut.join(', ')}`
    )

    return {
      success: true,
      processed: true,
      categories: categoriesToOptOut,
      alreadyOptedOut: false,
    }
  } catch (error) {
    console.error('[gpc] Error processing GPC signal:', error)
    return {
      success: false,
      processed: false,
      categories: [],
      alreadyOptedOut: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check and process GPC signal in a single operation
 *
 * Convenience function that combines detection and processing.
 * Use this when you have request headers available.
 */
export async function checkAndProcessGPC(
  supabase: DbClient,
  userId: string,
  headers: Headers
): Promise<GPCOptOutResult> {
  const signal = detectGPCSignal(headers)
  return processGPCSignal(supabase, userId, signal)
}

// ========================================================
// GPC STATUS QUERIES
// ========================================================

/**
 * Get GPC opt-out status for a user
 *
 * Returns whether the user has GPC-based opt-outs and details
 * about each category.
 */
export async function getGPCStatus(
  supabase: DbClient,
  userId: string
): Promise<GPCStatus> {
  try {
    const { data: optOuts, error } = await supabase
      .schema('core')
      .from('ccpa_opt_outs')
      .select('category, source, opted_out_at')
      .eq('user_id', userId)

    if (error) {
      console.error('[gpc] Failed to get GPC status:', error)
      return {
        hasGPCOptOut: false,
        gpcOptedOutAt: null,
        categories: GPC_CONFIG.ALL_CATEGORIES.map((cat) => ({
          category: cat,
          optedOut: false,
          source: null,
          optedOutAt: null,
        })),
      }
    }

    const optOutMap = new Map(
      (optOuts ?? []).map((o: { category: string; source: string; opted_out_at: string }) => [
        o.category,
        o,
      ])
    )

    // Find GPC-specific opt-outs
    const gpcOptOuts = (optOuts ?? []).filter(
      (o: { source: string }) => o.source === GPC_CONFIG.SOURCE
    )
    const hasGPCOptOut = gpcOptOuts.length > 0
    const gpcOptedOutAt = gpcOptOuts.length > 0
      ? gpcOptOuts.reduce(
          (earliest: string | null, o: { opted_out_at: string }) =>
            !earliest || o.opted_out_at < earliest ? o.opted_out_at : earliest,
          null as string | null
        )
      : null

    return {
      hasGPCOptOut,
      gpcOptedOutAt,
      categories: GPC_CONFIG.ALL_CATEGORIES.map((cat) => {
        const optOut = optOutMap.get(cat)
        return {
          category: cat,
          optedOut: !!optOut,
          source: optOut?.source ?? null,
          optedOutAt: optOut?.opted_out_at ?? null,
        }
      }),
    }
  } catch (error) {
    console.error('[gpc] Error getting GPC status:', error)
    return {
      hasGPCOptOut: false,
      gpcOptedOutAt: null,
      categories: GPC_CONFIG.ALL_CATEGORIES.map((cat) => ({
        category: cat,
        optedOut: false,
        source: null,
        optedOutAt: null,
      })),
    }
  }
}

/**
 * Check if user has honored GPC opt-out
 *
 * Returns true if the user has GPC-based opt-outs for
 * the required categories (sale and sharing).
 */
export async function hasHonoredGPC(
  supabase: DbClient,
  userId: string
): Promise<boolean> {
  const status = await getGPCStatus(supabase, userId)
  return status.hasGPCOptOut
}

// ========================================================
// GPC AUDIT LOGGING
// ========================================================

/**
 * Log a GPC-related event for audit purposes
 *
 * Records GPC signal detection and processing for compliance.
 */
async function logGPCEvent(
  supabase: DbClient,
  userId: string,
  eventType: 'detection' | 'opt_out' | 'status_check',
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .schema('core')
      .from('ccpa_audit_log')
      .insert({
        user_id: userId,
        event_type: `gpc_${eventType}`,
        event_details: {
          ...details,
          logged_at: new Date().toISOString(),
        },
      })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.warn('[gpc] Failed to log GPC event:', error)
  }
}

// ========================================================
// GPC MIDDLEWARE HELPER
// ========================================================

/**
 * Create GPC middleware context
 *
 * This helper can be used to inject GPC processing into
 * tRPC context or other middleware.
 */
export function createGPCContext(headers: Headers) {
  const signal = detectGPCSignal(headers)

  return {
    gpcEnabled: signal.detected,
    gpcSignal: signal,
    async processGPC(supabase: DbClient, userId: string): Promise<GPCOptOutResult> {
      return processGPCSignal(supabase, userId, signal)
    },
  }
}

// ========================================================
// GPC COMPLIANCE HELPERS
// ========================================================

/**
 * Generate GPC disclosure text for privacy policy
 *
 * Returns standardized text explaining GPC support.
 */
export function getGPCDisclosureText(): string {
  return `
## Global Privacy Control (GPC)

We honor the Global Privacy Control (GPC) signal. When we detect that your browser or device has GPC enabled, we will automatically opt you out of:

- **Sale of Personal Information**: We will not sell your personal information to third parties.
- **Sharing for Cross-Context Behavioral Advertising**: We will not share your personal information for targeted advertising purposes.

GPC is a browser setting or extension that automatically sends a signal to websites you visit. To enable GPC:
- Use a browser that supports GPC natively (such as Firefox, Brave, or DuckDuckGo)
- Install a GPC-compatible browser extension
- Enable the GPC setting in your browser's privacy settings

Learn more at [Global Privacy Control](https://globalprivacycontrol.org/).

Under the California Consumer Privacy Act (CCPA), we are required to treat GPC signals as valid opt-out requests.
`.trim()
}

/**
 * Get GPC status for Do Not Sell page
 *
 * Returns information suitable for displaying on a "Do Not Sell My Personal Information" page.
 */
export async function getDoNotSellPageStatus(
  supabase: DbClient,
  userId: string | null,
  headers: Headers
): Promise<{
  gpcDetected: boolean
  userOptedOut: boolean
  gpcOptedOut: boolean
  categories: Array<{
    category: string
    label: string
    optedOut: boolean
    source: string | null
  }>
}> {
  const signal = detectGPCSignal(headers)

  const categoryLabels: Record<string, string> = {
    sale: 'Sale of Personal Information',
    sharing: 'Sharing for Cross-Context Behavioral Advertising',
    targeted_advertising: 'Targeted Advertising',
    profiling: 'Automated Profiling',
  }

  if (!userId) {
    return {
      gpcDetected: signal.detected,
      userOptedOut: false,
      gpcOptedOut: false,
      categories: GPC_CONFIG.ALL_CATEGORIES.map((cat) => ({
        category: cat,
        label: categoryLabels[cat] ?? cat,
        optedOut: false,
        source: null,
      })),
    }
  }

  const status = await getGPCStatus(supabase, userId)

  return {
    gpcDetected: signal.detected,
    userOptedOut: status.categories.some((c) => c.optedOut),
    gpcOptedOut: status.hasGPCOptOut,
    categories: status.categories.map((c) => ({
      category: c.category,
      label: categoryLabels[c.category] ?? c.category,
      optedOut: c.optedOut,
      source: c.source,
    })),
  }
}
