/**
 * Typed Procore REST API client with OAuth token management and
 * automatic offset-based pagination.
 *
 * Environment requirements (hard-fail at import time):
 *   PROCORE_CLIENT_ID     - OAuth2 client ID
 *   PROCORE_CLIENT_SECRET - OAuth2 client secret
 *   PROCORE_REDIRECT_URI  - OAuth2 redirect URI (used in authorization flow)
 */
import type {
  ProcoreCompany,
  ProcoreProject,
  ProcoreTokenResponse,
  ProcoreUser,
  ProcoreVendor,
} from './types';

// ---------------------------------------------------------------------------
// Environment validation — fail fast on missing credentials
// ---------------------------------------------------------------------------
const clientId = process.env.PROCORE_CLIENT_ID;
if (!clientId) {
  throw new Error('Missing required env var: PROCORE_CLIENT_ID');
}

const clientSecret = process.env.PROCORE_CLIENT_SECRET;
if (!clientSecret) {
  throw new Error('Missing required env var: PROCORE_CLIENT_SECRET');
}

const redirectUri = process.env.PROCORE_REDIRECT_URI ?? '';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AUTH_BASE = 'https://login.procore.com';
const API_BASE = 'https://api.procore.com';
const PAGE_LIMIT = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Perform a paginated GET against the Procore API. Accumulates all pages
 * into a single array by incrementing `offset` by `PAGE_LIMIT` until the
 * response contains fewer than `PAGE_LIMIT` items.
 */
async function paginatedGet<T>(
  url: string,
  accessToken: string,
  headers: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;

  // eslint-disable-next-line no-constant-condition -- pagination loop
  while (true) {
    const separator = url.includes('?') ? '&' : '?';
    const pagedUrl = `${url}${separator}limit=${PAGE_LIMIT}&offset=${offset}`;

    const res = await fetch(pagedUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!res.ok) {
      throw new Error(
        `Procore API error ${res.status}: ${res.statusText} — ${pagedUrl}`,
      );
    }

    const page: T[] = (await res.json()) as T[];
    results.push(...page);

    if (page.length < PAGE_LIMIT) {
      break;
    }
    offset += PAGE_LIMIT;
  }

  return results;
}

// ---------------------------------------------------------------------------
// ProcoreClient
// ---------------------------------------------------------------------------

export class ProcoreClient {
  // ------------------------------------------------------------------
  // OAuth helpers
  // ------------------------------------------------------------------

  /**
   * Build the Procore OAuth2 authorization URL that the user should be
   * redirected to in order to grant access.
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    return `${AUTH_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for an access + refresh token pair.
   */
  async exchangeCode(code: string): Promise<ProcoreTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const res = await fetch(`${AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(
        `Procore token exchange failed ${res.status}: ${res.statusText}`,
      );
    }

    return (await res.json()) as ProcoreTokenResponse;
  }

  /**
   * Use a refresh token to obtain a new access token.
   */
  async refreshToken(refreshToken: string): Promise<ProcoreTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(`${AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(
        `Procore token refresh failed ${res.status}: ${res.statusText}`,
      );
    }

    return (await res.json()) as ProcoreTokenResponse;
  }

  // ------------------------------------------------------------------
  // API endpoints
  // ------------------------------------------------------------------

  /**
   * GET /rest/v1.0/me — returns the authenticated user.
   */
  async fetchMe(accessToken: string): Promise<ProcoreUser> {
    const res = await fetch(`${API_BASE}/rest/v1.0/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Procore /me failed ${res.status}: ${res.statusText}`,
      );
    }

    return (await res.json()) as ProcoreUser;
  }

  /**
   * GET /rest/v1.0/companies — returns all companies visible to the user.
   */
  async fetchCompanies(accessToken: string): Promise<ProcoreCompany[]> {
    const res = await fetch(`${API_BASE}/rest/v1.0/companies`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Procore /companies failed ${res.status}: ${res.statusText}`,
      );
    }

    return (await res.json()) as ProcoreCompany[];
  }

  /**
   * GET /rest/v1.1/projects — returns all projects for a company.
   * Automatically paginates through all results.
   */
  async fetchProjects(
    accessToken: string,
    companyId: number,
  ): Promise<ProcoreProject[]> {
    return paginatedGet<ProcoreProject>(
      `${API_BASE}/rest/v1.1/projects?company_id=${companyId}`,
      accessToken,
      { 'Procore-Company-Id': String(companyId) },
    );
  }

  /**
   * GET /rest/v1/company-vendors — returns all vendors for a company.
   * Automatically paginates through all results.
   */
  async fetchVendors(
    accessToken: string,
    companyId: number,
  ): Promise<ProcoreVendor[]> {
    return paginatedGet<ProcoreVendor>(
      `${API_BASE}/rest/v1/company-vendors?company_id=${companyId}`,
      accessToken,
      { 'Procore-Company-Id': String(companyId) },
    );
  }
}
