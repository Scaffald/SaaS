import { BaseResource } from './base.js'

/**
 * Magic link authentication mode
 */
export type MagicLinkMode = 'login' | 'signup'

/**
 * Magic link request parameters
 */
export interface MagicLinkRequest {
  /**
   * User email address (will be normalized to lowercase and trimmed)
   */
  email: string

  /**
   * Optional redirect URL after authentication
   * Falls back to configured redirect URL if not provided
   */
  redirectTo?: string
}

/**
 * Magic link response data
 */
export interface MagicLinkData {
  /**
   * Authentication mode (login for existing users, signup for new users)
   */
  mode: MagicLinkMode

  /**
   * Normalized email address
   */
  email: string

  /**
   * Redirect URL that will be used
   */
  redirectTo: string
}

/**
 * Magic link response
 */
export interface MagicLinkResponse {
  data: MagicLinkData
  message: string
}

/**
 * User roles data
 */
export interface UserRolesData {
  /**
   * Array of role names assigned to the user
   */
  roles: string[]

  /**
   * User ID
   */
  userId: string
}

/**
 * User roles response
 */
export interface UserRolesResponse {
  data: UserRolesData
}

/**
 * User information
 */
export interface UserInfo {
  /**
   * User ID
   */
  id: string

  /**
   * User email address
   */
  email: string

  /**
   * Whether the email has been verified
   */
  emailVerified: boolean

  /**
   * User creation timestamp
   */
  createdAt: string
}

/**
 * Session information
 */
export interface SessionInfo {
  /**
   * JWT access token
   */
  accessToken: string

  /**
   * Refresh token for obtaining new access tokens
   */
  refreshToken: string

  /**
   * Unix timestamp when the session expires
   */
  expiresAt: number

  /**
   * Seconds until the session expires
   */
  expiresIn: number
}

/**
 * Session data
 */
export interface SessionData {
  /**
   * Current user information
   */
  user: UserInfo

  /**
   * Session token information
   */
  session: SessionInfo
}

/**
 * Session response
 */
export interface SessionResponse {
  data: SessionData
}

/**
 * Authentication resource
 *
 * Handles magic link authentication, session management, and user roles.
 *
 * @example
 * ```typescript
 * // Request magic link (public - no auth required)
 * const publicClient = new Scaffald({ baseUrl: 'http://localhost:54321' })
 * await publicClient.auth.requestMagicLink({
 *   email: 'user@example.com',
 *   redirectTo: 'https://app.example.com/auth/callback'
 * })
 *
 * // Get current user's roles (requires authentication)
 * const client = new Scaffald({ accessToken: 'user_token_here' })
 * const { data } = await client.auth.getRoles()
 * console.log(data.roles) // ['admin', 'moderator']
 *
 * // Get current session info
 * const session = await client.auth.getSession()
 * console.log(session.data.user.email)
 * console.log(session.data.session.expiresAt)
 * ```
 */
export class AuthResource extends BaseResource {
  /**
   * Request a magic link for authentication
   *
   * This endpoint is public and does not require authentication.
   * It will send an email with a magic link to the provided email address.
   *
   * @param params - Email and optional redirect URL
   * @returns Magic link response with mode (login/signup)
   *
   * @example
   * ```typescript
   * // Request magic link for new or existing user
   * const response = await client.auth.requestMagicLink({
   *   email: 'user@example.com',
   *   redirectTo: 'https://app.example.com/auth/callback'
   * })
   *
   * if (response.data.mode === 'signup') {
   *   console.log('New user signup')
   * } else {
   *   console.log('Existing user login')
   * }
   * ```
   */
  async requestMagicLink(params: MagicLinkRequest): Promise<MagicLinkResponse> {
    return this.client.post<MagicLinkResponse>('/v1/auth/magic-link', params)
  }

  /**
   * Get the current authenticated user's roles
   *
   * Requires authentication via access token or API key.
   *
   * @returns Array of role names assigned to the user
   *
   * @example
   * ```typescript
   * const { data } = await client.auth.getRoles()
   * console.log(data.roles) // ['admin', 'user']
   * console.log(data.userId)
   *
   * // Check if user has specific role
   * if (data.roles.includes('admin')) {
   *   console.log('User is an admin')
   * }
   * ```
   */
  async getRoles(): Promise<UserRolesResponse> {
    return this.client.get<UserRolesResponse>('/v1/auth/roles')
  }

  /**
   * Get the current session information
   *
   * Requires authentication via access token.
   * Returns user info and session details including token expiration.
   *
   * @returns Session data with user and token information
   *
   * @example
   * ```typescript
   * const { data } = await client.auth.getSession()
   *
   * // Access user information
   * console.log(data.user.email)
   * console.log(data.user.emailVerified)
   *
   * // Check session expiration
   * console.log(`Session expires in ${data.session.expiresIn} seconds`)
   *
   * // Use refresh token if needed
   * const refreshToken = data.session.refreshToken
   * ```
   */
  async getSession(): Promise<SessionResponse> {
    return this.client.get<SessionResponse>('/v1/auth/session')
  }
}
