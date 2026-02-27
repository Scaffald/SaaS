import { Resource } from './base.js'

// =====================================================
// Types
// =====================================================

export interface OAuthAppDetails {
  id: string
  name: string
  logo_url: string | null
  homepage_url: string | null
  description: string | null
  privacy_policy_url: string | null
  terms_of_service_url: string | null
}

export interface RegisterAppParams {
  name: string
  description: string
  homepage_url: string
  redirect_uris: string[]
  logo_url?: string
  privacy_policy_url?: string
  terms_of_service_url?: string
  developer_email: string
}

export interface RegisterAppResponse {
  client_id: string
  client_secret: string
}

export interface GrantConsentParams {
  oauth_app_id: string
  scopes: string[]
  remember?: boolean
  state: string
  redirect_uri: string
  code_challenge: string
  code_challenge_method?: string
}

export interface GrantConsentResponse {
  redirect_url: string
}

export interface UserConsent {
  id: string
  granted_scopes: string[]
  granted_at: string
  expires_at: string | null
  oauth_app: {
    id: string
    display_name: string
    description: string | null
    logo_url: string | null
    homepage_url: string | null
  } | null
}

export interface ListUserConsentsResponse {
  consents: UserConsent[]
}

export interface OAuthAppAdmin {
  id: string
  client_id: string
  display_name: string
  description: string | null
  status: 'pending' | 'active' | 'trusted' | 'suspended' | 'revoked'
  created_at: string
  approved_at: string | null
  owner_email: string | null
  redirect_uris: string[]
  allowed_scopes: string[]
  requires_approval: boolean
  homepage_url: string | null
  privacy_policy_url: string | null
  terms_of_service_url: string | null
  logo_url: string | null
}

export interface ListAppsParams {
  status?: 'all' | 'pending' | 'active' | 'trusted' | 'suspended' | 'revoked'
  search?: string
}

export interface ListAppsResponse {
  apps: OAuthAppAdmin[]
}

export interface OAuthScope {
  id: string
  scope: string
  display_name: string
  description: string | null
}

export interface ListScopesResponse {
  scopes: OAuthScope[]
}

export interface ApproveAppParams {
  allowed_scopes: string[]
  trust_level?: 'active' | 'trusted'
}

// =====================================================
// Resource class
// =====================================================

export class OAuthManagement extends Resource {
  async getAppDetails(clientId: string): Promise<OAuthAppDetails> {
    return this.get<OAuthAppDetails>(`/v1/oauth/apps/${clientId}`)
  }

  async registerApp(params: RegisterAppParams): Promise<RegisterAppResponse> {
    return this.post<RegisterAppResponse>('/v1/oauth/apps', params)
  }

  async grantConsent(params: GrantConsentParams): Promise<GrantConsentResponse> {
    return this.post<GrantConsentResponse>('/v1/oauth/consent/grant', params)
  }

  async listUserConsents(): Promise<ListUserConsentsResponse> {
    return this.get<ListUserConsentsResponse>('/v1/oauth/consent')
  }

  async revokeConsent(consentId: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/oauth/consent/${consentId}`)
  }

  async adminListApps(params?: ListAppsParams): Promise<ListAppsResponse> {
    return this.get<ListAppsResponse>('/v1/oauth/admin/apps', params as Record<string, string>)
  }

  async adminGetAppDetail(appId: string): Promise<{ app: OAuthAppAdmin }> {
    return this.get<{ app: OAuthAppAdmin }>(`/v1/oauth/admin/apps/${appId}`)
  }

  async adminListScopes(): Promise<ListScopesResponse> {
    return this.get<ListScopesResponse>('/v1/oauth/admin/scopes')
  }

  async adminApproveApp(appId: string, params: ApproveAppParams): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v1/oauth/admin/apps/${appId}/approve`, params)
  }

  async adminRejectApp(appId: string, reason?: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v1/oauth/admin/apps/${appId}/reject`, { reason })
  }

  async adminSuspendApp(appId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v1/oauth/admin/apps/${appId}/suspend`, {})
  }
}
