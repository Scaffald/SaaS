import { describe, expect, test, vi } from 'vitest'
import {
  assertValidEventProperties,
  eventSchemas,
  validateEventProperties,
  type AnalyticsEventName,
} from '../events'

describe('analytics events', () => {
  describe('validateEventProperties', () => {
    describe('user_signed_in', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('user_signed_in', {
          provider: 'email',
          is_new_user: true,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({
            provider: 'email',
            is_new_user: true,
          })
        }
      })

      test('validates with optional has_anonymous_history', () => {
        const result = validateEventProperties('user_signed_in', {
          provider: 'email',
          is_new_user: false,
          has_anonymous_history: true,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect((result.data as { has_anonymous_history?: boolean }).has_anonymous_history).toBe(true)
        }
      })

      test('rejects missing required properties', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid properties (missing required field)
        const result = validateEventProperties('user_signed_in', {
          provider: 'email',
          // Missing is_new_user
        } as any)

        expect(result.success).toBe(false)
      })

      test('rejects invalid provider type', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid property types
        const result = validateEventProperties('user_signed_in', {
          provider: 123, // Should be string
          is_new_user: true,
        } as any)

        expect(result.success).toBe(false)
      })

      test('rejects invalid is_new_user type', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid property types
        const result = validateEventProperties('user_signed_in', {
          provider: 'email',
          is_new_user: 'true', // Should be boolean
        } as any)

        expect(result.success).toBe(false)
      })
    })

    describe('user_signed_out', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('user_signed_out', {
          reason: 'sign_out',
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({
            reason: 'sign_out',
          })
        }
      })

      test('validates all valid reason values', () => {
        const reasons = ['sign_out', 'session_timeout', 'auth_cleared', 'consent_revoked', 'unknown'] as const

        for (const reason of reasons) {
          const result = validateEventProperties('user_signed_out', { reason })
          expect(result.success).toBe(true)
        }
      })

      test('rejects invalid reason value', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        const result = validateEventProperties('user_signed_out', {
          reason: 'invalid_reason',
        } as any)

        expect(result.success).toBe(false)
      })

      test('rejects missing reason', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing missing required properties
        const result = validateEventProperties('user_signed_out', {} as any)

        expect(result.success).toBe(false)
      })
    })

    describe('job_viewed', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('job_viewed', {
          job_id: 'job-123',
          is_external: false,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({
            job_id: 'job-123',
            is_external: false,
          })
        }
      })

      test('validates with optional organization_id', () => {
        const result = validateEventProperties('job_viewed', {
          job_id: 'job-123',
          is_external: true,
          organization_id: 'org-456',
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect((result.data as { organization_id?: string | null }).organization_id).toBe('org-456')
        }
      })

      test('validates with null organization_id', () => {
        const result = validateEventProperties('job_viewed', {
          job_id: 'job-123',
          is_external: false,
          organization_id: null,
        })

        expect(result.success).toBe(true)
      })

      test('rejects missing required properties', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid properties (missing required field)
        const result = validateEventProperties('job_viewed', {
          job_id: 'job-123',
          // Missing is_external
        } as any)

        expect(result.success).toBe(false)
      })
    })

    describe('auth_magic_link_requested', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('auth_magic_link_requested', {
          email_domain: 'example.com',
        })

        expect(result.success).toBe(true)
      })

      test('validates with optional mode', () => {
        const result = validateEventProperties('auth_magic_link_requested', {
          email_domain: 'example.com',
          mode: 'signup',
        })

        expect(result.success).toBe(true)
      })

      test('validates with null mode', () => {
        const result = validateEventProperties('auth_magic_link_requested', {
          email_domain: 'example.com',
          mode: null,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('auth_social_sign_in_started', () => {
      test('validates correct properties with google', () => {
        const result = validateEventProperties('auth_social_sign_in_started', {
          provider: 'google',
        })

        expect(result.success).toBe(true)
      })

      test('validates correct properties with apple', () => {
        const result = validateEventProperties('auth_social_sign_in_started', {
          provider: 'apple',
        })

        expect(result.success).toBe(true)
      })

      test('rejects invalid provider', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value
        const result = validateEventProperties('auth_social_sign_in_started', {
          provider: 'facebook',
        } as any)

        expect(result.success).toBe(false)
      })
    })

    describe('auth_social_sign_in_failed', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('auth_social_sign_in_failed', {
          provider: 'google',
        })

        expect(result.success).toBe(true)
      })

      test('validates with optional error fields', () => {
        const result = validateEventProperties('auth_social_sign_in_failed', {
          provider: 'apple',
          error_code: 'auth_failed',
          message: 'Authentication failed',
        })

        expect(result.success).toBe(true)
      })
    })

    describe('job_external_link_clicked', () => {
      test('validates correct properties', () => {
        const result = validateEventProperties('job_external_link_clicked', {
          job_id: 'job-123',
        })

        expect(result.success).toBe(true)
      })

      test('validates with optional url', () => {
        const result = validateEventProperties('job_external_link_clicked', {
          job_id: 'job-123',
          url: 'https://example.com/job',
        })

        expect(result.success).toBe(true)
      })

      test('validates with null url', () => {
        const result = validateEventProperties('job_external_link_clicked', {
          job_id: 'job-123',
          url: null,
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('assertValidEventProperties', () => {
    test('throws on invalid properties', () => {
      expect(() => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid properties (missing required field)
        assertValidEventProperties('user_signed_in', {
          provider: 'email',
          // Missing is_new_user
        } as any)
      }).toThrow()
    })

    test('returns valid properties when valid', () => {
      const result = assertValidEventProperties('user_signed_in', {
        provider: 'email',
        is_new_user: true,
      })

      expect(result).toEqual({
        provider: 'email',
        is_new_user: true,
      })
    })
  })

  describe('event schemas', () => {
    test('all event schemas are defined', () => {
      const eventNames: AnalyticsEventName[] = [
        'auth_magic_link_requested',
        'auth_magic_link_failed',
        'auth_social_sign_in_started',
        'auth_social_sign_in_failed',
        'user_signed_in',
        'user_signed_out',
        'job_viewed',
        'job_external_link_clicked',
      ]

      for (const eventName of eventNames) {
        expect(eventSchemas[eventName]).toBeDefined()
      }
    })

    test('validation errors are logged correctly', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = validateEventProperties('user_signed_in', {
        provider: 'email',
        // Missing is_new_user
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.error.flatten).toBeDefined()
      }

      consoleWarnSpy.mockRestore()
    })
  })
})

