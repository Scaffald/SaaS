import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RequestMagicLinkParams {
  email: string
  redirectTo?: string
}

export interface RequestMagicLinkResponse {
  mode: 'login' | 'signup'
  email: string
  redirectTo: string
}

export interface GetUserRolesResponse {
  roles: string[]
}

// ============================================================================
// AUTH RESOURCE
// ============================================================================

/**
 * Auth resource for authentication-related operations
 *
 * @remarks
 * Handles magic link requests and user role retrieval.
 * Requires supabaseToken (user JWT) for getUserRoles.
 * requestMagicLink is public (uses anon key or no auth).
 */
export class Auth extends Resource {
  /**
   * Request a magic link email for login/signup
   *
   * @param params - Email and optional redirect URL
   * @returns Response with mode (login/signup), email, redirectTo
   */
  async requestMagicLink(params: RequestMagicLinkParams): Promise<RequestMagicLinkResponse> {
    const response = (await this.post<{ data: RequestMagicLinkResponse }>(
      '/v1/auth/magic-link',
      params
    )) as { data: RequestMagicLinkResponse }
    return response.data
  }

  /**
   * Get roles for the authenticated user
   *
   * @returns List of role names assigned to the current user
   */
  async getUserRoles(): Promise<GetUserRolesResponse> {
    const response = (await this.get<{ data: { roles: string[] } }>(
      '/v1/auth/roles'
    )) as { data: { roles: string[] } }
    return { roles: response.data.roles }
  }
}
