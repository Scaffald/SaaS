import { useMutation } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { supabase } from '@scf/core/utils/supabase/client'
import type { CookieConsentState } from '@scaffald/ui'

// Maps CookieConsentProvider category IDs → consent_records.consent_type values
const CATEGORY_TO_CONSENT_TYPE: Record<string, string> = {
  'strictly-necessary': 'cookies_essential',
  performance: 'cookies_analytics',
}

function getUserAgent(): string {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.userAgent
  }
  return `ReactNative/${Platform.OS}`
}

/**
 * Records all cookie category consent selections to the audit DB.
 * Inserts one row per category into consent_records.
 */
export function useRecordCookieConsentMutation() {
  return useMutation({
    mutationFn: async ({ userId, state }: { userId: string; state: CookieConsentState }) => {
      const userAgent = getUserAgent()
      const deviceType = Platform.OS === 'web' ? 'desktop' : 'mobile'

      const records = Object.entries(state.selections)
        .map(([categoryId, given]) => {
          const consentType = CATEGORY_TO_CONSENT_TYPE[categoryId]
          if (!consentType) return null
          return {
            user_id: userId,
            consent_type: consentType,
            consent_given: given,
            consent_version: state.version,
            consent_method: 'toggle_switch',
            consent_text: given
              ? `User enabled ${categoryId} cookies (policy v${state.version})`
              : `User disabled ${categoryId} cookies (policy v${state.version})`,
            user_agent: userAgent,
            device_type: deviceType,
            metadata: { category_id: categoryId, recorded_at: state.updatedAt },
          }
        })
        .filter((r): r is NonNullable<typeof r> => r != null)

      if (records.length === 0) return

      const { error } = await supabase.from('consent_records').insert(records)
      if (error) throw error
    },
  })
}
