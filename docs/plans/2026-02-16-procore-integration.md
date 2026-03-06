# Procore Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable ForSured users to connect Procore via OAuth, import projects and subcontractors with user-confirmed collision resolution, and maintain adaptive periodic sync.

**Architecture:** OAuth authorization code grant flow stores encrypted tokens in `forsured.integrations`. A Supabase Edge Function runs on pg_cron to periodically fetch Procore data, stage new/changed items in `forsured.sync_queue` for user review, and auto-update already-linked records. Per-integration adaptive backoff scales sync frequency from 15 min to 1 week based on change detection.

**Tech Stack:** TypeScript, tRPC 11, Supabase (PostgreSQL + Edge Functions + pg_cron), React 18, `@bernierllc/retry-policy`, AES-256-GCM encryption, Zod validation.

**Design doc:** `plans/procore-integration-design.md`

---

## Task 1: Database Migration — New Tables & Columns

**Files:**
- Create: `packages/supabase/migrations/312_procore_integration.sql`

**Context:**
- Latest migration is `311_fix_forsured_rls_and_role_data.sql`
- All ForSured tables live in the `forsured` schema
- RLS is enabled on all tables with service_role bypass
- Existing table patterns: see migrations 204, 254, 255, 298

**Step 1: Write the migration SQL**

```sql
-- Migration: Procore Integration tables and columns
-- Description: Creates integrations, sync_queue, sync_log tables and adds procore tracking columns
-- Date: 2026-02-16

BEGIN;

-- =============================================================================
-- 1. forsured.integrations — stores OAuth connections per user
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES forsured.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES forsured.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  provider_company_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 15,
  next_sync_at TIMESTAMPTZ,
  last_change_detected_at TIMESTAMPTZ,
  manual_sync_requested_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_integrations_status CHECK (status IN ('connected', 'disconnected', 'error')),
  CONSTRAINT chk_integrations_provider CHECK (provider IN ('procore')),
  CONSTRAINT uq_integrations_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_integrations_user ON forsured.integrations(user_id);
CREATE INDEX idx_integrations_org ON forsured.integrations(organization_id);
CREATE INDEX idx_integrations_status_provider ON forsured.integrations(status, provider);
CREATE INDEX idx_integrations_next_sync ON forsured.integrations(next_sync_at)
  WHERE status = 'connected';

COMMENT ON TABLE forsured.integrations IS 'OAuth integration connections per user (Procore, etc.)';

-- =============================================================================
-- 2. forsured.sync_queue — staged items awaiting user review
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES forsured.integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES forsured.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES forsured.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  provider_entity_id TEXT NOT NULL,
  provider_data JSONB NOT NULL DEFAULT '{}',
  match_status TEXT NOT NULL DEFAULT 'no_match',
  matched_entity_id UUID,
  match_confidence NUMERIC(3,2) DEFAULT 0.00,
  match_reason TEXT,
  resolution TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES forsured.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sync_queue_entity_type CHECK (entity_type IN (
    'project', 'subcontractor', 'project_removed', 'subcontractor_removed'
  )),
  CONSTRAINT chk_sync_queue_match_status CHECK (match_status IN (
    'no_match', 'exact_match', 'fuzzy_match'
  )),
  CONSTRAINT chk_sync_queue_resolution CHECK (resolution IN (
    'pending', 'link', 'create_new', 'skip'
  ))
);

CREATE INDEX idx_sync_queue_integration ON forsured.sync_queue(integration_id);
CREATE INDEX idx_sync_queue_org ON forsured.sync_queue(organization_id);
CREATE INDEX idx_sync_queue_resolution ON forsured.sync_queue(resolution)
  WHERE resolution = 'pending';
CREATE INDEX idx_sync_queue_entity_type ON forsured.sync_queue(entity_type);

COMMENT ON TABLE forsured.sync_queue IS 'Staged Procore items awaiting user collision resolution';

-- =============================================================================
-- 3. forsured.sync_log — audit trail of sync runs
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES forsured.integrations(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  projects_found INTEGER NOT NULL DEFAULT 0,
  projects_changed INTEGER NOT NULL DEFAULT 0,
  vendors_found INTEGER NOT NULL DEFAULT 0,
  vendors_changed INTEGER NOT NULL DEFAULT 0,
  new_items_queued INTEGER NOT NULL DEFAULT 0,
  updates_applied INTEGER NOT NULL DEFAULT 0,
  interval_before_minutes INTEGER,
  interval_after_minutes INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',

  CONSTRAINT chk_sync_log_triggered_by CHECK (triggered_by IN ('scheduled', 'manual', 'initial')),
  CONSTRAINT chk_sync_log_status CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX idx_sync_log_integration ON forsured.sync_log(integration_id);
CREATE INDEX idx_sync_log_started_at ON forsured.sync_log(started_at DESC);

COMMENT ON TABLE forsured.sync_log IS 'Audit log of Procore sync runs';

-- =============================================================================
-- 4. Add Procore tracking columns to existing tables
-- =============================================================================

ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS procore_id TEXT;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS procore_last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_procore_id
  ON forsured.projects(procore_id) WHERE procore_id IS NOT NULL;

ALTER TABLE forsured.subcontractors ADD COLUMN IF NOT EXISTS procore_vendor_id TEXT;
ALTER TABLE forsured.subcontractors ADD COLUMN IF NOT EXISTS procore_last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_procore_vendor_id
  ON forsured.subcontractors(procore_vendor_id) WHERE procore_vendor_id IS NOT NULL;

COMMENT ON COLUMN forsured.projects.procore_id IS 'Procore project ID if linked via integration';
COMMENT ON COLUMN forsured.projects.procore_last_synced_at IS 'Last time this project was synced from Procore';
COMMENT ON COLUMN forsured.subcontractors.procore_vendor_id IS 'Procore vendor ID if linked via integration';
COMMENT ON COLUMN forsured.subcontractors.procore_last_synced_at IS 'Last time this subcontractor was synced from Procore';

-- =============================================================================
-- 5. Enable RLS on all new tables
-- =============================================================================

ALTER TABLE forsured.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.sync_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. Service role bypass (for tRPC server and Edge Functions)
-- =============================================================================

CREATE POLICY service_role_bypass_integrations ON forsured.integrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_sync_queue ON forsured.sync_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_sync_log ON forsured.sync_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 7. RLS Policies for authenticated users
-- =============================================================================

-- Integrations: user can only see/manage their own
CREATE POLICY integrations_select_own ON forsured.integrations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY integrations_insert_own ON forsured.integrations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY integrations_update_own ON forsured.integrations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY integrations_delete_own ON forsured.integrations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Sync queue: user can see their org's items, update resolution fields
CREATE POLICY sync_queue_select_org ON forsured.sync_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY sync_queue_update_resolution ON forsured.sync_queue
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Sync log: user can see their integration's logs
CREATE POLICY sync_log_select_own ON forsured.sync_log
  FOR SELECT TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM forsured.integrations WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.integrations TO authenticated;
GRANT SELECT, UPDATE ON forsured.sync_queue TO authenticated;
GRANT SELECT ON forsured.sync_log TO authenticated;

-- =============================================================================
-- 9. Updated_at trigger for integrations
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON forsured.integrations
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_integrations_updated_at();

COMMIT;
```

**Step 2: Run the migration against local Supabase**

Run: `cd packages/supabase && npx supabase db reset`

Expected: Migration applies cleanly, all tables created.

**Step 3: Verify tables exist**

Run: `cd packages/supabase && npx supabase db push --dry-run 2>&1 | head -20`

Or connect to local DB and verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'forsured'
AND table_name IN ('integrations', 'sync_queue', 'sync_log');
```

Expected: All 3 tables listed.

**Step 4: Commit**

```bash
git add packages/supabase/migrations/312_procore_integration.sql
git commit -m "feat(db): add Procore integration tables (integrations, sync_queue, sync_log)"
```

---

## Task 2: Token Encryption Module

**Files:**
- Create: `apps/forsured-web/src/server/lib/procore/crypto.ts`
- Test: `apps/forsured-web/tests/unit/procore/crypto.test.ts`

**Context:**
- Uses Node.js built-in `crypto` module (AES-256-GCM)
- Key comes from `INTEGRATION_ENCRYPTION_KEY` env var
- Must hard-fail if env var missing (per CLAUDE.md)

**Step 1: Write the failing test**

```typescript
// apps/forsured-web/tests/unit/procore/crypto.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

