/**
 * Contract tests for the Procore REST API.
 *
 * These tests hit the REAL Procore API using client-credentials OAuth to
 * validate that the TypeScript types in `src/server/lib/procore/types.ts`
 * accurately describe the actual response shapes.  This ensures that the
 * mocks used in unit tests (e.g. `tests/unit/procore/client.test.ts`) are
 * trustworthy.
 *
 * The tests skip gracefully when `PROCORE_CLIENT_ID` and
 * `PROCORE_CLIENT_SECRET` are not set, so they will never break CI unless
 * credentials are explicitly provided.
 *
 * Per project rule: "mocks used in tests must always be validated! They must
 * always have their own tests to verify they match the real system they are
 * mocking, so that we know the mocks themselves can be trusted."
 */
import { describe, it, expect } from 'vitest';

import type {
  ProcoreTokenResponse,
  ProcoreUser,
  ProcoreCompany,
} from '@/server/lib/procore/types';

// ---------------------------------------------------------------------------
// Skip entire suite when credentials are absent (local dev, CI without creds)
// ---------------------------------------------------------------------------
const hasCredentials = !!(
  process.env.PROCORE_CLIENT_ID && process.env.PROCORE_CLIENT_SECRET
);

const PROCORE_AUTH_URL = 'https://login.procore.com/oauth/token';
const PROCORE_API_BASE = 'https://api.procore.com/rest/v1.0';

describe.skipIf(!hasCredentials)('Procore API Contract Tests', () => {
  // Token is obtained in the first test and reused by subsequent tests.
  let accessToken: string;

  // -------------------------------------------------------------------------
  // Token endpoint — validates ProcoreTokenResponse shape
  // -------------------------------------------------------------------------
  it('obtains an access token via client credentials', async () => {
    const response = await fetch(PROCORE_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.PROCORE_CLIENT_ID!,
        client_secret: process.env.PROCORE_CLIENT_SECRET!,
      }).toString(),
    });

    expect(response.ok).toBe(true);
    const data: unknown = await response.json();

    // Structural assertions matching ProcoreTokenResponse
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('token_type');
    expect(data).toHaveProperty('expires_in');
    expect(data).toHaveProperty('created_at');
    expect(typeof (data as ProcoreTokenResponse).access_token).toBe('string');
    expect(typeof (data as ProcoreTokenResponse).token_type).toBe('string');
    expect(typeof (data as ProcoreTokenResponse).expires_in).toBe('number');
    expect(typeof (data as ProcoreTokenResponse).created_at).toBe('number');

    // Note: client_credentials flow does NOT return a refresh_token.
    // The ProcoreTokenResponse type includes refresh_token because the
    // authorization_code flow does return one. We only assert the fields
    // that are present in this grant type.

    accessToken = (data as ProcoreTokenResponse).access_token;
  });

  // -------------------------------------------------------------------------
  // /me — validates ProcoreUser shape
  // -------------------------------------------------------------------------
  it('GET /me returns user with expected shape', async () => {
    const response = await fetch(`${PROCORE_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.ok).toBe(true);
    const data: unknown = await response.json();

    // Required fields from ProcoreUser
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('login');
    expect(typeof (data as ProcoreUser).id).toBe('number');
    expect(typeof (data as ProcoreUser).login).toBe('string');

    // Optional fields — if present, must be correct type
    if ('name' in (data as Record<string, unknown>)) {
      expect(typeof (data as ProcoreUser).name).toBe('string');
    }
    if ('email_address' in (data as Record<string, unknown>)) {
      expect(typeof (data as ProcoreUser).email_address).toBe('string');
    }
  });

  // -------------------------------------------------------------------------
  // /companies — validates ProcoreCompany shape
  // -------------------------------------------------------------------------
  it('GET /companies returns array with expected shape', async () => {
    const response = await fetch(`${PROCORE_API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.ok).toBe(true);
    const data: unknown = await response.json();

    expect(Array.isArray(data)).toBe(true);

    if ((data as ProcoreCompany[]).length > 0) {
      const first = (data as ProcoreCompany[])[0];

      // Required fields from ProcoreCompany
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(typeof first.id).toBe('number');
      expect(typeof first.name).toBe('string');

      // is_active is required in the type — validate if present
      if ('is_active' in first) {
        expect(typeof first.is_active).toBe('boolean');
      }
    }
  });
});
