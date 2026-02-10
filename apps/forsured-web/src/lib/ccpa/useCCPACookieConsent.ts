/**
 * CCPA Cookie Consent Integration Hook
 * CCPA Compliance Implementation - TASK-21
 *
 * Provides integration between cookie consent UI and CCPA opt-out system:
 * - GPC (Global Privacy Control) signal detection
 * - Cookie category to CCPA opt-out mapping
 * - Automatic opt-out on GPC detection
 * - Bidirectional sync between cookie preferences and CCPA opt-outs
 */

import type {
  ConsentType,
  ConsentStatus,
  CCPAServiceResponse,
} from './types';

// Cookie category IDs matching the UI library
export type CookieCategoryId =
  | 'strictly-necessary'
  | 'functional'
  | 'performance'
  | 'marketing';

// CCPA opt-out categories
export type CCPAOptOutCategory =
  | 'sale'
  | 'sharing'
  | 'targeted_advertising'
  | 'profiling';

/**
 * Mapping from cookie categories to CCPA opt-out categories
 * When a user rejects a cookie category, they should be opted out of corresponding CCPA categories
 */
export const COOKIE_TO_CCPA_MAPPING: Record<CookieCategoryId, CCPAOptOutCategory[]> = {
  'strictly-necessary': [], // Essential cookies, no CCPA opt-out applicable
  'functional': [], // Functional cookies, generally not covered by CCPA opt-out
  'performance': ['targeted_advertising'], // Analytics cookies map to targeted advertising
  'marketing': ['sale', 'sharing', 'profiling'], // Marketing cookies map to sale, sharing, and profiling
};

/**
 * Reverse mapping from CCPA categories to cookie categories
 */
export const CCPA_TO_COOKIE_MAPPING: Record<CCPAOptOutCategory, CookieCategoryId[]> = {
  'sale': ['marketing'],
  'sharing': ['marketing'],
  'targeted_advertising': ['performance', 'marketing'],
  'profiling': ['marketing'],
};

/**
 * GPC detection result
 */
export interface GPCDetectionResult {
  /** Whether GPC is supported in the browser */
  isSupported: boolean;
  /** Whether GPC signal is enabled (user wants to opt-out) */
  isEnabled: boolean;
  /** Source of the GPC signal */
  source: 'browser' | 'header' | 'none';
  /** Timestamp of detection */
  detectedAt: string;
}

/**
 * CCPA cookie consent state
 */
export interface CCPACookieConsentState {
  /** GPC detection result */
  gpc: GPCDetectionResult;
  /** Whether user has been auto-opted out due to GPC */
  autoOptedOutByGPC: boolean;
  /** Current CCPA opt-out status by category */
  optOutStatus: Record<CCPAOptOutCategory, boolean>;
  /** Whether the state has been initialized */
  isInitialized: boolean;
}

/**
 * Cookie consent selections (matches UI library)
 */
export type CookieConsentSelections = Record<CookieCategoryId, boolean>;

/**
 * CCPA cookie consent service interface
 */
export interface CCPACookieConsentService {
  /** Detect GPC signal from browser */
  detectGPC(): GPCDetectionResult;

  /** Check if GPC is enabled from server headers */
  detectGPCFromHeader(header: string | null): boolean;

  /** Map cookie selections to CCPA opt-outs */
  mapCookieSelectionsToOptOuts(selections: CookieConsentSelections): Record<CCPAOptOutCategory, boolean>;

  /** Map CCPA opt-outs to cookie selections */
  mapOptOutsToCookieSelections(optOuts: Record<CCPAOptOutCategory, boolean>): Partial<CookieConsentSelections>;

  /** Sync cookie consent with CCPA opt-out system */
  syncCookieConsentToCCPA(
    userId: string,
    selections: CookieConsentSelections,
    consentService: ConsentServiceInterface
  ): Promise<CCPAServiceResponse<void>>;

  /** Apply GPC auto-opt-out if applicable */
  applyGPCAutoOptOut(
    userId: string,
    consentService: ConsentServiceInterface
  ): Promise<CCPAServiceResponse<boolean>>;

  /** Get CCPA opt-out categories that should be opted out based on cookie rejections */
  getOptOutCategoriesFromCookieRejections(selections: CookieConsentSelections): CCPAOptOutCategory[];

  /** Check if any marketing-related cookies are rejected */
  hasMarketingOptOut(selections: CookieConsentSelections): boolean;
}