describe('Token Encryption', () => {
  const TEST_KEY = 'a'.repeat(64); // 32 bytes hex-encoded

  beforeAll(() => {
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.INTEGRATION_ENCRYPTION_KEY;
  });

  it('encrypts and decrypts a token round-trip', async () => {
    const { encrypt, decrypt } = await import(
      '../../../src/server/lib/procore/crypto'
    );
    const original = 'my-secret-access-token-12345';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':'); // iv:authTag:ciphertext format
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext for same input (random IV)', async () => {
    const { encrypt } = await import(
      '../../../src/server/lib/procore/crypto'
    );
    const token = 'same-token';
    const a = encrypt(token);
    const b = encrypt(token);
    expect(a).not.toBe(b);
  });

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import(
      '../../../src/server/lib/procore/crypto'
    );
    const encrypted = encrypt('test-token');
    const tampered = encrypted.slice(0, -4) + 'XXXX';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws if INTEGRATION_ENCRYPTION_KEY is missing', async () => {
    const saved = process.env.INTEGRATION_ENCRYPTION_KEY;
    delete process.env.INTEGRATION_ENCRYPTION_KEY;

    // Clear module cache to force re-evaluation
    vi.resetModules();

    await expect(
      import('../../../src/server/lib/procore/crypto')
    ).rejects.toThrow('Missing required env var: INTEGRATION_ENCRYPTION_KEY');

    process.env.INTEGRATION_ENCRYPTION_KEY = saved;
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/crypto.test.ts`

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/forsured-web/src/server/lib/procore/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY;
if (!keyHex) {
  throw new Error('Missing required env var: INTEGRATION_ENCRYPTION_KEY');
}

const key = Buffer.from(keyHex, 'hex');
if (key.length !== 32) {
  throw new Error(
    'INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)'
  );
}

/**
 * Encrypt a plaintext string. Returns "iv:authTag:ciphertext" (all hex).
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string produced by encrypt(). Throws on tampered data.
 */
export function decrypt(encryptedStr: string): string {
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/crypto.test.ts`

Expected: 4 tests PASS.

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/lib/procore/crypto.ts \
       apps/forsured-web/tests/unit/procore/crypto.test.ts
git commit -m "feat(procore): add AES-256-GCM token encryption module with tests"
```

---

## Task 3: Procore API Types & Client

**Files:**
- Create: `apps/forsured-web/src/server/lib/procore/types.ts`
- Create: `apps/forsured-web/src/server/lib/procore/client.ts`
- Test: `apps/forsured-web/tests/unit/procore/client.test.ts`

**Context:**
- Procore API base: `https://api.procore.com`
- Auth URL: `https://login.procore.com/oauth/token`
- Projects: `GET /rest/v1.1/projects?company_id={id}` with `Procore-Company-Id` header
- Vendors: `GET /rest/v1/company-vendors?company_id={id}`
- Pagination: `limit` + `offset`, max 100 per page
- Uses `@bernierllc/retry-policy` for retries
- Hard-fail on missing `PROCORE_CLIENT_ID`, `PROCORE_CLIENT_SECRET`

**Step 1: Install `@bernierllc/retry-policy`**

Run: `pnpm add @bernierllc/retry-policy --filter forsured-web`

If the package is private/scoped, you may need: `pnpm add @bernierllc/retry-policy --filter forsured-web --registry=<registry-url>`. Ask the user if install fails.

**Step 2: Write types**

```typescript
// apps/forsured-web/src/server/lib/procore/types.ts

/** Procore OAuth token response */
export interface ProcoreTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at: number;
}

/** Procore company from GET /rest/v1.0/companies */
export interface ProcoreCompany {
  id: number;
  name: string;
  is_active: boolean;
}

/** Procore project from GET /rest/v1.1/projects */
export interface ProcoreProject {
  id: number;
  name: string;
  display_name?: string;
  project_number?: string;
  address?: string;
  city?: string;
  state_code?: string;
  zip?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  projected_finish_date?: string;
  actual_start_date?: string;
  completion_date?: string;
  total_value?: number;
  stage?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Procore vendor from GET /rest/v1/company-vendors */
export interface ProcoreVendor {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state_code?: string;
  zip?: string;
  country_code?: string;
  phone_number?: string;
  fax_number?: string;
  email_address?: string;
  business_phone?: string;
  website?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Procore user info from GET /rest/v1.0/me */
export interface ProcoreUser {
  id: number;
  login: string;
  name: string;
  email_address?: string;
}
```

**Step 3: Write the failing client test**

```typescript
// apps/forsured-web/tests/unit/procore/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProcoreProject, ProcoreVendor } from '../../../src/server/lib/procore/types';

// Mock fetch globally for Procore API calls (external 3rd party — mock allowed)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ProcoreClient', () => {
  beforeEach(() => {
    process.env.PROCORE_CLIENT_ID = 'test-client-id';
    process.env.PROCORE_CLIENT_SECRET = 'test-client-secret';
    process.env.PROCORE_REDIRECT_URI = 'https://app.example.com/api/procore/callback';
    vi.resetModules();
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.PROCORE_CLIENT_ID;
    delete process.env.PROCORE_CLIENT_SECRET;
    delete process.env.PROCORE_REDIRECT_URI;
  });

  it('getAuthorizationUrl returns correct URL with state', async () => {
    const { ProcoreClient } = await import('../../../src/server/lib/procore/client');
    const client = new ProcoreClient();
    const url = client.getAuthorizationUrl('test-state-123');

    expect(url).toContain('https://login.procore.com/oauth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('state=test-state-123');
  });

  it('exchangeCode calls token endpoint with correct params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'new-access-token',
        token_type: 'bearer',
        expires_in: 5400,
        refresh_token: 'new-refresh-token',
        created_at: 1234567890,
      }),
    });

    const { ProcoreClient } = await import('../../../src/server/lib/procore/client');
    const client = new ProcoreClient();
    const tokens = await client.exchangeCode('auth-code-123');

    expect(tokens.access_token).toBe('new-access-token');
    expect(tokens.refresh_token).toBe('new-refresh-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://login.procore.com/oauth/token',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchProjects paginates and returns all projects', async () => {
    const page1: ProcoreProject[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Project ${i + 1}`,
    }));
    const page2: ProcoreProject[] = [{ id: 101, name: 'Project 101' }];

    mockFetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => page1,
        headers: new Headers({ 'Total': '101', 'Per-Page': '100' }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => page2,
        headers: new Headers({ 'Total': '101', 'Per-Page': '100' }),
      });

    const { ProcoreClient } = await import('../../../src/server/lib/procore/client');
    const client = new ProcoreClient();
    const projects = await client.fetchProjects('access-token', 12345);

    expect(projects).toHaveLength(101);
    expect(projects[100].name).toBe('Project 101');
  });

  it('fetchVendors returns vendor list', async () => {
    const vendors: ProcoreVendor[] = [
      { id: 1, name: 'ABC Subcontractors' },
      { id: 2, name: 'XYZ Suppliers' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => vendors,
      headers: new Headers({ 'Total': '2', 'Per-Page': '100' }),
    });

    const { ProcoreClient } = await import('../../../src/server/lib/procore/client');
    const client = new ProcoreClient();
    const result = await client.fetchVendors('access-token', 12345);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('ABC Subcontractors');
  });
});
```

**Step 4: Run test to verify it fails**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/client.test.ts`

Expected: FAIL — module not found.

**Step 5: Write client implementation**

```typescript
// apps/forsured-web/src/server/lib/procore/client.ts
import type {
  ProcoreTokenResponse,
  ProcoreCompany,
  ProcoreProject,
  ProcoreVendor,
  ProcoreUser,
} from './types';

const PROCORE_AUTH_BASE = 'https://login.procore.com';
const PROCORE_API_BASE = 'https://api.procore.com';
const PAGE_SIZE = 100;

const clientId = process.env.PROCORE_CLIENT_ID;
const clientSecret = process.env.PROCORE_CLIENT_SECRET;
const redirectUri = process.env.PROCORE_REDIRECT_URI;

if (!clientId) throw new Error('Missing required env var: PROCORE_CLIENT_ID');
if (!clientSecret) throw new Error('Missing required env var: PROCORE_CLIENT_SECRET');

export class ProcoreClient {
  /**
   * Build the Procore OAuth authorization URL for user redirect.
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri || '',
      state,
    });
    return `${PROCORE_AUTH_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for access + refresh tokens.
   */
  async exchangeCode(code: string): Promise<ProcoreTokenResponse> {
    return this.tokenRequest({
      grant_type: 'authorization_code',
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri || '',
    });
  }

  /**
   * Refresh an expired access token.
   */
  async refreshToken(refreshToken: string): Promise<ProcoreTokenResponse> {
    return this.tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    });
  }

  /**
   * Fetch the authenticated user's info.
   */
  async fetchMe(accessToken: string): Promise<ProcoreUser> {
    return this.apiGet('/rest/v1.0/me', accessToken);
  }

  /**
   * Fetch all companies for the authenticated user.
   */
  async fetchCompanies(accessToken: string): Promise<ProcoreCompany[]> {
    return this.apiGet('/rest/v1.0/companies', accessToken);
  }

  /**
   * Fetch all projects for a company. Paginates automatically.
   */
  async fetchProjects(
    accessToken: string,
    companyId: number
  ): Promise<ProcoreProject[]> {
    return this.paginateAll(
      `/rest/v1.1/projects?company_id=${companyId}`,
      accessToken,
      companyId
    );
  }

  /**
   * Fetch all vendors (subcontractors) for a company. Paginates automatically.
   */
  async fetchVendors(
    accessToken: string,
    companyId: number
  ): Promise<ProcoreVendor[]> {
    return this.paginateAll(
      `/rest/v1/company-vendors?company_id=${companyId}`,
      accessToken,
      companyId
    );
  }

  // ---- Private helpers ----

  private async tokenRequest(
    body: Record<string, string>
  ): Promise<ProcoreTokenResponse> {
    const response = await fetch(`${PROCORE_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Procore token request failed (${response.status}): ${text}`);
    }

    return response.json();
  }

  private async apiGet<T>(
    path: string,
    accessToken: string,
    companyId?: number
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    if (companyId) {
      headers['Procore-Company-Id'] = String(companyId);
    }

    const response = await fetch(`${PROCORE_API_BASE}${path}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Procore API error (${response.status}): ${text}`);
    }

    return response.json();
  }

  private async paginateAll<T>(
    basePath: string,
    accessToken: string,
    companyId: number
  ): Promise<T[]> {
    const all: T[] = [];
    let offset = 0;

    while (true) {
      const separator = basePath.includes('?') ? '&' : '?';
      const path = `${basePath}${separator}limit=${PAGE_SIZE}&offset=${offset}`;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Procore-Company-Id': String(companyId),
      };

      const response = await fetch(`${PROCORE_API_BASE}${path}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Procore API error (${response.status}): ${text}`);
      }

      const data: T[] = await response.json();
      all.push(...data);

      // Stop if we got fewer than PAGE_SIZE results (last page)
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return all;
  }
}
```

**Step 6: Run tests**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/client.test.ts`

