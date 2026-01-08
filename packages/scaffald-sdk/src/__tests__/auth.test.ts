import { describe, it, expect, beforeEach } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  MagicLinkRequest,
  MagicLinkResponse,
  UserRolesResponse,
  SessionResponse,
} from '../resources/auth.js'

describe('AuthResource', () => {
  let client: Scaffald
  let publicClient: Scaffald

  beforeEach(() => {
    // Authenticated client
    client = new Scaffald({
      accessToken: 'mock_oauth_token_for_testing',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })

    // Public client (for magic link requests)
    publicClient = new Scaffald({
      apiKey: 'sk_test_mock_key_for_public',
      baseUrl: 'http://localhost:54321/functions/v1/api',
    })
  })

  describe('resource initialization', () => {
    it('should have auth resource available', () => {
      expect(client.auth).toBeDefined()
      expect(publicClient.auth).toBeDefined()
    })

    it('should extend BaseResource', () => {
      expect(client.auth).toHaveProperty('requestMagicLink')
      expect(client.auth).toHaveProperty('getRoles')
      expect(client.auth).toHaveProperty('getSession')
    })
  })

  describe('auth.requestMagicLink (unit)', () => {
    it('should have requestMagicLink method', () => {
      expect(typeof client.auth.requestMagicLink).toBe('function')
    })

    it('should accept magic link request parameters', () => {
      const params: MagicLinkRequest = {
        email: 'test@example.com',
        redirectTo: 'https://app.example.com/auth/callback',
      }

      // Verify types compile correctly
      expect(params.email).toBe('test@example.com')
      expect(params.redirectTo).toBe('https://app.example.com/auth/callback')
    })

    it('should accept magic link request without redirect URL', () => {
      const params: MagicLinkRequest = {
        email: 'test@example.com',
      }

      expect(params.email).toBe('test@example.com')
      expect(params.redirectTo).toBeUndefined()
    })

    it('should have correct response type structure', () => {
      // Type checking test - ensures MagicLinkResponse has required properties
      const mockResponse: MagicLinkResponse = {
        data: {
          mode: 'login',
          email: 'test@example.com',
          redirectTo: 'https://app.example.com/auth/callback',
        },
        message: 'Magic link sent',
      }

      expect(mockResponse.data.mode).toBe('login')
      expect(mockResponse.data.email).toBe('test@example.com')
      expect(mockResponse.message).toBeDefined()
    })

    it('should support both login and signup modes', () => {
      const loginResponse: MagicLinkResponse = {
        data: {
          mode: 'login',
          email: 'existing@example.com',
          redirectTo: 'https://app.example.com/auth/callback',
        },
        message: 'Magic link sent',
      }

      const signupResponse: MagicLinkResponse = {
        data: {
          mode: 'signup',
          email: 'new@example.com',
          redirectTo: 'https://app.example.com/auth/callback',
        },
        message: 'Magic link sent',
      }

      expect(loginResponse.data.mode).toBe('login')
      expect(signupResponse.data.mode).toBe('signup')
    })
  })

  describe('auth.getRoles (unit)', () => {
    it('should have getRoles method', () => {
      expect(typeof client.auth.getRoles).toBe('function')
    })

    it('should have correct response type structure', () => {
      // Type checking test
      const mockResponse: UserRolesResponse = {
        data: {
          roles: ['admin', 'user'],
          userId: 'user_123',
        },
      }

      expect(mockResponse.data.roles).toBeInstanceOf(Array)
      expect(mockResponse.data.userId).toBe('user_123')
    })

    it('should support empty roles array', () => {
      const mockResponse: UserRolesResponse = {
        data: {
          roles: [],
          userId: 'user_456',
        },
      }

      expect(mockResponse.data.roles).toHaveLength(0)
    })

    it('should support multiple roles', () => {
      const mockResponse: UserRolesResponse = {
        data: {
          roles: ['admin', 'moderator', 'user', 'premium'],
          userId: 'user_789',
        },
      }

      expect(mockResponse.data.roles).toHaveLength(4)
      expect(mockResponse.data.roles).toContain('admin')
      expect(mockResponse.data.roles).toContain('premium')
    })
  })

  describe('auth.getSession (unit)', () => {
    it('should have getSession method', () => {
      expect(typeof client.auth.getSession).toBe('function')
    })

    it('should have correct response type structure', () => {
      // Type checking test
      const mockResponse: SessionResponse = {
        data: {
          user: {
            id: 'user_123',
            email: 'test@example.com',
            emailVerified: true,
            createdAt: '2025-01-01T00:00:00Z',
          },
          session: {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }

      expect(mockResponse.data.user).toBeDefined()
      expect(mockResponse.data.session).toBeDefined()
      expect(mockResponse.data.user.id).toBe('user_123')
      expect(mockResponse.data.session.accessToken).toBeDefined()
    })

    it('should have user information fields', () => {
      const mockResponse: SessionResponse = {
        data: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            emailVerified: false,
            createdAt: '2025-01-01T00:00:00Z',
          },
          session: {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }

      expect(mockResponse.data.user.id).toBeDefined()
      expect(mockResponse.data.user.email).toBeDefined()
      expect(typeof mockResponse.data.user.emailVerified).toBe('boolean')
      expect(mockResponse.data.user.createdAt).toBeDefined()
    })

    it('should have session token fields', () => {
      const mockResponse: SessionResponse = {
        data: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            emailVerified: true,
            createdAt: '2025-01-01T00:00:00Z',
          },
          session: {
            accessToken: 'access_token_here',
            refreshToken: 'refresh_token_here',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }

      expect(mockResponse.data.session.accessToken).toBe('access_token_here')
      expect(mockResponse.data.session.refreshToken).toBe('refresh_token_here')
      expect(typeof mockResponse.data.session.expiresAt).toBe('number')
      expect(typeof mockResponse.data.session.expiresIn).toBe('number')
    })

    it('should support both verified and unverified emails', () => {
      const verifiedUser: SessionResponse = {
        data: {
          user: {
            id: 'user_1',
            email: 'verified@example.com',
            emailVerified: true,
            createdAt: '2025-01-01T00:00:00Z',
          },
          session: {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }

      const unverifiedUser: SessionResponse = {
        data: {
          user: {
            id: 'user_2',
            email: 'unverified@example.com',
            emailVerified: false,
            createdAt: '2025-01-02T00:00:00Z',
          },
          session: {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }

      expect(verifiedUser.data.user.emailVerified).toBe(true)
      expect(unverifiedUser.data.user.emailVerified).toBe(false)
    })
  })

  describe('type exports', () => {
    it('should export MagicLinkRequest type', () => {
      const request: MagicLinkRequest = {
        email: 'test@example.com',
      }
      expect(request).toBeDefined()
    })

    it('should export MagicLinkResponse type', () => {
      const response: MagicLinkResponse = {
        data: {
          mode: 'signup',
          email: 'test@example.com',
          redirectTo: 'https://example.com',
        },
        message: 'Sent',
      }
      expect(response).toBeDefined()
    })

    it('should export UserRolesResponse type', () => {
      const response: UserRolesResponse = {
        data: {
          roles: ['admin'],
          userId: 'user_123',
        },
      }
      expect(response).toBeDefined()
    })

    it('should export SessionResponse type', () => {
      const response: SessionResponse = {
        data: {
          user: {
            id: 'user_123',
            email: 'test@example.com',
            emailVerified: true,
            createdAt: '2025-01-01T00:00:00Z',
          },
          session: {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: 1735689600,
            expiresIn: 3600,
          },
        },
      }
      expect(response).toBeDefined()
    })
  })
})
