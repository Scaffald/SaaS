import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js'

/**
 * OAuth scope
 */
export type OAuthScope =
  | 'read:jobs'
  | 'read:applications'
  | 'write:applications'
  | 'read:profile'
  | 'write:profile'

/**
 * Authorization URL options
 */
export interface AuthorizationUrlOptions {
  clientId: string
  redirectUri: string
  scope: OAuthScope[]
  state?: string
}

/**
 * Authorization URL result
 */
export interface AuthorizationUrlResult {
  url: string
  codeVerifier: string
  state: string
}

/**
 * Token exchange options
 */
export interface TokenExchangeOptions {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret?: string
  redirectUri: string
}

/**
 * Token response
 */
export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

/**
 * OAuth 2.0 client with PKCE support
 */
export class OAuthClient {
  private baseUrl: string

  constructor(baseUrl = 'https://api.scaffald.com') {
    this.baseUrl = baseUrl
  }

  /**
   * Get authorization URL with PKCE
   *
   * @param options - Authorization URL options
   * @returns Authorization URL, code verifier, and state
   *
   * @example
   * ```typescript
   * const oauth = new OAuthClient()
   * const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
   *   clientId: 'your_client_id',
   *   redirectUri: 'https://yourapp.com/callback',
   *   scope: ['read:jobs', 'write:applications']
   * })
   *
   * // Store codeVerifier and state securely
   * sessionStorage.setItem('pkce_verifier', codeVerifier)
   * sessionStorage.setItem('oauth_state', state)
   *
   * // Redirect user to authorization URL
   * window.location.href = url
   * ```
   */
  async getAuthorizationUrl(options: AuthorizationUrlOptions): Promise<AuthorizationUrlResult> {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = options.state || generateState()

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      scope: options.scope.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    })

    const url = `${this.baseUrl}/oauth/authorize?${params.toString()}`

    return {
      url,
      codeVerifier,
      state,
    }
  }

  /**
   * Exchange authorization code for access token
   *
   * @param options - Token exchange options
   * @returns Token response with access and refresh tokens
   *
   * @example
   * ```typescript
   * // In your OAuth callback handler
   * const code = new URL(window.location.href).searchParams.get('code')
   * const state = new URL(window.location.href).searchParams.get('state')
   * const storedState = sessionStorage.getItem('oauth_state')
   *
   * // Verify state to prevent CSRF
   * if (state !== storedState) {
   *   throw new Error('Invalid state parameter')
   * }
   *
   * const codeVerifier = sessionStorage.getItem('pkce_verifier')
   * const tokens = await oauth.exchangeCode({
   *   code,
   *   codeVerifier,
   *   clientId: 'your_client_id',
   *   redirectUri: 'https://yourapp.com/callback'
   * })
   *
   * // Store access token securely
   * localStorage.setItem('access_token', tokens.access_token)
   *
   * // Create authenticated SDK client
   * const client = new Scaffald({ accessToken: tokens.access_token })
   * ```
   */
  async exchangeCode(options: TokenExchangeOptions): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: options.code,
      code_verifier: options.codeVerifier,
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
    })

    if (options.clientSecret) {
      body.append('client_secret', options.clientSecret)
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    return response.json()
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - The refresh token
   * @param clientId - Your OAuth client ID
   * @param clientSecret - Your OAuth client secret (optional)
   * @returns New token response
   *
   * @example
   * ```typescript
   * const refreshToken = localStorage.getItem('refresh_token')
   * const tokens = await oauth.refreshToken(refreshToken, 'your_client_id')
   *
   * // Update stored tokens
   * localStorage.setItem('access_token', tokens.access_token)
   * localStorage.setItem('refresh_token', tokens.refresh_token)
   * ```
   */
  async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret?: string
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    })

    if (clientSecret) {
      body.append('client_secret', clientSecret)
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token refresh failed: ${error}`)
    }

    return response.json()
  }

  /**
   * Revoke access or refresh token
   *
   * @param token - The token to revoke
   * @param tokenTypeHint - Type of token ('access_token' or 'refresh_token')
   * @param clientId - Your OAuth client ID
   * @param clientSecret - Your OAuth client secret (optional)
   *
   * @example
   * ```typescript
   * const accessToken = localStorage.getItem('access_token')
   * await oauth.revokeToken(accessToken, 'access_token', 'your_client_id')
   *
   * // Clear stored tokens
   * localStorage.removeItem('access_token')
   * localStorage.removeItem('refresh_token')
   * ```
   */
  async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token',
    clientId: string,
    clientSecret?: string
  ): Promise<void> {
    const body = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: clientId,
    })

    if (clientSecret) {
      body.append('client_secret', clientSecret)
    }

    const response = await fetch(`${this.baseUrl}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token revocation failed: ${error}`)
    }
  }
}