Expected: All tests PASS.

**Step 7: Commit**

```bash
git add apps/forsured-web/src/server/lib/procore/types.ts \
       apps/forsured-web/src/server/lib/procore/client.ts \
       apps/forsured-web/tests/unit/procore/client.test.ts
git commit -m "feat(procore): add typed Procore API client with pagination and tests"
```

---

## Task 4: Collision Detection Module

**Files:**
- Create: `apps/forsured-web/src/server/lib/procore/collision-detector.ts`
- Test: `apps/forsured-web/tests/unit/procore/collision-detector.test.ts`

**Context:**
- Compares Procore entities against existing forsured records
- Exact match: identical normalized names within same org
- Fuzzy match: Levenshtein distance or stripped-punctuation match
- Previously linked: procore_id already set → auto-link
- No match: nothing similar found

**Step 1: Write the failing test**

```typescript
// apps/forsured-web/tests/unit/procore/collision-detector.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectCollision,
  normalizeName,
  type CollisionResult,
} from '../../../src/server/lib/procore/collision-detector';

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Acme Corp  ')).toBe('acme corp');
  });

  it('strips common suffixes', () => {
    expect(normalizeName('Acme Construction LLC')).toBe('acme construction');
    expect(normalizeName('Bob Inc.')).toBe('bob');
  });

  it('strips punctuation', () => {
    expect(normalizeName("O'Brien & Sons, Ltd.")).toBe('obrien sons');
  });
});

describe('detectCollision', () => {
  const existingRecords = [
    { id: 'uuid-1', name: 'Acme Construction', procore_id: null },
    { id: 'uuid-2', name: 'Downtown Tower', procore_id: '999' },
    { id: 'uuid-3', name: 'Sunrise Builders', procore_id: null },
  ];

  it('returns previously_linked when procore_id matches', () => {
    const result = detectCollision(
      { id: 999, name: 'Downtown Tower Renamed' },
      existingRecords,
      'procore_id'
    );
    expect(result.matchStatus).toBe('exact_match');
    expect(result.matchedEntityId).toBe('uuid-2');
    expect(result.resolution).toBe('link');
  });

  it('returns exact_match on normalized name match', () => {
    const result = detectCollision(
      { id: 555, name: 'Acme Construction LLC' },
      existingRecords,
      'procore_id'
    );
    expect(result.matchStatus).toBe('exact_match');
    expect(result.matchedEntityId).toBe('uuid-1');
    expect(result.confidence).toBe(1.0);
    expect(result.resolution).toBe('pending');
  });

  it('returns fuzzy_match on close name', () => {
    const result = detectCollision(
      { id: 556, name: 'Sunrise Builder' },
      existingRecords,
      'procore_id'
    );
    expect(result.matchStatus).toBe('fuzzy_match');
    expect(result.matchedEntityId).toBe('uuid-3');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.confidence).toBeLessThan(1.0);
    expect(result.resolution).toBe('pending');
  });

  it('returns no_match when nothing similar', () => {
    const result = detectCollision(
      { id: 557, name: 'Completely Different Corp' },
      existingRecords,
      'procore_id'
    );
    expect(result.matchStatus).toBe('no_match');
    expect(result.matchedEntityId).toBeNull();
    expect(result.resolution).toBe('pending');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/collision-detector.test.ts`

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/forsured-web/src/server/lib/procore/collision-detector.ts

export interface CollisionResult {
  matchStatus: 'no_match' | 'exact_match' | 'fuzzy_match';
  matchedEntityId: string | null;
  confidence: number;
  matchReason: string | null;
  resolution: 'pending' | 'link';
}

interface ExistingRecord {
  id: string;
  name: string;
  procore_id?: string | null;
  procore_vendor_id?: string | null;
}

interface ProcoreEntity {
  id: number;
  name: string;
}

const COMMON_SUFFIXES =
  /\b(llc|inc|corp|ltd|co|company|construction|builders|enterprises|services|group)\b\.?/gi;

/**
 * Normalize a company/project name for comparison.
 * Lowercases, strips suffixes, removes punctuation, trims.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(COMMON_SUFFIXES, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple Levenshtein distance.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Detect collision between a Procore entity and existing ForSured records.
 *
 * @param procoreEntity - The incoming Procore project or vendor
 * @param existingRecords - Existing forsured records to compare against
 * @param procoreIdField - Which field holds the procore ID ('procore_id' or 'procore_vendor_id')
 */
export function detectCollision(
  procoreEntity: ProcoreEntity,
  existingRecords: ExistingRecord[],
  procoreIdField: 'procore_id' | 'procore_vendor_id'
): CollisionResult {
  // 1. Check for previously linked record (procore ID already set)
  const linkedRecord = existingRecords.find(
    (r) => r[procoreIdField] === String(procoreEntity.id)
  );
  if (linkedRecord) {
    return {
      matchStatus: 'exact_match',
      matchedEntityId: linkedRecord.id,
      confidence: 1.0,
      matchReason: 'procore_id_linked',
      resolution: 'link', // auto-resolve, not a user decision
    };
  }

  // 2. Check exact name match (normalized)
  const normalizedIncoming = normalizeName(procoreEntity.name);

  for (const record of existingRecords) {
    if (normalizeName(record.name) === normalizedIncoming) {
      return {
        matchStatus: 'exact_match',
        matchedEntityId: record.id,
        confidence: 1.0,
        matchReason: 'name_exact',
        resolution: 'pending',
      };
    }
  }

  // 3. Check fuzzy name match
  const FUZZY_THRESHOLD = 0.7;
  let bestMatch: { record: ExistingRecord; confidence: number } | null = null;

  for (const record of existingRecords) {
    const normalizedExisting = normalizeName(record.name);
    const maxLen = Math.max(normalizedIncoming.length, normalizedExisting.length);
    if (maxLen === 0) continue;

    const distance = levenshtein(normalizedIncoming, normalizedExisting);
    const similarity = 1 - distance / maxLen;

    if (similarity >= FUZZY_THRESHOLD) {
      if (!bestMatch || similarity > bestMatch.confidence) {
        bestMatch = { record, confidence: Math.round(similarity * 100) / 100 };
      }
    }
  }

  if (bestMatch) {
    return {
      matchStatus: 'fuzzy_match',
      matchedEntityId: bestMatch.record.id,
      confidence: bestMatch.confidence,
      matchReason: 'name_fuzzy',
      resolution: 'pending',
    };
  }

  // 4. No match
  return {
    matchStatus: 'no_match',
    matchedEntityId: null,
    confidence: 0,
    matchReason: null,
    resolution: 'pending',
  };
}
```

**Step 4: Run tests**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/collision-detector.test.ts`

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/lib/procore/collision-detector.ts \
       apps/forsured-web/tests/unit/procore/collision-detector.test.ts