/**
 * Interface for consent service (allows dependency injection for testing)
 */
export interface ConsentServiceInterface {
  recordConsent(input: {
    user_id: string;
    consent_type: ConsentType;
    consent_given: boolean;
    consent_version: string;
    consent_method: string;
    consent_text?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CCPAServiceResponse<unknown>>;

  getConsentStatus(
    userId: string,
    consentType?: ConsentType
  ): Promise<CCPAServiceResponse<ConsentStatus[]>>;
}

/**
 * Detect Global Privacy Control signal from the browser
 *
 * GPC is a browser setting that signals user's intent to opt-out of sale/sharing
 * Reference: https://globalprivacycontrol.org/
 */
export function detectGPC(): GPCDetectionResult {
  const now = new Date().toISOString();

  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isSupported: false,
      isEnabled: false,
      source: 'none',
      detectedAt: now,
    };
  }

  // Check for globalPrivacyControl property on navigator
  // This is the standard API for GPC
  const gpcValue = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;

  if (typeof gpcValue === 'boolean') {
    return {
      isSupported: true,
      isEnabled: gpcValue,
      source: 'browser',
      detectedAt: now,
    };
  }

  return {
    isSupported: false,
    isEnabled: false,
    source: 'none',
    detectedAt: now,
  };
}

/**
 * Detect GPC from HTTP header (Sec-GPC)
 *
 * @param header - The Sec-GPC header value from the request
 * @returns True if GPC is enabled
 */
export function detectGPCFromHeader(header: string | null): boolean {
  if (!header) return false;
  return header === '1';
}

/**
 * Map cookie consent selections to CCPA opt-out categories
 *
 * When a user rejects non-essential cookies, they should be opted out of
 * corresponding CCPA data sharing/sale categories
 */
export function mapCookieSelectionsToOptOuts(
  selections: CookieConsentSelections
): Record<CCPAOptOutCategory, boolean> {
  const optOuts: Record<CCPAOptOutCategory, boolean> = {
    sale: false,
    sharing: false,
    targeted_advertising: false,
    profiling: false,
  };

  // Check each cookie category
  for (const [categoryId, isAccepted] of Object.entries(selections)) {
    if (!isAccepted) {
      // User rejected this cookie category
      const ccpaCategories = COOKIE_TO_CCPA_MAPPING[categoryId as CookieCategoryId] || [];
      for (const ccpaCategory of ccpaCategories) {
        optOuts[ccpaCategory] = true; // true = opted out
      }
    }
  }

  return optOuts;
}

/**
 * Map CCPA opt-out status back to cookie category recommendations
 *
 * When a user opts out of CCPA categories, we should disable corresponding cookies
 */
export function mapOptOutsToCookieSelections(
  optOuts: Record<CCPAOptOutCategory, boolean>
): Partial<CookieConsentSelections> {
  const selections: Partial<CookieConsentSelections> = {};

  // Check each CCPA opt-out
  for (const [ccpaCategory, isOptedOut] of Object.entries(optOuts)) {
    if (isOptedOut) {
      const cookieCategories = CCPA_TO_COOKIE_MAPPING[ccpaCategory as CCPAOptOutCategory] || [];
      for (const cookieCategory of cookieCategories) {
        selections[cookieCategory] = false; // Disable cookies when opted out
      }
    }
  }

  return selections;
}

/**
 * Get CCPA opt-out categories based on cookie rejections
 */
export function getOptOutCategoriesFromCookieRejections(
  selections: CookieConsentSelections
): CCPAOptOutCategory[] {
  const optOuts = mapCookieSelectionsToOptOuts(selections);
  return Object.entries(optOuts)
    .filter(([, isOptedOut]) => isOptedOut)
    .map(([category]) => category as CCPAOptOutCategory);
}

/**
 * Check if marketing-related cookies are rejected
 */
export function hasMarketingOptOut(selections: CookieConsentSelections): boolean {
  return selections.marketing === false;
}

/**
 * Sync cookie consent selections with CCPA opt-out system
 *
 * @param userId - The user's ID
 * @param selections - Current cookie consent selections
 * @param consentService - The consent service to record opt-outs
 */
