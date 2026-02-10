/**
 * Tests for CCPA Cookie Consent Integration Hook
 * CCPA Compliance Implementation - TASK-21
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectGPC,
  detectGPCFromHeader,
  mapCookieSelectionsToOptOuts,
  mapOptOutsToCookieSelections,
  getOptOutCategoriesFromCookieRejections,
  hasMarketingOptOut,
  syncCookieConsentToCCPA,
  applyGPCAutoOptOut,
  createInitialState,
  getDefaultSelectionsWithGPC,
  COOKIE_TO_CCPA_MAPPING,
  CCPA_TO_COOKIE_MAPPING,
  type CookieConsentSelections,
  type ConsentServiceInterface,
  type CCPAOptOutCategory,
} from '../useCCPACookieConsent';

describe('CCPA Cookie Consent Integration', () => {
  describe('GPC Detection', () => {
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    beforeEach(() => {
      // Reset global objects
      vi.resetAllMocks();
    });

    afterEach(() => {
      // Restore original values
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('should detect GPC when enabled in browser', () => {
      // Mock navigator with GPC enabled
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: true },
        writable: true,
        configurable: true,
      });

      const result = detectGPC();

      expect(result.isSupported).toBe(true);
      expect(result.isEnabled).toBe(true);
      expect(result.source).toBe('browser');
      expect(result.detectedAt).toBeDefined();
    });

    it('should detect GPC when disabled in browser', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: false },
        writable: true,
        configurable: true,
      });

      const result = detectGPC();

      expect(result.isSupported).toBe(true);
      expect(result.isEnabled).toBe(false);
      expect(result.source).toBe('browser');
    });

    it('should handle missing GPC support', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = detectGPC();

      expect(result.isSupported).toBe(false);
      expect(result.isEnabled).toBe(false);
      expect(result.source).toBe('none');
    });

    it('should handle server-side rendering (no window)', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = detectGPC();

      expect(result.isSupported).toBe(false);
      expect(result.isEnabled).toBe(false);
      expect(result.source).toBe('none');
    });
  });

  describe('GPC Header Detection', () => {
    it('should detect GPC from Sec-GPC header value "1"', () => {
      expect(detectGPCFromHeader('1')).toBe(true);
    });

    it('should not detect GPC from Sec-GPC header value "0"', () => {
      expect(detectGPCFromHeader('0')).toBe(false);
    });

    it('should not detect GPC from null header', () => {
      expect(detectGPCFromHeader(null)).toBe(false);
    });

    it('should not detect GPC from empty header', () => {
      expect(detectGPCFromHeader('')).toBe(false);
    });

    it('should not detect GPC from invalid header value', () => {
      expect(detectGPCFromHeader('true')).toBe(false);
      expect(detectGPCFromHeader('yes')).toBe(false);
    });
  });

  describe('Cookie to CCPA Mapping', () => {
    it('should have correct mapping for strictly-necessary cookies', () => {
      expect(COOKIE_TO_CCPA_MAPPING['strictly-necessary']).toEqual([]);
    });

    it('should have correct mapping for functional cookies', () => {
      expect(COOKIE_TO_CCPA_MAPPING['functional']).toEqual([]);
    });

    it('should have correct mapping for performance cookies', () => {
      expect(COOKIE_TO_CCPA_MAPPING['performance']).toEqual(['targeted_advertising']);
    });

    it('should have correct mapping for marketing cookies', () => {
      expect(COOKIE_TO_CCPA_MAPPING['marketing']).toContain('sale');
      expect(COOKIE_TO_CCPA_MAPPING['marketing']).toContain('sharing');
      expect(COOKIE_TO_CCPA_MAPPING['marketing']).toContain('profiling');
    });
  });

  describe('CCPA to Cookie Mapping', () => {
    it('should map sale opt-out to marketing cookies', () => {
      expect(CCPA_TO_COOKIE_MAPPING['sale']).toContain('marketing');
    });

    it('should map sharing opt-out to marketing cookies', () => {
      expect(CCPA_TO_COOKIE_MAPPING['sharing']).toContain('marketing');
    });

    it('should map targeted_advertising to performance and marketing', () => {
      expect(CCPA_TO_COOKIE_MAPPING['targeted_advertising']).toContain('performance');
      expect(CCPA_TO_COOKIE_MAPPING['targeted_advertising']).toContain('marketing');
    });

    it('should map profiling to marketing cookies', () => {
      expect(CCPA_TO_COOKIE_MAPPING['profiling']).toContain('marketing');
    });
  });

  describe('mapCookieSelectionsToOptOuts', () => {
    it('should return no opt-outs when all cookies accepted', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': true,
      };

      const optOuts = mapCookieSelectionsToOptOuts(selections);

      expect(optOuts.sale).toBe(false);
      expect(optOuts.sharing).toBe(false);
      expect(optOuts.targeted_advertising).toBe(false);
      expect(optOuts.profiling).toBe(false);
    });

    it('should opt-out of sale, sharing, and profiling when marketing rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': false, // Rejected
      };

      const optOuts = mapCookieSelectionsToOptOuts(selections);

      expect(optOuts.sale).toBe(true);
      expect(optOuts.sharing).toBe(true);
      expect(optOuts.profiling).toBe(true);
    });

    it('should opt-out of targeted_advertising when performance rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': false, // Rejected
        'marketing': true,
      };

      const optOuts = mapCookieSelectionsToOptOuts(selections);

      expect(optOuts.targeted_advertising).toBe(true);
      expect(optOuts.sale).toBe(false);
    });

    it('should opt-out of all CCPA categories when all non-essential rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': false,
        'performance': false,
        'marketing': false,
      };

      const optOuts = mapCookieSelectionsToOptOuts(selections);

      expect(optOuts.sale).toBe(true);
      expect(optOuts.sharing).toBe(true);
      expect(optOuts.targeted_advertising).toBe(true);
      expect(optOuts.profiling).toBe(true);
    });
  });

  describe('mapOptOutsToCookieSelections', () => {
    it('should disable marketing when opted out of sale', () => {
      const optOuts: Record<CCPAOptOutCategory, boolean> = {
        sale: true,
        sharing: false,
        targeted_advertising: false,
        profiling: false,
      };

      const selections = mapOptOutsToCookieSelections(optOuts);

      expect(selections.marketing).toBe(false);
    });

    it('should disable performance and marketing when opted out of targeted_advertising', () => {
      const optOuts: Record<CCPAOptOutCategory, boolean> = {
        sale: false,
        sharing: false,
        targeted_advertising: true,
        profiling: false,
      };

      const selections = mapOptOutsToCookieSelections(optOuts);

      expect(selections.performance).toBe(false);
      expect(selections.marketing).toBe(false);
    });

    it('should return empty when no opt-outs', () => {
      const optOuts: Record<CCPAOptOutCategory, boolean> = {
        sale: false,
        sharing: false,
        targeted_advertising: false,
        profiling: false,
      };

      const selections = mapOptOutsToCookieSelections(optOuts);

      expect(Object.keys(selections).length).toBe(0);
    });
  });

  describe('getOptOutCategoriesFromCookieRejections', () => {
    it('should return empty array when all cookies accepted', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': true,
      };

      const categories = getOptOutCategoriesFromCookieRejections(selections);

      expect(categories).toEqual([]);
    });

    it('should return sale, sharing, profiling when marketing rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': false,
      };

      const categories = getOptOutCategoriesFromCookieRejections(selections);

      expect(categories).toContain('sale');
      expect(categories).toContain('sharing');
      expect(categories).toContain('profiling');
    });

    it('should return targeted_advertising when performance rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': false,
        'marketing': true,
      };

      const categories = getOptOutCategoriesFromCookieRejections(selections);

      expect(categories).toContain('targeted_advertising');
      expect(categories).not.toContain('sale');
    });
  });

  describe('hasMarketingOptOut', () => {
    it('should return true when marketing is rejected', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': false,
      };

      expect(hasMarketingOptOut(selections)).toBe(true);
    });

    it('should return false when marketing is accepted', () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': true,
      };

      expect(hasMarketingOptOut(selections)).toBe(false);
    });
  });

  describe('syncCookieConsentToCCPA', () => {
    let mockConsentService: ConsentServiceInterface;

    beforeEach(() => {
      mockConsentService = {
        recordConsent: vi.fn().mockResolvedValue({ success: true }),
        getConsentStatus: vi.fn().mockResolvedValue({ success: true, data: [] }),
      };
    });

    it('should record opt-outs for rejected marketing cookies', async () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': false,
      };

      const result = await syncCookieConsentToCCPA('user-123', selections, mockConsentService);

      expect(result.success).toBe(true);
      expect(mockConsentService.recordConsent).toHaveBeenCalled();

      // Should have recorded opt-outs for sale, sharing, and profiling
      const calls = (mockConsentService.recordConsent as ReturnType<typeof vi.fn>).mock.calls;
      const optOutCalls = calls.filter(
        (call: [{ consent_given: boolean }]) => call[0].consent_given === false
      );
      expect(optOutCalls.length).toBeGreaterThan(0);
    });

    it('should record opt-ins when all cookies accepted', async () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': true,
      };

      const result = await syncCookieConsentToCCPA('user-123', selections, mockConsentService);

      expect(result.success).toBe(true);

      // Should have recorded opt-ins (consent_given: true)
      const calls = (mockConsentService.recordConsent as ReturnType<typeof vi.fn>).mock.calls;
      const optInCalls = calls.filter(
        (call: [{ consent_given: boolean }]) => call[0].consent_given === true
      );
      expect(optInCalls.length).toBeGreaterThan(0);
    });

    it('should return partial failure when some records fail', async () => {
      mockConsentService.recordConsent = vi.fn()
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: { code: 'ERROR', message: 'Failed' } })
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': false,
        'performance': false,
        'marketing': false,
      };

      const result = await syncCookieConsentToCCPA('user-123', selections, mockConsentService);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYNC_PARTIAL_FAILURE');
    });

    it('should handle consent service errors gracefully', async () => {
      mockConsentService.recordConsent = vi.fn().mockRejectedValue(new Error('Network error'));

      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': true,
        'marketing': false,
      };

      const result = await syncCookieConsentToCCPA('user-123', selections, mockConsentService);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYNC_ERROR');
    });

    it('should include metadata about cookie selections', async () => {
      const selections: CookieConsentSelections = {
        'strictly-necessary': true,
        'functional': true,
        'performance': false,
        'marketing': false,
      };

      await syncCookieConsentToCCPA('user-123', selections, mockConsentService);

      const calls = (mockConsentService.recordConsent as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0].metadata).toBeDefined();
      expect(calls[0][0].metadata.source).toBe('cookie_consent');
      expect(calls[0][0].metadata.cookie_selections).toEqual(selections);
    });
  });

  describe('applyGPCAutoOptOut', () => {
    let mockConsentService: ConsentServiceInterface;
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    beforeEach(() => {
      mockConsentService = {
        recordConsent: vi.fn().mockResolvedValue({ success: true }),
        getConsentStatus: vi.fn().mockResolvedValue({ success: true, data: [] }),
      };
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('should apply auto opt-out when GPC is enabled', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: true },
        writable: true,
        configurable: true,
      });

      const result = await applyGPCAutoOptOut('user-123', mockConsentService);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockConsentService.recordConsent).toHaveBeenCalled();

      // Should opt out of sale, sharing, and targeted_advertising
      const calls = (mockConsentService.recordConsent as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBe(3);

      // All calls should have consent_given: false (opt-out)
      for (const call of calls) {
        expect(call[0].consent_given).toBe(false);
        expect(call[0].metadata.source).toBe('gpc_auto_opt_out');
      }
    });

    it('should not apply auto opt-out when GPC is disabled', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: false },
        writable: true,
        configurable: true,
      });

      const result = await applyGPCAutoOptOut('user-123', mockConsentService);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(mockConsentService.recordConsent).not.toHaveBeenCalled();
    });

    it('should not apply auto opt-out when GPC is not supported', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = await applyGPCAutoOptOut('user-123', mockConsentService);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(mockConsentService.recordConsent).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: true },
        writable: true,
        configurable: true,
      });

      mockConsentService.recordConsent = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await applyGPCAutoOptOut('user-123', mockConsentService);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GPC_AUTO_OPT_OUT_ERROR');
    });
  });

  describe('createInitialState', () => {
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('should create initial state with GPC detection', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: true },
        writable: true,
        configurable: true,
      });

      const state = createInitialState();

      expect(state.isInitialized).toBe(true);
      expect(state.gpc.isEnabled).toBe(true);
      expect(state.optOutStatus.sale).toBe(true);
      expect(state.optOutStatus.sharing).toBe(true);
      expect(state.optOutStatus.targeted_advertising).toBe(true);
    });

    it('should create initial state without opt-outs when GPC disabled', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: { globalPrivacyControl: false },
        writable: true,
        configurable: true,
      });

      const state = createInitialState();

      expect(state.isInitialized).toBe(true);
      expect(state.gpc.isEnabled).toBe(false);
      expect(state.optOutStatus.sale).toBe(false);
      expect(state.optOutStatus.sharing).toBe(false);
    });
  });

  describe('getDefaultSelectionsWithGPC', () => {
    it('should reject non-essential cookies when GPC enabled', () => {
      const selections = getDefaultSelectionsWithGPC(true);

      expect(selections['strictly-necessary']).toBe(true);
      expect(selections['functional']).toBe(false);
      expect(selections['performance']).toBe(false);
      expect(selections['marketing']).toBe(false);
    });

    it('should reject non-essential cookies by default when GPC disabled', () => {
      const selections = getDefaultSelectionsWithGPC(false);

      expect(selections['strictly-necessary']).toBe(true);
      expect(selections['functional']).toBe(false);
      expect(selections['performance']).toBe(false);
      expect(selections['marketing']).toBe(false);
    });
  });
});