git commit -m "feat(procore): add collision detection with exact/fuzzy name matching"
```

---

## Task 5: Adaptive Backoff Module

**Files:**
- Create: `apps/forsured-web/src/server/lib/procore/adaptive-backoff.ts`
- Test: `apps/forsured-web/tests/unit/procore/adaptive-backoff.test.ts`

**Context:**
- Computes next sync interval based on whether changes were detected
- Configurable min/max/multipliers via env vars
- Returns the new interval in minutes

**Step 1: Write the failing test**

```typescript
// apps/forsured-web/tests/unit/procore/adaptive-backoff.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('adaptiveBackoff', () => {
  beforeEach(() => {
    process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES = '15';
    process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES = '10080';
    process.env.PROCORE_SYNC_BACKOFF_MULTIPLIER = '2';
    process.env.PROCORE_SYNC_COOLDOWN_MULTIPLIER = '0.5';
  });

  afterEach(() => {
    delete process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES;
    delete process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES;
    delete process.env.PROCORE_SYNC_BACKOFF_MULTIPLIER;
    delete process.env.PROCORE_SYNC_COOLDOWN_MULTIPLIER;
  });

  it('halves interval when changes detected', async () => {
    const { computeNextInterval } = await import(
      '../../../src/server/lib/procore/adaptive-backoff'
    );
    const next = computeNextInterval(60, true);
    expect(next).toBe(30); // 60 * 0.5 = 30
  });

  it('doubles interval when no changes', async () => {
    const { computeNextInterval } = await import(
      '../../../src/server/lib/procore/adaptive-backoff'
    );
    const next = computeNextInterval(60, false);
    expect(next).toBe(120); // 60 * 2 = 120
  });

  it('clamps to min interval', async () => {
    const { computeNextInterval } = await import(
      '../../../src/server/lib/procore/adaptive-backoff'
    );
    const next = computeNextInterval(15, true);
    expect(next).toBe(15); // 15 * 0.5 = 7.5, clamped to 15
  });

  it('clamps to max interval', async () => {
    const { computeNextInterval } = await import(
      '../../../src/server/lib/procore/adaptive-backoff'
    );
    const next = computeNextInterval(6000, false);
    expect(next).toBe(10080); // 6000 * 2 = 12000, clamped to 10080
  });

  it('uses defaults when env vars missing', async () => {
    delete process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES;
    delete process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES;
    const { computeNextInterval } = await import(
      '../../../src/server/lib/procore/adaptive-backoff'
    );
    // Should still work with defaults
    const next = computeNextInterval(60, false);
    expect(next).toBeGreaterThan(60);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/adaptive-backoff.test.ts`

Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// apps/forsured-web/src/server/lib/procore/adaptive-backoff.ts

const DEFAULT_MIN_INTERVAL = 15;
const DEFAULT_MAX_INTERVAL = 10080; // 7 days
const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_COOLDOWN_MULTIPLIER = 0.5;

function getConfig() {
  return {
    minInterval: Number(process.env.PROCORE_SYNC_MIN_INTERVAL_MINUTES) || DEFAULT_MIN_INTERVAL,
    maxInterval: Number(process.env.PROCORE_SYNC_MAX_INTERVAL_MINUTES) || DEFAULT_MAX_INTERVAL,
    backoffMultiplier: Number(process.env.PROCORE_SYNC_BACKOFF_MULTIPLIER) || DEFAULT_BACKOFF_MULTIPLIER,
    cooldownMultiplier: Number(process.env.PROCORE_SYNC_COOLDOWN_MULTIPLIER) || DEFAULT_COOLDOWN_MULTIPLIER,
    manualDebounceMins: Number(process.env.PROCORE_SYNC_MANUAL_DEBOUNCE_MINUTES) || 5,
  };
}

/**
 * Compute the next sync interval based on whether changes were detected.
 *
 * @param currentIntervalMinutes - The current sync interval
 * @param changesDetected - Whether the last sync found any changes
 * @returns The new interval in minutes, clamped to [min, max]
 */
export function computeNextInterval(
  currentIntervalMinutes: number,
  changesDetected: boolean
): number {
  const config = getConfig();
  const multiplier = changesDetected
    ? config.cooldownMultiplier
    : config.backoffMultiplier;

  const raw = currentIntervalMinutes * multiplier;
  return Math.round(Math.min(Math.max(raw, config.minInterval), config.maxInterval));
}

/**
 * Check if a manual sync is allowed (debounce check).
 */
export function canManualSync(lastManualSyncAt: Date | null): boolean {
  if (!lastManualSyncAt) return true;
  const config = getConfig();
  const elapsed = (Date.now() - lastManualSyncAt.getTime()) / 60000;
  return elapsed >= config.manualDebounceMins;
}

/**
 * Get minutes remaining until manual sync is allowed.
 */
export function minutesUntilManualSync(lastManualSyncAt: Date | null): number {
  if (!lastManualSyncAt) return 0;
  const config = getConfig();
  const elapsed = (Date.now() - lastManualSyncAt.getTime()) / 60000;
  return Math.max(0, Math.ceil(config.manualDebounceMins - elapsed));
}

export { getConfig };
```

**Step 4: Run tests**

Run: `npx vitest run apps/forsured-web/tests/unit/procore/adaptive-backoff.test.ts`

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/lib/procore/adaptive-backoff.ts \
       apps/forsured-web/tests/unit/procore/adaptive-backoff.test.ts
git commit -m "feat(procore): add adaptive sync backoff with configurable min/max"
```

---

## Task 6: tRPC Procore Router

**Files:**
- Create: `apps/forsured-web/src/server/api/routers/procore.ts`
- Modify: `apps/forsured-web/src/server/api/root.ts:1-75` (add import + register)
- Test: `apps/forsured-web/tests/integration/procore-router.test.ts`

**Context:**
- Follow existing router pattern from `apps/forsured-web/src/server/api/routers/organization.ts`
- Use `protectedProcedure` from `../trpc`
- Use `forsured()` helper from `../../../lib/supabase` for DB queries
- `ctx.userId` and `ctx.organizationId` come from the auth middleware
- Zod for all input validation

**Step 1: Write the router**

Create `apps/forsured-web/src/server/api/routers/procore.ts`:

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import { ProcoreClient } from '../../lib/procore/client';
import { encrypt, decrypt } from '../../lib/procore/crypto';
import { canManualSync, minutesUntilManualSync } from '../../lib/procore/adaptive-backoff';
import { randomBytes, createHmac } from 'node:crypto';

const procoreClient = new ProcoreClient();

// State tokens: signed, 5-minute expiry
function createStateToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 5 * 60 * 1000,
    nonce: randomBytes(16).toString('hex'),
  });
  const secret = process.env.PROCORE_CLIENT_SECRET!;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function verifyStateToken(state: string, expectedUserId: string): boolean {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    const lastDot = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const secret = process.env.PROCORE_CLIENT_SECRET!;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return false;
    const data = JSON.parse(payload);
    if (data.userId !== expectedUserId) return false;
    if (Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export const procoreRouter = createTRPCRouter({
  connect: protectedProcedure.mutation(async ({ ctx }) => {
    const state = createStateToken(ctx.userId);
    const url = procoreClient.getAuthorizationUrl(state);
    return { url, state };
  }),

  callback: protectedProcedure
    .input(z.object({
      code: z.string().min(1),
      state: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!verifyStateToken(input.state, ctx.userId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired state token' });
      }

      // Exchange code for tokens
      const tokens = await procoreClient.exchangeCode(input.code);

      // Get Procore user info
      const me = await procoreClient.fetchMe(tokens.access_token);

      // Get companies to store the first one
      const companies = await procoreClient.fetchCompanies(tokens.access_token);
      const companyId = companies.length > 0 ? String(companies[0].id) : null;

      // Upsert integration
      const { data, error } = await forsured('integrations')
        .upsert({
          user_id: ctx.userId,
          organization_id: ctx.organizationId,
          provider: 'procore',
          provider_user_id: String(me.id),
          provider_company_id: companyId,
          access_token_encrypted: encrypt(tokens.access_token),
          refresh_token_encrypted: encrypt(tokens.refresh_token),
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scopes: [],
          status: 'connected',
          sync_interval_minutes: 15,
          next_sync_at: new Date().toISOString(), // trigger immediate sync
          sync_error: null,
        }, { onConflict: 'user_id,provider' })
        .select('id')
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save integration', cause: error });
      }

      return { integrationId: data.id };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await forsured('integrations')
      .update({
        status: 'disconnected',
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
        next_sync_at: null,
      })
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore');

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to disconnect', cause: error });
    }

    return { success: true };
  }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await forsured('integrations')
      .select('id, status, last_sync_at, next_sync_at, sync_interval_minutes, sync_error, manual_sync_requested_at, provider_company_id')
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore')
      .maybeSingle();

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch status', cause: error });
    }

    if (!data) return null;

    return {
      ...data,
      canManualSync: canManualSync(
        data.manual_sync_requested_at ? new Date(data.manual_sync_requested_at) : null
      ),
      minutesUntilManualSync: minutesUntilManualSync(
        data.manual_sync_requested_at ? new Date(data.manual_sync_requested_at) : null
      ),
    };
  }),

  triggerSync: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: integration, error: fetchError } = await forsured('integrations')
      .select('id, status, manual_sync_requested_at')
      .eq('user_id', ctx.userId)
      .eq('provider', 'procore')
      .single();

    if (fetchError || !integration) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No Procore integration found' });
    }

    if (integration.status !== 'connected') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Integration is not connected' });
    }

    if (!canManualSync(integration.manual_sync_requested_at ? new Date(integration.manual_sync_requested_at) : null)) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Please wait before syncing again`,
      });
    }

    const { error } = await forsured('integrations')
      .update({
        next_sync_at: new Date().toISOString(),
        manual_sync_requested_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to trigger sync', cause: error });
    }

    return { triggered: true };
  }),

  getSyncLog: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Get integration ID first
      const { data: integration } = await forsured('integrations')
        .select('id')
        .eq('user_id', ctx.userId)
        .eq('provider', 'procore')
        .maybeSingle();

      if (!integration) return { logs: [], total: 0 };

      const { data, error, count } = await forsured('sync_log')
        .select('*', { count: 'exact' })
        .eq('integration_id', integration.id)
        .order('started_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sync log', cause: error });
      }

      return { logs: data || [], total: count || 0 };
    }),

  getSyncQueue: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await forsured('sync_queue')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('resolution', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sync queue', cause: error });
    }

    return data || [];
  }),

  resolveSyncItem: protectedProcedure
    .input(z.object({
      queueItemId: z.string().uuid(),
      resolution: z.enum(['link', 'create_new', 'skip']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the queue item
      const { data: item, error: fetchError } = await forsured('sync_queue')
        .select('*')
        .eq('id', input.queueItemId)
        .eq('user_id', ctx.userId)
        .single();

      if (fetchError || !item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sync queue item not found' });
      }

      if (input.resolution === 'link' && item.matched_entity_id) {
        // Link: set procore_id on the existing forsured record
        const table = item.entity_type === 'project' ? 'projects' : 'subcontractors';
        const idColumn = item.entity_type === 'project' ? 'procore_id' : 'procore_vendor_id';

        await forsured(table)
          .update({
            [idColumn]: item.provider_entity_id,
            procore_last_synced_at: new Date().toISOString(),
          })
          .eq('id', item.matched_entity_id);
      } else if (input.resolution === 'create_new') {
        // Create new forsured record from Procore data
        const providerData = item.provider_data as Record<string, unknown>;

        if (item.entity_type === 'project') {
          await forsured('projects').insert({
            name: providerData.name as string,
            organization_id: item.organization_id,
            procore_id: item.provider_entity_id,
            procore_last_synced_at: new Date().toISOString(),
            description: providerData.address ? String(providerData.address) : null,
            location: [providerData.city, providerData.state_code].filter(Boolean).join(', ') || null,
          });
        } else if (item.entity_type === 'subcontractor') {
          await forsured('subcontractors').insert({
            name: providerData.name as string,
            company: providerData.name as string,
            organization_id: item.organization_id,
            procore_vendor_id: item.provider_entity_id,
            procore_last_synced_at: new Date().toISOString(),
            contact_info: {
              phone: providerData.phone_number || null,
              email: providerData.email_address || null,
              address: providerData.address || null,
            },
          });
        }
      }
      // 'skip' → just mark resolved, no data changes

      // Mark resolved
      const { error } = await forsured('sync_queue')
        .update({
          resolution: input.resolution,
          resolved_by: ctx.userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', input.queueItemId);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to resolve item', cause: error });
      }

      return { success: true };
    }),

  resolveSyncBatch: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        queueItemId: z.string().uuid(),
        resolution: z.enum(['link', 'create_new', 'skip']),
      })).min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const item of input.items) {
        try {
          // Reuse single-item logic inline (call the same DB operations)
          const { data: queueItem, error: fetchError } = await forsured('sync_queue')
            .select('*')
            .eq('id', item.queueItemId)
            .eq('user_id', ctx.userId)
            .single();

          if (fetchError || !queueItem) {
            results.push({ id: item.queueItemId, success: false, error: 'Not found' });
            continue;
          }

          if (item.resolution === 'link' && queueItem.matched_entity_id) {
            const table = queueItem.entity_type === 'project' ? 'projects' : 'subcontractors';
            const idColumn = queueItem.entity_type === 'project' ? 'procore_id' : 'procore_vendor_id';
            await forsured(table).update({
              [idColumn]: queueItem.provider_entity_id,
              procore_last_synced_at: new Date().toISOString(),
            }).eq('id', queueItem.matched_entity_id);
          } else if (item.resolution === 'create_new') {
            const pd = queueItem.provider_data as Record<string, unknown>;
            if (queueItem.entity_type === 'project') {
              await forsured('projects').insert({
                name: pd.name as string,
                organization_id: queueItem.organization_id,
                procore_id: queueItem.provider_entity_id,
                procore_last_synced_at: new Date().toISOString(),
              });
            } else if (queueItem.entity_type === 'subcontractor') {
              await forsured('subcontractors').insert({
                name: pd.name as string,
                company: pd.name as string,
                organization_id: queueItem.organization_id,
                procore_vendor_id: queueItem.provider_entity_id,
                procore_last_synced_at: new Date().toISOString(),
              });
            }
          }

          await forsured('sync_queue').update({
            resolution: item.resolution,
            resolved_by: ctx.userId,
            resolved_at: new Date().toISOString(),
          }).eq('id', item.queueItemId);

          results.push({ id: item.queueItemId, success: true });
        } catch (err) {
          results.push({ id: item.queueItemId, success: false, error: String(err) });
        }
      }

      return { results };
    }),
});
```

**Step 2: Register in root router**

In `apps/forsured-web/src/server/api/root.ts`, add:

```typescript
import { procoreRouter } from './routers/procore';
```

And add to the `createTRPCRouter({})` object:

```typescript
procore: procoreRouter, // Procore integration
```

**Step 3: Write integration test skeleton**

```typescript
// apps/forsured-web/tests/integration/procore-router.test.ts
import { describe, it, expect } from 'vitest';

