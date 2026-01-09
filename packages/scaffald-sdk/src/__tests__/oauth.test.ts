import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { OAuthClient } from '../auth/oauth'
import { generateCodeVerifier } from '../auth/pkce'

describe('OAuth Client', () => {
  let oauth: OAuthClient

  beforeEach(() => {
    oauth = new OAuthClient({
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      redirectUri: 'https://myapp.com/callback',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with PKCE', async () => {
      const result = await oauth.getAuthorizationUrl({
        scope: ['read:jobs', 'write:applications'],
      })

      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('state')
      expect(result).toHaveProperty('codeVerifier')

      const url = new URL(result.url)
      expect(url.origin).toBe('https://api.scaffald.com')
      expect(url.pathname).toBe('/oauth/authorize')
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('client_id')).toBe('test_client_id')
      expect(url.searchParams.get('redirect_uri')).toBe('https://myapp.com/callback')
      expect(url.searchParams.get('code_challenge_method')).toBe('S256')
      expect(url.searchParams.get('code_challenge')).toBeTruthy()
      expect(url.searchParams.get('state')).toBe(result.state)
      expect(url.searchParams.get('scope')).toBe('read:jobs write:applications')
    })

    it('should accept custom state', async () => {
      const customState = 'my_custom_state_123'
      const result = await oauth.getAuthorizationUrl({ state: customState })

      expect(result.state).toBe(customState)
      const url = new URL(result.url)
      expect(url.searchParams.get('state')).toBe(customState)
    })

    it('should accept custom code verifier', async () => {
      const customVerifier = generateCodeVerifier()
      const result = await oauth.getAuthorizationUrl({ codeVerifier: customVerifier })

      expect(result.codeVerifier).toBe(customVerifier)
    })

    it('should work without scope', async () => {
      const result = await oauth.getAuthorizationUrl()

      const url = new URL(result.url)
      expect(url.searchParams.has('scope')).toBe(false)
    })
  })

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for tokens', async () => {
      server.use(
        http.post('https://api.scaffald.com/oauth/token', async ({ request }) => {
          const body = await request.json()

          expect(body).toMatchObject({
            grant_type: 'authorization_code',
            code: 'test_auth_code',
            client_id: 'test_client_id',
            redirect_uri: 'https://myapp.com/callback',
          })

          return HttpResponse.json({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh_token_123',
            scope: 'read:jobs write:applications',
          })
        })
      )

      const codeVerifier = generateCodeVerifier()
      const tokens = await oauth.exchangeCodeForToken({
        code: 'test_auth_code',
        codeVerifier,
      })

      expect(tokens).toMatchObject({
        access_token: 'access_token_123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh_token_123',
        scope: 'read:jobs write:applications',
      })
    })

    it('should handle token exchange errors', async () => {
      server.use(
        http.post('https://api.scaffald.com/oauth/token', () => {
          return HttpResponse.json(
            {
              error: 'invalid_grant',
              error_description: 'Authorization code is invalid or expired',
            },
            { status: 400 }
          )
        })
      )

      const codeVerifier = generateCodeVerifier()
      await expect(
        oauth.exchangeCodeForToken({
          code: 'invalid_code',
          codeVerifier,
        })
      ).rejects.toThrow('Authorization code is invalid or expired')
    })

    it('should include client secret when provided', async () => {
      let receivedBody: any

      server.use(
        http.post('https://api.scaffald.com/oauth/token', async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
          })
        })
      )

      const codeVerifier = generateCodeVerifier()
      await oauth.exchangeCodeForToken({
        code: 'test_code',
        codeVerifier,
        clientSecret: 'custom_secret',
      })

      expect(receivedBody.client_secret).toBe('custom_secret')
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      server.use(
        http.post('https://api.scaffald.com/oauth/token', async ({ request }) => {
          const body = await request.json()

          expect(body).toMatchObject({
            grant_type: 'refresh_token',
            refresh_token: 'old_refresh_token',
            client_id: 'test_client_id',
            client_secret: 'test_client_secret',
          })

          return HttpResponse.json({
            access_token: 'new_access_token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'new_refresh_token',
          })
        })
      )

      const tokens = await oauth.refreshToken('old_refresh_token')

      expect(tokens).toMatchObject({
        access_token: 'new_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new_refresh_token',
      })
    })

    it('should handle refresh errors', async () => {
      server.use(
        http.post('https://api.scaffald.com/oauth/token', () => {
          return HttpResponse.json(
            {
              error: 'invalid_grant',
              error_description: 'Refresh token is invalid or expired',
            },
            { status: 400 }
          )
        })
      )

      await expect(oauth.refreshToken('invalid_token')).rejects.toThrow(
        'Refresh token is invalid or expired'
      )
    })
  })

  describe('revokeToken', () => {
    it('should revoke a token', async () => {
      let receivedBody: any

      server.use(
        http.post('https://api.scaffald.com/oauth/revoke', async ({ request }) => {
          receivedBody = await request.json()
          return new HttpResponse(null, { status: 200 })
        })
      )

      await oauth.revokeToken('token_to_revoke', 'access_token')

      expect(receivedBody).toMatchObject({
        token: 'token_to_revoke',
        token_type_hint: 'access_token',
        client_id: 'test_client_id',
        client_secret: 'test_client_secret',
      })
    })

    it('should work without token type hint', async () => {
      let receivedBody: any

      server.use(
        http.post('https://api.scaffald.com/oauth/revoke', async ({ request }) => {
          receivedBody = await request.json()
          return new HttpResponse(null, { status: 200 })
        })
      )

      await oauth.revokeToken('token_to_revoke')

      expect(receivedBody.token).toBe('token_to_revoke')
      expect(receivedBody.token_type_hint).toBeUndefined()
    })

    it('should handle revocation errors', async () => {
      server.use(
        http.post('https://api.scaffald.com/oauth/revoke', () => {
          return HttpResponse.json(
            {
              error: 'unsupported_token_type',
              error_description: 'Token type not supported',
            },
            { status: 400 }
          )
        })
      )

      await expect(oauth.revokeToken('invalid_token')).rejects.toThrow('Token type not supported')
    })
  })

  describe('OAuth Client without client secret', () => {
    it('should work for public clients (no client secret)', async () => {
      const publicOAuth = new OAuthClient({
        clientId: 'public_client_id',
        redirectUri: 'https://myapp.com/callback',
      })

      let receivedBody: any

      server.use(
        http.post('https://api.scaffald.com/oauth/token', async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({
            access_token: 'access_token_123',
            token_type: 'Bearer',
            expires_in: 3600,
          })
        })
      )

      const codeVerifier = generateCodeVerifier()
      await publicOAuth.exchangeCodeForToken({
        code: 'test_code',
        codeVerifier,
      })

      expect(receivedBody.client_secret).toBeUndefined()
    })
  })
})