export async function syncCookieConsentToCCPA(
  userId: string,
  selections: CookieConsentSelections,
  consentService: ConsentServiceInterface
): Promise<CCPAServiceResponse<void>> {
  try {
    const optOuts = mapCookieSelectionsToOptOuts(selections);
    const timestamp = new Date().toISOString();

    // Record each opt-out decision
    const results: Array<CCPAServiceResponse<unknown>> = [];

    for (const [category, isOptedOut] of Object.entries(optOuts)) {
      const consentType = mapCCPACategoryToConsentType(category as CCPAOptOutCategory);
      if (!consentType) continue;

      const result = await consentService.recordConsent({
        user_id: userId,
        consent_type: consentType,
        consent_given: !isOptedOut, // consent_given = false means opted out
        consent_version: '1.0',
        consent_method: 'toggle_switch',
        consent_text: isOptedOut
          ? `Opted out of ${category} via cookie preferences`
          : `Allowed ${category} via cookie preferences`,
        metadata: {
          source: 'cookie_consent',
          cookie_selections: selections,
          synced_at: timestamp,
        },
      });

      results.push(result);
    }

    // Check if all were successful
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return {
        success: false,
        error: {
          code: 'SYNC_PARTIAL_FAILURE',
          message: `${failed.length} of ${results.length} consent records failed to sync`,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during sync',
      },
    };
  }
}

/**
 * Apply automatic GPC opt-out
 *
 * When GPC signal is detected, automatically opt the user out of sale, sharing,
 * and targeted advertising per CCPA requirements
 */
export async function applyGPCAutoOptOut(
  userId: string,
  consentService: ConsentServiceInterface
): Promise<CCPAServiceResponse<boolean>> {
  const gpc = detectGPC();

  if (!gpc.isEnabled) {
    return {
      success: true,
      data: false, // No auto opt-out applied
    };
  }

  try {
    // GPC is enabled - opt out of sale, sharing, and targeted advertising
    const optOutCategories: CCPAOptOutCategory[] = ['sale', 'sharing', 'targeted_advertising'];

    for (const category of optOutCategories) {
      const consentType = mapCCPACategoryToConsentType(category);
      if (!consentType) continue;

      await consentService.recordConsent({
        user_id: userId,
        consent_type: consentType,
        consent_given: false, // Opted out
        consent_version: '1.0',
        consent_method: 'explicit_opt_out',
        consent_text: `Automatically opted out of ${category} due to Global Privacy Control (GPC) signal`,
        metadata: {
          source: 'gpc_auto_opt_out',
          gpc_detection: gpc,
        },
      });
    }

    return {
      success: true,
      data: true, // Auto opt-out applied
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GPC_AUTO_OPT_OUT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during GPC auto opt-out',
      },
    };
  }
}

/**
 * Map CCPA opt-out category to consent type
 */
function mapCCPACategoryToConsentType(category: CCPAOptOutCategory): ConsentType | null {
  const mapping: Record<CCPAOptOutCategory, ConsentType> = {
    sale: 'opt_out_sale',
    sharing: 'third_party_sharing',
    targeted_advertising: 'cookies_marketing',
    profiling: 'analytics',
  };

  return mapping[category] || null;
}

/**
 * Create CCPA cookie consent state from current browser state
 */
export function createInitialState(): CCPACookieConsentState {
  const gpc = detectGPC();

  return {
    gpc,
    autoOptedOutByGPC: false,
    optOutStatus: {
      sale: gpc.isEnabled,
      sharing: gpc.isEnabled,
      targeted_advertising: gpc.isEnabled,
      profiling: false,
    },
    isInitialized: true,
  };
}

/**
 * Get default cookie selections based on GPC status
 * If GPC is enabled, non-essential cookies should be rejected by default
 */
export function getDefaultSelectionsWithGPC(gpcEnabled: boolean): CookieConsentSelections {
  if (gpcEnabled) {
    return {
      'strictly-necessary': true,
      'functional': false, // Respect GPC
      'performance': false, // Respect GPC
      'marketing': false, // Respect GPC
    };
  }

  return {
    'strictly-necessary': true,
    'functional': false,
    'performance': false,
    'marketing': false,
  };
}

/**
 * CCPA Cookie Consent Service
 * Provides all functions as a service object
 */
export const ccpaCookieConsentService: CCPACookieConsentService = {
  detectGPC,
  detectGPCFromHeader,
  mapCookieSelectionsToOptOuts,
  mapOptOutsToCookieSelections,
  syncCookieConsentToCCPA,
  applyGPCAutoOptOut,
  getOptOutCategoriesFromCookieRejections,
  hasMarketingOptOut,
};

// Export convenience functions
export {
  detectGPC as useCCPAGPCDetection,
};