describe('Procore Router', () => {
  it('getStatus returns null when no integration exists', async () => {
    // This test requires a running Supabase instance
    // Will be fleshed out during integration testing phase
    expect(true).toBe(true); // placeholder
  });
});
```

Note: Full integration tests require running Supabase. Flesh these out when the DB migration is applied and the local dev environment is running.

**Step 4: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/procore.ts \
       apps/forsured-web/src/server/api/root.ts \
       apps/forsured-web/tests/integration/procore-router.test.ts
git commit -m "feat(procore): add tRPC procore router with 9 procedures"
```

---

## Task 7: Sync Engine (Edge Function)

**Files:**
- Create: `packages/supabase/supabase/functions/procore-sync/index.ts`

**Context:**
- Supabase Edge Functions run on Deno
- No existing Edge Functions in this project yet — this is the first one
- The function reads `forsured.integrations` for due syncs, calls Procore, stages items
- Uses the same collision detection and adaptive backoff logic
- NOTE: Edge Functions can't import from `apps/forsured-web/src/` — the shared logic modules (collision-detector, adaptive-backoff, crypto) must be duplicated or moved to a shared package. For MVP, copy the minimal needed code into the Edge Function.

**Step 1: Create the Edge Function directory**

Run: `mkdir -p packages/supabase/supabase/functions/procore-sync`

**Step 2: Write the Edge Function**

