/**
 * Unit tests for the Procore API client.
 *
 * Procore is an external third-party service so mocking fetch is allowed
 * per project testing rules. We stub the global `fetch` using vitest and
 * validate that the client builds correct URLs, sends proper headers, and
 * handles pagination.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProcoreTokenResponse } from '@/server/lib/procore/types';

// ---------------------------------------------------------------------------
// Env setup — must happen before importing the client (which hard-fails
// without these vars).
// ---------------------------------------------------------------------------
const TEST_CLIENT_ID = 'test-client-id';
const TEST_CLIENT_SECRET = 'test-client-secret';
const TEST_REDIRECT_URI = 'http://localhost:3000/api/procore/callback';

describe('ProcoreClient', () => {
  let originalClientId: string | undefined;
  let originalClientSecret: string | undefined;
  let originalRedirectUri: string | undefined;

  beforeEach(() => {
    originalClientId = process.env.PROCORE_CLIENT_ID;
    originalClientSecret = process.env.PROCORE_CLIENT_SECRET;
    originalRedirectUri = process.env.PROCORE_REDIRECT_URI;

    process.env.PROCORE_CLIENT_ID = TEST_CLIENT_ID;
    process.env.PROCORE_CLIENT_SECRET = TEST_CLIENT_SECRET;
    process.env.PROCORE_REDIRECT_URI = TEST_REDIRECT_URI;
  });

  afterEach(() => {
    // Restore original env
    if (originalClientId !== undefined) {
      process.env.PROCORE_CLIENT_ID = originalClientId;
    } else {
      delete process.env.PROCORE_CLIENT_ID;
    }
    if (originalClientSecret !== undefined) {
      process.env.PROCORE_CLIENT_SECRET = originalClientSecret;
    } else {
      delete process.env.PROCORE_CLIENT_SECRET;
    }
    if (originalRedirectUri !== undefined) {
      process.env.PROCORE_REDIRECT_URI = originalRedirectUri;
    } else {
      delete process.env.PROCORE_REDIRECT_URI;
    }

    vi.restoreAllMocks();
    vi.resetModules();
  });

  // -----------------------------------------------------------------------
  // Helper to dynamically import the client (env vars must be set first)
  // -----------------------------------------------------------------------
  async function getClient() {
    const mod = await import('@/server/lib/procore/client');
    return new mod.ProcoreClient();
  }

  // -----------------------------------------------------------------------
  // Helper to create a mock fetch response
  // -----------------------------------------------------------------------
  function mockResponse(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: () => mockResponse(body, status),
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve(JSON.stringify(body)),
      bytes: () => Promise.resolve(new Uint8Array()),
    } as Response;
  }

  // -----------------------------------------------------------------------
  // Environment validation
  // -----------------------------------------------------------------------
  describe('environment validation', () => {
    it('throws when PROCORE_CLIENT_ID is missing', async () => {
      delete process.env.PROCORE_CLIENT_ID;
      vi.resetModules();

      await expect(
        import('@/server/lib/procore/client'),
      ).rejects.toThrow('Missing required env var: PROCORE_CLIENT_ID');
    });

    it('throws when PROCORE_CLIENT_SECRET is missing', async () => {
      delete process.env.PROCORE_CLIENT_SECRET;
      vi.resetModules();

      await expect(
        import('@/server/lib/procore/client'),
      ).rejects.toThrow('Missing required env var: PROCORE_CLIENT_SECRET');
    });
  });

  // -----------------------------------------------------------------------
  // getAuthorizationUrl
  // -----------------------------------------------------------------------
  describe('getAuthorizationUrl', () => {
    it('returns a correct OAuth authorize URL with state param', async () => {
      const client = await getClient();
      const url = client.getAuthorizationUrl('random-state-123');

      expect(url).toContain('https://login.procore.com/oauth/authorize');
      expect(url).toContain(`client_id=${TEST_CLIENT_ID}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=random-state-123');
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}`,
      );
    });
  });

  // -----------------------------------------------------------------------
  // exchangeCode
  // -----------------------------------------------------------------------
  describe('exchangeCode', () => {
    it('calls token endpoint with correct params and returns tokens', async () => {
      const tokenResponse: ProcoreTokenResponse = {
        access_token: 'access-abc',
        token_type: 'bearer',
        expires_in: 7200,
        refresh_token: 'refresh-xyz',
        created_at: 1700000000,
      };

      const mockFetch = vi.fn().mockResolvedValue(mockResponse(tokenResponse));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.exchangeCode('auth-code-123');

      expect(result).toEqual(tokenResponse);

      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://login.procore.com/oauth/token');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );

      // Verify the body contains the right params
      const body = new URLSearchParams(options.body);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('client_id')).toBe(TEST_CLIENT_ID);
      expect(body.get('client_secret')).toBe(TEST_CLIENT_SECRET);
      expect(body.get('redirect_uri')).toBe(TEST_REDIRECT_URI);
    });

    it('throws on non-OK response', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockResponse({ error: 'invalid_grant' }, 400));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();

      await expect(client.exchangeCode('bad-code')).rejects.toThrow(
        'Procore token exchange failed 400',
      );
    });
  });

  // -----------------------------------------------------------------------
  // refreshToken
  // -----------------------------------------------------------------------
  describe('refreshToken', () => {
    it('calls token endpoint with refresh_token grant type', async () => {
      const tokenResponse: ProcoreTokenResponse = {
        access_token: 'new-access',
        token_type: 'bearer',
        expires_in: 7200,
        refresh_token: 'new-refresh',
        created_at: 1700001000,
      };

      const mockFetch = vi.fn().mockResolvedValue(mockResponse(tokenResponse));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.refreshToken('old-refresh-token');

      expect(result).toEqual(tokenResponse);

      const [, options] = mockFetch.mock.calls[0];
      const body = new URLSearchParams(options.body);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('old-refresh-token');
    });
  });

  // -----------------------------------------------------------------------
  // fetchMe
  // -----------------------------------------------------------------------
  describe('fetchMe', () => {
    it('returns the authenticated user', async () => {
      const user = {
        id: 42,
        login: 'jdoe',
        name: 'Jane Doe',
        email_address: 'jane@example.com',
      };

      const mockFetch = vi.fn().mockResolvedValue(mockResponse(user));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchMe('my-token');

      expect(result).toEqual(user);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.procore.com/rest/v1.0/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // fetchCompanies
  // -----------------------------------------------------------------------
  describe('fetchCompanies', () => {
    it('returns list of companies', async () => {
      const companies = [
        { id: 1, name: 'Acme Corp', is_active: true },
        { id: 2, name: 'BuildCo', is_active: false },
      ];

      const mockFetch = vi.fn().mockResolvedValue(mockResponse(companies));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchCompanies('my-token');

      expect(result).toEqual(companies);
      expect(result).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // fetchProjects — pagination
  // -----------------------------------------------------------------------
  describe('fetchProjects', () => {
    it('paginates correctly across multiple pages', async () => {
      // Page 1: 100 projects (triggers next page fetch)
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Project ${i + 1}`,
      }));
      // Page 2: 1 project (< 100, so pagination stops)
      const page2 = [{ id: 101, name: 'Project 101' }];

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(mockResponse(page1))
        .mockResolvedValueOnce(mockResponse(page2));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchProjects('my-token', 999);

      expect(result).toHaveLength(101);
      expect(result[0].id).toBe(1);
      expect(result[100].id).toBe(101);

      // Verify pagination URLs
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const url1 = mockFetch.mock.calls[0][0] as string;
      expect(url1).toContain('company_id=999');
      expect(url1).toContain('limit=100');
      expect(url1).toContain('offset=0');

      const url2 = mockFetch.mock.calls[1][0] as string;
      expect(url2).toContain('offset=100');

      // Verify Procore-Company-Id header
      const headers1 = mockFetch.mock.calls[0][1].headers;
      expect(headers1['Procore-Company-Id']).toBe('999');
    });

    it('returns empty array when API returns no results', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse([]));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchProjects('my-token', 999);

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws on API error', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(mockResponse({ error: 'forbidden' }, 403));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();

      await expect(
        client.fetchProjects('bad-token', 999),
      ).rejects.toThrow('Procore API error 403');
    });
  });

  // -----------------------------------------------------------------------
  // fetchVendors
  // -----------------------------------------------------------------------
  describe('fetchVendors', () => {
    it('returns vendor list', async () => {
      const vendors = [
        { id: 10, name: 'Vendor A', is_active: true },
        { id: 20, name: 'Vendor B', is_active: false },
        { id: 30, name: 'Vendor C', email_address: 'c@example.com' },
      ];

      const mockFetch = vi.fn().mockResolvedValue(mockResponse(vendors));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchVendors('my-token', 555);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(vendors[0]);
      expect(result[2].email_address).toBe('c@example.com');

      // Verify correct endpoint
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('company-vendors');
      expect(url).toContain('company_id=555');

      // Verify company ID header
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Procore-Company-Id']).toBe('555');
    });

    it('paginates vendors when there are more than 100', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Vendor ${i + 1}`,
      }));
      const page2 = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        name: `Vendor ${i + 101}`,
      }));

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(mockResponse(page1))
        .mockResolvedValueOnce(mockResponse(page2));
      vi.stubGlobal('fetch', mockFetch);

      const client = await getClient();
      const result = await client.fetchVendors('my-token', 555);

      expect(result).toHaveLength(150);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
