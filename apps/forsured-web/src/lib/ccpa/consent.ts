/**
 * Consent Management Service - CCPA Consent Tracking
 * CCPA Compliance Implementation
 *
 * Implements:
 * - "Do Not Sell My Data" opt-out mechanism
 * - Consent tracking with audit trail
 * - Consent version management
 * - Integration with audit logging
 */

import type {
  ConsentRecord,
  CreateConsentRecordInput,
  ConsentType,
  ConsentStatus,
  CCPAServiceResponse,
  ConsentFilters,
} from './types';

// Supabase client - will be injected
// eslint-disable-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeConsentService(client: any) {
  supabaseClient = client;
}

/**
 * Current privacy policy version
 * Increment this when privacy policy changes materially
 */
export const CURRENT_PRIVACY_POLICY_VERSION = '1.0';

/**
 * Consent Management Service
 * Handles consent recording, withdrawal, and querying
 */
export class ConsentService {
  /**
   * Record user consent
   *
   * @param input - Consent record input
   * @returns Created consent record
   */
  async recordConsent(
    input: CreateConsentRecordInput
  ): Promise<CCPAServiceResponse<ConsentRecord>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Enrich with context
      const enrichedInput = await this.enrichConsentInput(input);

      // Insert consent record
      const { data, error } = await supabaseClient
        .from('consent_records')
        .insert(enrichedInput)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record consent: ${error.message}`);
      }

      // Audit logging is handled by database trigger
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Consent recording error:', error);
      return {
        success: false,
        error: {
          code: 'CONSENT_RECORD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Withdraw user consent
   *
   * @param userId - User ID
   * @param consentType - Type of consent to withdraw
   * @param reason - Withdrawal reason
   * @returns Updated consent record
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<CCPAServiceResponse<ConsentRecord>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Get active consent record
      const { data: activeConsent, error: findError } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('consent_given', true)
        .is('withdrawn_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !activeConsent) {
        return {
          success: false,
          error: {
            code: 'CONSENT_NOT_FOUND',
            message: 'No active consent found to withdraw',
          },
        };
      }

      // Update consent record to mark as withdrawn
      const { data, error } = await supabaseClient
        .from('consent_records')
        .update({
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: reason,
        })
        .eq('id', activeConsent.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to withdraw consent: ${error.message}`);
      }

      // Audit logging is handled by database trigger
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Consent withdrawal error:', error);
      return {
        success: false,
        error: {
          code: 'CONSENT_WITHDRAWAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get current consent status for user
   *
   * @param userId - User ID
   * @param consentType - Type of consent (optional, returns all if not specified)
   * @returns Consent status
   */
  async getConsentStatus(
    userId: string,
    consentType?: ConsentType
  ): Promise<CCPAServiceResponse<ConsentStatus[]>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      let query = supabaseClient
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (consentType) {
        query = query.eq('consent_type', consentType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get consent status: ${error.message}`);
      }

      // Group by consent type and get latest status
      const statusMap = new Map<ConsentType, ConsentStatus>();

      for (const record of data || []) {
        if (!statusMap.has(record.consent_type)) {
          statusMap.set(record.consent_type, {
            consent_type: record.consent_type,
            is_granted: record.consent_given && !record.withdrawn_at,
            granted_at: record.consent_given ? record.created_at : undefined,
            withdrawn_at: record.withdrawn_at,
            expires_at: record.expires_at,
            consent_version: record.consent_version,
          });
        }
      }

      return {
        success: true,
        data: Array.from(statusMap.values()),
      };
    } catch (error) {
      console.error('Get consent status error:', error);
      return {
        success: false,
        error: {
          code: 'GET_CONSENT_STATUS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check if user has given specific consent
   *
   * @param userId - User ID
   * @param consentType - Type of consent
   * @returns True if consent is granted and active
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const response = await this.getConsentStatus(userId, consentType);
    if (!response.success || !response.data || response.data.length === 0) {
      return false;
    }

    const status = response.data[0];
    return status.is_granted;
  }

  /**
   * Query consent records with filters
   *
   * @param filters - Query filters
   * @returns Consent records
   */
  async queryConsents(
    filters: ConsentFilters
  ): Promise<CCPAServiceResponse<ConsentRecord[]>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      let query = supabaseClient.from('consent_records').select('*');

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.consent_type) {
        query = query.eq('consent_type', filters.consent_type);
      }
      if (filters.consent_given !== undefined) {
        query = query.eq('consent_given', filters.consent_given);
      }
      if (filters.active_only) {
        query = query.is('withdrawn_at', null);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to query consents: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Query consents error:', error);
      return {
        success: false,
        error: {
          code: 'QUERY_CONSENTS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Implement "Do Not Sell My Personal Information" opt-out
   *
   * @param userId - User ID
   * @returns Consent record
   */
  async doNotSellOptOut(userId: string): Promise<CCPAServiceResponse<ConsentRecord>> {
    return this.recordConsent({
      user_id: userId,
      consent_type: 'opt_out_sale',
      consent_given: false, // false = opted out of sale
      consent_version: CURRENT_PRIVACY_POLICY_VERSION,
      consent_method: 'toggle_switch',
      consent_text: 'I do not want my personal information sold or shared for cross-context behavioral advertising',
    });
  }

  /**
   * Revoke "Do Not Sell" opt-out (user opts back in)
   *
   * @param userId - User ID
   * @returns Consent record
   */
  async doNotSellOptIn(userId: string): Promise<CCPAServiceResponse<ConsentRecord>> {
    return this.recordConsent({
      user_id: userId,
      consent_type: 'opt_out_sale',
      consent_given: true, // true = allows sale
      consent_version: CURRENT_PRIVACY_POLICY_VERSION,
      consent_method: 'toggle_switch',
      consent_text: 'I allow my personal information to be sold or shared for cross-context behavioral advertising',
    });
  }

  /**
   * Invalidate consents when privacy policy changes
   *
   * @param newVersion - New privacy policy version
   * @param consentTypes - Types of consent to invalidate (optional, invalidates all if not specified)
   * @returns Number of consents invalidated
   */
  async invalidateConsentsForPolicyChange(
    newVersion: string,
    consentTypes?: ConsentType[]
  ): Promise<CCPAServiceResponse<number>> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Get all active consents with old version
      let query = supabaseClient
        .from('consent_records')
        .select('id')
        .neq('consent_version', newVersion)
        .is('withdrawn_at', null);

      if (consentTypes && consentTypes.length > 0) {
        query = query.in('consent_type', consentTypes);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to query consents: ${error.message}`);
      }

      // Mark all as withdrawn
      const consentIds = (data || []).map(c => c.id);
      if (consentIds.length === 0) {
        return {
          success: true,
          data: 0,
        };
      }

      const { error: updateError } = await supabaseClient
        .from('consent_records')
        .update({
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: `Privacy policy updated to version ${newVersion}`,
        })
        .in('id', consentIds);

      if (updateError) {
        throw new Error(`Failed to invalidate consents: ${updateError.message}`);
      }

      return {
        success: true,
        data: consentIds.length,
      };
    } catch (error) {
      console.error('Invalidate consents error:', error);
      return {
        success: false,
        error: {
          code: 'INVALIDATE_CONSENTS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Enrich consent input with context
   */
  private async enrichConsentInput(
    input: CreateConsentRecordInput
  ): Promise<any> {
    return {
      ...input,
      ip_address: await this.getClientIpAddress(),
      user_agent: this.getUserAgent(),
      device_type: this.getDeviceType(),
      location_country: await this.getLocationCountry(),
    };
  }

  /**
   * Get client IP address
   */
  private async getClientIpAddress(): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return navigator.userAgent;
  }

  /**
   * Get device type
   */
  private getDeviceType(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get location country (from IP geolocation)
   */
  private async getLocationCountry(): Promise<string | undefined> {
    // TODO: Implement IP geolocation when service is configured
    return undefined;
  }
}

// =============================================================================
// SINGLETON INSTANCE & CONVENIENCE METHODS
// =============================================================================

export const consentService = new ConsentService();

/**
 * Record user consent
 *
 * @param input - Consent record input
 * @returns Created consent record
 */
export const recordConsent = (input: CreateConsentRecordInput) =>
  consentService.recordConsent(input);

/**
 * Withdraw user consent
 *
 * @param userId - User ID
 * @param consentType - Type of consent to withdraw
 * @param reason - Withdrawal reason
 * @returns Updated consent record
 */
export const withdrawConsent = (
  userId: string,
  consentType: ConsentType,
  reason?: string
) => consentService.withdrawConsent(userId, consentType, reason);

/**
 * Get current consent status for user
 *
 * @param userId - User ID
 * @param consentType - Type of consent (optional)
 * @returns Consent status
 */
export const getConsentStatus = (userId: string, consentType?: ConsentType) =>
  consentService.getConsentStatus(userId, consentType);

/**
 * Check if user has given specific consent
 *
 * @param userId - User ID
 * @param consentType - Type of consent
 * @returns True if consent is granted and active
 */
export const hasConsent = (userId: string, consentType: ConsentType) =>
  consentService.hasConsent(userId, consentType);

/**
 * Implement "Do Not Sell My Personal Information" opt-out
 *
 * @param userId - User ID
 * @returns Consent record
 */
export const doNotSellOptOut = (userId: string) =>
  consentService.doNotSellOptOut(userId);

/**
 * Revoke "Do Not Sell" opt-out (user opts back in)
 *
 * @param userId - User ID
 * @returns Consent record
 */
export const doNotSellOptIn = (userId: string) =>
  consentService.doNotSellOptIn(userId);
