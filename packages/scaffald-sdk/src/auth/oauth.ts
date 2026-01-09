import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce.js'

export interface OAuthConfig {
  clientId: string
  clientSecret?: string
  redirectUri: string
  baseUrl?: string
}

export interface AuthorizationUrlOptions {
  scope?: string[]
  state?: string
  codeVerifier?: string
}

export interface AuthorizationUrlResult {
  url: string
  state: string
  codeVerifier: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface TokenExchangeOptions {
  code: string
  codeVerifier: string
  clientSecret?: string
}

export class OAuthClient {
  private config: Required<OAuthConfig>

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.scaffald.com',
      clientSecret: config.clientSecret || '',
    }
  }

  /**
   * Generate an authorization URL with PKCE
   *
   * @param options - Authorization options
   * @returns Authorization URL, state, and code verifier
   *
   * @example
   * ```typescript
   * const oauth = new OAuthClient({
   *   clientId: 'your_client_id',
   *   redirectUri: 'https://yourapp.com/callback'
   * })
   *
   * const { url, state, codeVerifier } = await oauth.getAuthorizationUrl({
   *   scope: ['read:jobs', 'write:applications']
   * })
   *
   * // Store state and codeVerifier securely (e.g., session storage)
   * sessionStorage.setItem('oauth_state', state)
   * sessionStorage.setItem('oauth_verifier', codeVerifier)
   *
   * // Redirect user to authorization URL
   * window.location.href = url
   * ```
   */
  async getAuthorizationUrl(options: AuthorizationUrlOptions = {}): Promise<AuthorizationUrlResult> {
    const state = options.state || generateState()
    const codeVerifier = options.codeVerifier || generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    })

    if (options.scope && options.scope.length > 0) {
      params.append('scope', options.scope.join(' '))
    }

    const url = `${this.config.baseUrl}/oauth/authorize?${params.toString()}`

    return {
      url,
      state,
      codeVerifier,
    }
  }

  /**
   * Exchange authorization code for access token
   *
   * @param options - Token exchange options
   * @returns Access token and refresh token
   *
   * @example
   * ```typescript
   * // In your callback route handler
   * const code = new URL(window.location.href).searchParams.get('code')
   * const state = new URL(window.location.href).searchParams.get('state')
   * const codeVerifier = sessionStorage.getItem('oauth_verifier')
   *
   * // Verify state matches
   * if (state !== sessionStorage.getItem('oauth_state')) {
   *   throw new Error('State mismatch')
   * }
   *
   * const tokens = await oauth.exchangeCodeForToken({
   *   code,
   *   codeVerifier
   * })
   *
   * // Store tokens securely
   * localStorage.setItem('access_token', tokens.access_token)
   * ```
   */
  async exchangeCodeForToken(options: TokenExchangeOptions): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code: options.code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: options.codeVerifier,
    }

    if (options.clientSecret || this.config.clientSecret) {
      body.client_secret = options.clientSecret || this.config.clientSecret
    }

    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error_description || error.error || 'Token exchange failed')
    }

    return response.json()
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - The refresh token
   * @returns New access token and refresh token
   *
   * @example
   * ```typescript
   * const newTokens = await oauth.refreshToken(storedRefreshToken)
   * localStorage.setItem('access_token', newTokens.access_token)
   * if (newTokens.refresh_token) {
   *   localStorage.setItem('refresh_token', newTokens.refresh_token)
   * }
   * ```
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    }

    if (this.config.clientSecret) {
      body.client_secret = this.config.clientSecret
    }

    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error_description || error.error || 'Token refresh failed')
    }

    return response.json()
  }

  /**
   * Revoke an access or refresh token
   *
   * @param token - The token to revoke
   * @param tokenTypeHint - Optional hint about token type ('access_token' or 'refresh_token')
   *
   * @example
   * ```typescript
   * await oauth.revokeToken(accessToken, 'access_token')
   * localStorage.removeItem('access_token')
   * localStorage.removeItem('refresh_token')
   * ```
   */
  async revokeToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<void> {
    const body: Record<string, string> = {
      token,
      client_id: this.config.clientId,
    }

    if (tokenTypeHint) {
      body.token_type_hint = tokenTypeHint
    }

    if (this.config.clientSecret) {
      body.client_secret = this.config.clientSecret
    }

    const response = await fetch(`${this.config.baseUrl}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error_description || error.error || 'Token revocation failed')
    }
  }
}