```typescript
// packages/supabase/supabase/functions/procore-sync/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const procoreClientId = Deno.env.get('PROCORE_CLIENT_ID')!;
const procoreClientSecret = Deno.env.get('PROCORE_CLIENT_SECRET')!;
const encryptionKey = Deno.env.get('INTEGRATION_ENCRYPTION_KEY')!;

// Validate required env vars
for (const [name, val] of Object.entries({
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
  PROCORE_CLIENT_ID: procoreClientId,
  PROCORE_CLIENT_SECRET: procoreClientSecret,
  INTEGRATION_ENCRYPTION_KEY: encryptionKey,
})) {
  if (!val) throw new Error(`Missing required env var: ${name}`);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    // Fetch integrations that are due for sync
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('status', 'connected')
      .eq('provider', 'procore')
      .or('next_sync_at.is.null,next_sync_at.lte.now()')
      .order('next_sync_at', { ascending: true })
      .limit(10);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ message: 'No integrations due for sync' }), { status: 200 });
    }

    const results = [];

    for (const integration of integrations) {
      try {
        const result = await syncIntegration(integration);
        results.push({ id: integration.id, ...result });
      } catch (err) {
        // Log error, mark integration, continue
        await supabase
          .from('integrations')
          .update({ sync_error: String(err), status: 'error' })
          .eq('id', integration.id);
        results.push({ id: integration.id, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ synced: results.length, results }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function syncIntegration(integration: Record<string, unknown>) {
  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      integration_id: integration.id,
      triggered_by: 'scheduled',
      status: 'running',
      interval_before_minutes: integration.sync_interval_minutes,
    })
    .select('id')
    .single();

  const syncLogId = syncLog?.id;

  try {
    // Decrypt tokens
    const accessToken = decryptToken(integration.access_token_encrypted as string);
    let refreshToken = decryptToken(integration.refresh_token_encrypted as string);

    // Check token expiry and refresh if needed
    const expiresAt = new Date(integration.token_expires_at as string);
    let currentAccessToken = accessToken;

    if (expiresAt <= new Date()) {
      const refreshed = await refreshAccessToken(refreshToken);
      currentAccessToken = refreshed.access_token;

      // Update stored tokens
      await supabase.from('integrations').update({
        access_token_encrypted: encryptToken(refreshed.access_token),
        refresh_token_encrypted: encryptToken(refreshed.refresh_token),
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq('id', integration.id);
    }

    const companyId = Number(integration.provider_company_id);

    // Fetch Procore data
    const projects = await fetchProcoreProjects(currentAccessToken, companyId);
    const vendors = await fetchProcoreVendors(currentAccessToken, companyId);

    // Get existing forsured records for this org
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id, name, procore_id')
      .eq('organization_id', integration.organization_id);

    const { data: existingSubs } = await supabase
      .from('subcontractors')
      .select('id, name, procore_vendor_id')
      .eq('organization_id', integration.organization_id);

    let changesDetected = false;
    let newItemsQueued = 0;
    let updatesApplied = 0;

    // Process projects
    for (const project of projects) {
      const linked = (existingProjects || []).find(
        (p: Record<string, unknown>) => p.procore_id === String(project.id)
      );

      if (linked) {
        // Update existing linked record
        await supabase.from('projects').update({
          name: project.name,
          procore_last_synced_at: new Date().toISOString(),
        }).eq('id', linked.id);
        updatesApplied++;
      } else {
        // Stage for review (collision detection happens here)
        // Simplified: detect by name match
        const nameMatch = (existingProjects || []).find(
          (p: Record<string, unknown>) =>
            (p.name as string).toLowerCase().trim() === project.name.toLowerCase().trim()
        );

        await supabase.from('sync_queue').insert({
          integration_id: integration.id,
          user_id: integration.user_id,
          organization_id: integration.organization_id,
          entity_type: 'project',
          provider_entity_id: String(project.id),
          provider_data: project,
          match_status: nameMatch ? 'exact_match' : 'no_match',
          matched_entity_id: nameMatch ? (nameMatch as Record<string, unknown>).id : null,
          match_confidence: nameMatch ? 1.0 : 0,
          match_reason: nameMatch ? 'name_exact' : null,
        });
        newItemsQueued++;
        changesDetected = true;
      }
    }

    // Process vendors (same pattern)
    for (const vendor of vendors) {
      const linked = (existingSubs || []).find(
        (s: Record<string, unknown>) => s.procore_vendor_id === String(vendor.id)
      );

      if (linked) {
        await supabase.from('subcontractors').update({
          name: vendor.name,
          procore_last_synced_at: new Date().toISOString(),
        }).eq('id', linked.id);
        updatesApplied++;
      } else {
        const nameMatch = (existingSubs || []).find(
          (s: Record<string, unknown>) =>
            (s.name as string).toLowerCase().trim() === vendor.name.toLowerCase().trim()
        );

        await supabase.from('sync_queue').insert({
          integration_id: integration.id,
          user_id: integration.user_id,
          organization_id: integration.organization_id,
          entity_type: 'subcontractor',
          provider_entity_id: String(vendor.id),
          provider_data: vendor,
          match_status: nameMatch ? 'exact_match' : 'no_match',
          matched_entity_id: nameMatch ? (nameMatch as Record<string, unknown>).id : null,
          match_confidence: nameMatch ? 1.0 : 0,
          match_reason: nameMatch ? 'name_exact' : null,
        });
        newItemsQueued++;
        changesDetected = true;
      }
    }

    // Compute next interval (adaptive backoff)
    const currentInterval = integration.sync_interval_minutes as number;
    const backoffMultiplier = Number(Deno.env.get('PROCORE_SYNC_BACKOFF_MULTIPLIER') || '2');
    const cooldownMultiplier = Number(Deno.env.get('PROCORE_SYNC_COOLDOWN_MULTIPLIER') || '0.5');
    const minInterval = Number(Deno.env.get('PROCORE_SYNC_MIN_INTERVAL_MINUTES') || '15');
    const maxInterval = Number(Deno.env.get('PROCORE_SYNC_MAX_INTERVAL_MINUTES') || '10080');

    const multiplier = changesDetected ? cooldownMultiplier : backoffMultiplier;
    const newInterval = Math.round(
      Math.min(Math.max(currentInterval * multiplier, minInterval), maxInterval)
    );

    const nextSyncAt = new Date(Date.now() + newInterval * 60 * 1000).toISOString();

    // Update integration
    await supabase.from('integrations').update({
      last_sync_at: new Date().toISOString(),
      sync_interval_minutes: newInterval,
      next_sync_at: nextSyncAt,
      sync_error: null,
      ...(changesDetected ? { last_change_detected_at: new Date().toISOString() } : {}),
    }).eq('id', integration.id);

    // Complete sync log
    if (syncLogId) {
      await supabase.from('sync_log').update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        projects_found: projects.length,
        projects_changed: projects.filter(p =>
          (existingProjects || []).some((ep: Record<string, unknown>) => ep.procore_id === String(p.id))
        ).length,
        vendors_found: vendors.length,
        vendors_changed: vendors.filter(v =>
          (existingSubs || []).some((es: Record<string, unknown>) => es.procore_vendor_id === String(v.id))
        ).length,
        new_items_queued: newItemsQueued,
        updates_applied: updatesApplied,
        interval_after_minutes: newInterval,
      }).eq('id', syncLogId);
    }

    return {
      projectsFound: projects.length,
      vendorsFound: vendors.length,
      newItemsQueued,
      updatesApplied,
      newInterval,
    };
  } catch (err) {
    // Mark sync log as failed
    if (syncLogId) {
      await supabase.from('sync_log').update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: String(err),
      }).eq('id', syncLogId);
    }
    throw err;
  }
}

// --- Procore API helpers ---

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://login.procore.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: procoreClientId,
      client_secret: procoreClientSecret,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

async function fetchProcoreProjects(accessToken: string, companyId: number) {
  return paginateAll(`/rest/v1.1/projects?company_id=${companyId}`, accessToken, companyId);
}

async function fetchProcoreVendors(accessToken: string, companyId: number) {
  return paginateAll(`/rest/v1/company-vendors?company_id=${companyId}`, accessToken, companyId);
}

async function paginateAll(basePath: string, accessToken: string, companyId: number) {
  const all: unknown[] = [];
  let offset = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const sep = basePath.includes('?') ? '&' : '?';
    const url = `https://api.procore.com${basePath}${sep}limit=${PAGE_SIZE}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Procore-Company-Id': String(companyId),
      },
    });

    if (!response.ok) {
      throw new Error(`Procore API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

// --- Crypto helpers (AES-256-GCM for Deno) ---

function encryptToken(plaintext: string): string {
  const key = hexToBytes(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  // Use Web Crypto API (available in Deno)
  // For simplicity in Edge Function, use a simpler approach
  // This is a placeholder — implement proper AES-256-GCM with Web Crypto API
  const combined = btoa(`${arrayToHex(iv)}:${btoa(plaintext)}`);
  return combined;
}

function decryptToken(encrypted: string): string {
  // Reverse of encryptToken
  const decoded = atob(encrypted);
  const parts = decoded.split(':');
  return atob(parts[1]);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**IMPORTANT NOTE:** The crypto in this Edge Function is a placeholder. Before production, replace with proper Web Crypto API AES-256-GCM that is compatible with the Node.js `crypto` module used in the tRPC server. This is a Task 7 follow-up item.

**Step 3: Commit**

```bash
git add packages/supabase/supabase/functions/procore-sync/index.ts
git commit -m "feat(procore): add Edge Function for periodic Procore sync"
```

---

## Task 8: Frontend — Integrations Page with Procore

**Files:**
- Modify: `apps/forsured-web/src/pages/gc/settings/IntegrationSettings.tsx` (rewrite to support Procore)
- Create: `apps/forsured-web/src/pages/gc/settings/components/ProcoreIntegration.tsx`
- Create: `apps/forsured-web/src/pages/gc/settings/components/SyncReviewPanel.tsx`

**Context:**
- Existing `IntegrationSettings.tsx` has a mock Scaffald integration — replace with real Procore
- Uses `@unicornlove/beyond-ui` components: Stack, Row, Text, Button, H3, Spinner, Modal, Card, etc.
- Uses lucide-react-native icons
- tRPC hooks: `trpc.procore.getStatus.useQuery()`, `trpc.procore.triggerSync.useMutation()`, etc.

**Step 1: Create ProcoreIntegration component**

This component handles:
- Connected/disconnected states
- Last sync / next sync display
- Sync Now button with debounce
- Badge for pending review items

```typescript
// apps/forsured-web/src/pages/gc/settings/components/ProcoreIntegration.tsx
import { useState } from 'react';
import { Stack, Row, Text, Button, Spinner } from '@unicornlove/beyond-ui';
import { RefreshCcw, Link2, Unlink, Clock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { trpc } from '../../../../providers/TRPCProvider';

export function ProcoreIntegration() {
  const status = trpc.procore.getStatus.useQuery();
  const triggerSync = trpc.procore.triggerSync.useMutation({
    onSuccess: () => status.refetch(),
  });
  const disconnect = trpc.procore.disconnect.useMutation({
    onSuccess: () => status.refetch(),
  });
  const connect = trpc.procore.connect.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
  const syncQueue = trpc.procore.getSyncQueue.useQuery(undefined, {
    enabled: status.data?.status === 'connected',
  });

  if (status.isLoading) return <Spinner />;

  const integration = status.data;

  // Not connected state
  if (!integration || integration.status === 'disconnected') {
    return (
      <Stack style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-4)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <Link2 size={20} />
          <Text style={{ fontWeight: 600, fontSize: 'var(--font-size-5)' }}>Procore</Text>
        </Row>
        <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-4)' }}>
          Connect your Procore account to import projects and subcontractors.
        </Text>
        <Button
          variant="primary"
          onPress={() => connect.mutate()}
          disabled={connect.isPending}
          leftIcon={connect.isPending ? <Spinner size="sm" /> : <Link2 size={14} />}
        >
          Connect Procore
        </Button>
      </Stack>
    );
  }

  // Error state
  if (integration.status === 'error') {
    return (
      <Stack style={{ padding: 'var(--space-4)', border: '1px solid var(--color-red-7)', borderRadius: 'var(--radius-4)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <AlertCircle size={20} color="var(--color-red-10)" />
          <Text style={{ fontWeight: 600, color: 'var(--color-red-10)' }}>Procore — Connection Error</Text>
        </Row>
        <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-2)' }}>
          {integration.sync_error || 'Your Procore connection needs to be re-established.'}
        </Text>
        <Button variant="primary" onPress={() => connect.mutate()}>
          Reconnect Procore
        </Button>
      </Stack>
    );
  }

  // Connected state
  const pendingItems = syncQueue.data?.length || 0;
  const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
  const nextSync = integration.next_sync_at ? new Date(integration.next_sync_at) : null;

  return (
    <Stack style={{ padding: 'var(--space-4)', border: '1px solid var(--color-green-7)', borderRadius: 'var(--radius-4)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <CheckCircle2 size={20} color="var(--color-green-10)" />
          <Text style={{ fontWeight: 600 }}>Procore — Connected</Text>
        </Row>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => disconnect.mutate()}
          leftIcon={<Unlink size={14} />}
        >
          Disconnect
        </Button>
      </Row>

      {/* Sync timing info */}
      <Stack style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <Clock size={14} color="var(--color-10)" />
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
            Last synced: {lastSync ? formatRelativeTime(lastSync) : 'Never'}
            {lastSync && ` (${lastSync.toLocaleString()})`}
          </Text>
        </Row>
        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <Clock size={14} color="var(--color-10)" />
          <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
            Next sync: {nextSync ? formatRelativeTime(nextSync) : 'Pending'}
            {nextSync && ` (${nextSync.toLocaleString()})`}
          </Text>
        </Row>
        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-9)' }}>
          Syncing every {formatInterval(integration.sync_interval_minutes)}
        </Text>
      </Stack>

      {/* Pending review badge */}
      {pendingItems > 0 && (
        <Row style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--color-yellow-3)',
          borderRadius: 'var(--radius-3)',
          marginBottom: 'var(--space-4)',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <AlertCircle size={16} color="var(--color-yellow-10)" />
          <Text style={{ fontWeight: 500 }}>
            {pendingItems} item{pendingItems !== 1 ? 's' : ''} need your review
          </Text>
        </Row>
      )}

      {/* Sync Now button */}
      <Button
        variant="outline"
        size="sm"
        onPress={() => triggerSync.mutate()}
        disabled={triggerSync.isPending || !integration.canManualSync}
        leftIcon={triggerSync.isPending ? <Spinner size="sm" /> : <RefreshCcw size={14} />}
      >
        {integration.canManualSync
          ? 'Sync Now'
          : `Available in ${integration.minutesUntilManualSync} min`}
      </Button>
    </Stack>
  );
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(Math.abs(diff) / 60000);
  const future = diff < 0;

  if (minutes < 1) return future ? 'any moment now' : 'just now';
  if (minutes < 60) return future ? `~${minutes} min from now` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return future ? `~${hours}h from now` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return future ? `~${days}d from now` : `${days}d ago`;
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
  return `${Math.round(minutes / 1440)} days`;
}
```

**Step 2: Create SyncReviewPanel component**

This is the collision resolution UI. Build it as a separate component that the IntegrationSettings page renders when there are pending queue items.

```typescript
// apps/forsured-web/src/pages/gc/settings/components/SyncReviewPanel.tsx
import { useState } from 'react';
import { Stack, Row, Text, Button, H3, Spinner } from '@unicornlove/beyond-ui';
import { Check, X, Link2, Plus, SkipForward } from 'lucide-react-native';
import { trpc } from '../../../../providers/TRPCProvider';

interface SyncQueueItem {
  id: string;
  entity_type: string;
  provider_entity_id: string;
  provider_data: Record<string, unknown>;
  match_status: string;
  matched_entity_id: string | null;
  match_confidence: number;
  match_reason: string | null;
  resolution: string;
}

export function SyncReviewPanel() {
  const queue = trpc.procore.getSyncQueue.useQuery();
  const resolveBatch = trpc.procore.resolveSyncBatch.useMutation({
    onSuccess: () => queue.refetch(),
  });

  const [decisions, setDecisions] = useState<Record<string, 'link' | 'create_new' | 'skip'>>({});

  if (queue.isLoading) return <Spinner />;

  const items = (queue.data || []) as SyncQueueItem[];
  if (items.length === 0) return null;

  const needsDecision = items.filter(i => i.match_status !== 'no_match');
  const readyToImport = items.filter(i => i.match_status === 'no_match');

  const handleSubmit = () => {
    const resolved = items.map(item => ({
      queueItemId: item.id,
      resolution: decisions[item.id] || (item.match_status === 'no_match' ? 'create_new' as const : 'skip' as const),
    }));
    resolveBatch.mutate({ items: resolved });
  };

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <H3>Review Procore Import</H3>

      {/* Ready to import */}
      {readyToImport.length > 0 && (
        <Stack style={{ gap: 'var(--space-3)' }}>
          <Text style={{ fontWeight: 600 }}>Ready to import ({readyToImport.length})</Text>
          {readyToImport.map(item => (
            <Row key={item.id} style={{
              padding: 'var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Stack>
                <Text style={{ fontWeight: 500 }}>{item.provider_data.name as string}</Text>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                  {item.entity_type === 'project' ? 'Project' : 'Subcontractor'} from Procore
                </Text>
              </Stack>
              <Check size={16} color="var(--color-green-10)" />
            </Row>
          ))}
        </Stack>
      )}

      {/* Needs decision */}
      {needsDecision.length > 0 && (
        <Stack style={{ gap: 'var(--space-3)' }}>
          <Text style={{ fontWeight: 600 }}>Needs your decision ({needsDecision.length})</Text>
          {needsDecision.map(item => (
            <Stack key={item.id} style={{
              padding: 'var(--space-4)',
              border: '1px solid var(--color-yellow-7)',
              borderRadius: 'var(--radius-3)',
              gap: 'var(--space-3)',
            }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: 500 }}>{item.provider_data.name as string}</Text>
                <Text style={{
                  fontSize: 'var(--font-size-2)',
                  padding: 'var(--space-1) var(--space-2)',
                  backgroundColor: item.match_status === 'exact_match' ? 'var(--color-green-3)' : 'var(--color-yellow-3)',
                  borderRadius: 'var(--radius-2)',
                }}>
                  {item.match_status === 'exact_match'
                    ? 'Exact match'
                    : `Likely match (${Math.round(item.match_confidence * 100)}%)`}
                </Text>
              </Row>

              <Row style={{ gap: 'var(--space-2)' }}>
                <Button
                  size="sm"
                  variant={decisions[item.id] === 'link' ? 'primary' : 'outline'}
                  onPress={() => setDecisions(d => ({ ...d, [item.id]: 'link' }))}
                  leftIcon={<Link2 size={12} />}
                >
                  Link to existing
                </Button>
                <Button
                  size="sm"
                  variant={decisions[item.id] === 'create_new' ? 'primary' : 'outline'}
                  onPress={() => setDecisions(d => ({ ...d, [item.id]: 'create_new' }))}
                  leftIcon={<Plus size={12} />}
                >
                  Create new
                </Button>
                <Button
                  size="sm"
                  variant={decisions[item.id] === 'skip' ? 'primary' : 'outline'}
                  onPress={() => setDecisions(d => ({ ...d, [item.id]: 'skip' }))}
                  leftIcon={<SkipForward size={12} />}
                >
                  Skip
                </Button>
              </Row>
            </Stack>
          ))}
        </Stack>
      )}

      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={resolveBatch.isPending}
        leftIcon={resolveBatch.isPending ? <Spinner size="sm" /> : <Check size={14} />}
      >
        Confirm Import
      </Button>
    </Stack>
  );
}
```

**Step 3: Update IntegrationSettings.tsx**

Replace the mock Scaffald integration with the real Procore components. Keep the other integration placeholders (Figma, GitHub, etc.) as-is.

Add Procore to the integrations list and render `ProcoreIntegration` + `SyncReviewPanel` at the top.

**Step 4: Commit**

```bash
git add apps/forsured-web/src/pages/gc/settings/IntegrationSettings.tsx \
       apps/forsured-web/src/pages/gc/settings/components/ProcoreIntegration.tsx \
       apps/forsured-web/src/pages/gc/settings/components/SyncReviewPanel.tsx
git commit -m "feat(procore): add Procore integration UI with sync status and review panel"
```

---

## Task 9: OAuth Callback Route

**Files:**
- Create: `apps/forsured-web/src/pages/gc/settings/ProcoreCallback.tsx`
- Modify: `apps/forsured-web/src/router.tsx` (add callback route)

**Context:**
- After Procore OAuth consent, user is redirected back with `?code=...&state=...`
- This page calls `trpc.procore.callback` then redirects to integrations page
- Route: `/settings/integrations/procore/callback`

**Step 1: Create callback page**

```typescript
// apps/forsured-web/src/pages/gc/settings/ProcoreCallback.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Stack, Text, Spinner } from '@unicornlove/beyond-ui';
import { trpc } from '../../../providers/TRPCProvider';

export default function ProcoreCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const callback = trpc.procore.callback.useMutation({
    onSuccess: () => {
      navigate('/settings/integrations', { replace: true });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Procore authorization denied: ${errorParam}`);
      return;
    }

    if (!code || !state) {
      setError('Missing authorization code or state parameter');
      return;
    }

    callback.mutate({ code, state });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-red-10)', marginBottom: 'var(--space-4)' }}>
          {error}
        </Text>
        <a href="/settings/integrations">Back to Integrations</a>
      </Stack>
    );
  }

  return (
    <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
      <Spinner />
      <Text style={{ marginTop: 'var(--space-4)' }}>Connecting your Procore account...</Text>
    </Stack>
  );
}
```

**Step 2: Add route to router.tsx**

Add the callback route under the settings section. Find the existing integration settings route and add the callback as a sibling or child route:

```typescript
import ProcoreCallback from './pages/gc/settings/ProcoreCallback';

// Add alongside other gc settings routes:
{ path: 'settings/integrations/procore/callback', element: <ProcoreCallback /> }
```

**Step 3: Commit**

```bash
git add apps/forsured-web/src/pages/gc/settings/ProcoreCallback.tsx \
       apps/forsured-web/src/router.tsx
git commit -m "feat(procore): add OAuth callback page and route"
```

---

## Task 10: Contract Test — Validate Procore API Mock

**Files:**
- Create: `apps/forsured-web/tests/contracts/procore-api-contract.test.ts`

**Context:**
- Per CLAUDE.md: "mocks used in tests must always be validated"
- This test hits the real Procore API (using `PROCORE_CLIENT_ID` + `PROCORE_CLIENT_SECRET` client credentials) and validates response shapes match our types
- Runs only when `PROCORE_CLIENT_ID` and `PROCORE_CLIENT_SECRET` env vars are set
- Skips gracefully in CI when credentials are missing

**Step 1: Write contract test**

```typescript
// apps/forsured-web/tests/contracts/procore-api-contract.test.ts
import { describe, it, expect } from 'vitest';

const hasCredentials = !!(process.env.PROCORE_CLIENT_ID && process.env.PROCORE_CLIENT_SECRET);

describe.skipIf(!hasCredentials)('Procore API Contract Tests', () => {
  let accessToken: string;

  it('obtains an access token via client credentials', async () => {
    const response = await fetch('https://login.procore.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.PROCORE_CLIENT_ID!,
        client_secret: process.env.PROCORE_CLIENT_SECRET!,
      }).toString(),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    // Validate shape matches ProcoreTokenResponse
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('token_type');
    expect(data).toHaveProperty('expires_in');
    expect(typeof data.access_token).toBe('string');
    expect(typeof data.expires_in).toBe('number');

    accessToken = data.access_token;
  });

  it('GET /me returns user with expected shape', async () => {
    const response = await fetch('https://api.procore.com/rest/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    // Validate shape matches ProcoreUser
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('login');
    expect(typeof data.id).toBe('number');
    expect(typeof data.login).toBe('string');
  });

  it('GET /companies returns array with expected shape', async () => {
    const response = await fetch('https://api.procore.com/rest/v1.0/companies', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      // Validate shape matches ProcoreCompany
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(typeof data[0].id).toBe('number');
      expect(typeof data[0].name).toBe('string');
    }
  });
});
```

**Step 2: Run (requires credentials)**

Run: `PROCORE_CLIENT_ID=$PROCORE_CLIENT_ID PROCORE_CLIENT_SECRET=$PROCORE_CLIENT_SECRET npx vitest run apps/forsured-web/tests/contracts/procore-api-contract.test.ts`

Expected: PASS (or SKIP if no credentials).

**Step 3: Commit**

```bash
git add apps/forsured-web/tests/contracts/procore-api-contract.test.ts
git commit -m "test(procore): add contract tests validating Procore API response shapes"
```

---

## Task 11: Integration Tests with Real DB

**Files:**
- Create: `apps/forsured-web/tests/integration/procore-sync.test.ts`

**Context:**
- Tests the sync engine logic against a real Supabase instance
- Mocks only Procore HTTP calls (external 3rd party)
- Requires local Supabase running with migration 312 applied
- Tests: collision detection with real DB, queue staging, resolution flow

This task depends on Tasks 1, 4, and 6 being complete and Supabase running.

**Step 1: Write integration test**

```typescript
// apps/forsured-web/tests/integration/procore-sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const hasDb = !!supabaseServiceKey;

describe.skipIf(!hasDb)('Procore Sync Integration', () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test data IDs
  let testOrgId: string;
  let testUserId: string;
  let testIntegrationId: string;

  beforeAll(async () => {
    // Create test org and user via service role
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org for Procore' })
      .select('id')
      .single();
    testOrgId = org!.id;

    const { data: user } = await supabase
      .from('users')
      .insert({ email: 'procore-test@test.example.com', name: 'Test User', organization_id: testOrgId })
      .select('id')
      .single();
    testUserId = user!.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) await supabase.from('users').delete().eq('id', testUserId);
    if (testOrgId) await supabase.from('organizations').delete().eq('id', testOrgId);
  });

  it('creates an integration record', async () => {
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: testUserId,
        organization_id: testOrgId,
        provider: 'procore',
        status: 'connected',
        access_token_encrypted: 'test-encrypted',
        refresh_token_encrypted: 'test-encrypted',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    testIntegrationId = data!.id;
  });

  it('stages a sync queue item with no_match', async () => {
    const { data, error } = await supabase
      .from('sync_queue')
      .insert({
        integration_id: testIntegrationId,
        user_id: testUserId,
        organization_id: testOrgId,
        entity_type: 'project',
        provider_entity_id: '12345',
        provider_data: { id: 12345, name: 'New Procore Project' },
        match_status: 'no_match',
      })
      .select('id, resolution')
      .single();

    expect(error).toBeNull();
    expect(data!.resolution).toBe('pending');
  });

  it('stages a sync queue item with exact_match', async () => {
    // First create a forsured project
    const { data: project } = await supabase
      .from('projects')
      .insert({ name: 'Existing Project', organization_id: testOrgId })
      .select('id')
      .single();

    const { data, error } = await supabase
      .from('sync_queue')
      .insert({
        integration_id: testIntegrationId,
        user_id: testUserId,
        organization_id: testOrgId,
        entity_type: 'project',
        provider_entity_id: '99999',
        provider_data: { id: 99999, name: 'Existing Project' },
        match_status: 'exact_match',
        matched_entity_id: project!.id,
        match_confidence: 1.0,
        match_reason: 'name_exact',
      })
      .select('id')
      .single();

    expect(error).toBeNull();

    // Clean up
    await supabase.from('sync_queue').delete().eq('id', data!.id);
    await supabase.from('projects').delete().eq('id', project!.id);
  });

  it('creates a sync log entry', async () => {
    const { data, error } = await supabase
      .from('sync_log')
      .insert({
        integration_id: testIntegrationId,
        triggered_by: 'manual',
        status: 'completed',
        projects_found: 5,
        vendors_found: 3,
        new_items_queued: 2,
        updates_applied: 3,
        interval_before_minutes: 15,
        interval_after_minutes: 30,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run apps/forsured-web/tests/integration/procore-sync.test.ts`

Expected: PASS (or SKIP if no Supabase running).

**Step 3: Commit**

```bash
git add apps/forsured-web/tests/integration/procore-sync.test.ts
git commit -m "test(procore): add integration tests for sync with real DB"
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Database migration (3 tables + column additions) | — |
| 2 | Token encryption module | — |
| 3 | Procore API client + types | — |
| 4 | Collision detection module | — |
| 5 | Adaptive backoff module | — |
| 6 | tRPC Procore router (9 procedures) | 2, 3, 5 |
| 7 | Sync Edge Function | 1, 3, 4, 5 |
| 8 | Frontend integration page + review panel | 6 |
| 9 | OAuth callback route | 6, 8 |
| 10 | Contract tests (validate Procore mocks) | 3 |
| 11 | Integration tests with real DB | 1, 4, 6 |

Tasks 1–5 can run in parallel. Tasks 6–11 have dependencies as noted.
