/**
 * Supabase Test Factory/Helper
 *
 * Provides a comprehensive, configurable Supabase mock factory for testing.
 * Use this to create fresh mocks per test with all query builder methods.
 *
 * @example
 * ```typescript
 * import { createMockSupabaseClient, mockSupabaseResponse } from '@/tests/infrastructure/vitest/helpers/supabase-mock'
 *
 * const client = createMockSupabaseClient()
 * mockSupabaseResponse(client, {
 *   table: 'users',
 *   method: 'select',
 *   data: [{ id: '1', name: 'Test User' }],
 * })
 * ```
 */

import { vi } from "vitest";

// Types for the mock factory
export interface MockQueryBuilderOptions {
  defaultData?: unknown;
  defaultError?: Error | null;
}

export interface MockSupabaseOptions extends MockQueryBuilderOptions {
  auth?: {
    user?: { id: string; email?: string } | null;
    session?: { access_token: string; refresh_token: string } | null;
  };
}

export interface ResponseConfig {
  table?: string;
  method?: "select" | "insert" | "update" | "delete" | "upsert" | "rpc";
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

/**
 * Creates a mock query builder that supports all Supabase query methods
 * with full chaining support.
 */
export function createMockQueryBuilder(options: MockQueryBuilderOptions = {}) {
  const { defaultData = null, defaultError = null } = options;

  // Create a promise that resolves with the default response
  const createResponse = (data = defaultData, error = defaultError) => ({
    data,
    error,
    count: Array.isArray(data) ? data.length : null,
    status: error ? 400 : 200,
    statusText: error ? "Bad Request" : "OK",
  });

  // Builder that returns itself for chaining
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  // Query builder methods - all return the builder for chaining
  const chainMethods = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    // Filter methods
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "contains",
    "containedBy",
    "rangeGt",
    "rangeGte",
    "rangeLt",
    "rangeLte",
    "rangeAdjacent",
    "overlaps",
    "textSearch",
    "match",
    "not",
    "or",
    "and",
    "filter",
    // Ordering and pagination
    "order",
    "limit",
    "range",
    "abortSignal",
    // Modifiers
    "returns",
  ];

  // Add chainable methods
  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods - return promise
  builder.single = vi.fn().mockResolvedValue(createResponse());
  builder.maybeSingle = vi.fn().mockResolvedValue(createResponse());
  builder.csv = vi.fn().mockResolvedValue(createResponse());
  builder.geojson = vi.fn().mockResolvedValue(createResponse());
  builder.explain = vi.fn().mockResolvedValue(createResponse());
  builder.rollback = vi.fn().mockResolvedValue(createResponse());

  // Make the builder thenable (promise-like) so it can be awaited directly
  // We use Object.assign to add Promise methods without triggering biome's no-then-property rule
  const promise = Promise.resolve(createResponse());
  const thenableBuilder = Object.assign(builder, {
    // biome-ignore lint/suspicious/noThenProperty: Required for Promise-like behavior in mocks
    then: vi.fn((resolve) => promise.then(resolve)),
    catch: vi.fn((reject) => promise.catch(reject)),
    finally: vi.fn((callback) => promise.finally(callback)),
  });

  return thenableBuilder;
}

/**
 * Creates a mock schema builder for the .schema('name') pattern
 */
export function createMockSchemaBuilder(options: MockQueryBuilderOptions = {}) {
  const queryBuilder = createMockQueryBuilder(options);

  // RPC handler - returns a promise directly
  const rpcHandler = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: rpcHandler,
  };
}

/**
 * Creates a fully mocked Supabase client suitable for testing.
 *
 * @example
 * ```typescript
 * const client = createMockSupabaseClient()
 *
 * // Use in tests
 * vi.mock('@app/core/utils/supabase/client', () => ({
 *   supabase: client,
 * }))
 * ```
 */
export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const { auth, ...queryOptions } = options;
  const user = auth?.user ?? null;
  const session = auth?.session ?? null;

  const schemaBuilder = createMockSchemaBuilder(queryOptions);
  const queryBuilder = createMockQueryBuilder(queryOptions);

  return {
    // Schema builder for .schema('core').from('table') pattern
    schema: vi.fn().mockReturnValue(schemaBuilder),

    // Direct table access: .from('table')
    from: vi.fn().mockReturnValue(queryBuilder),

    // Direct RPC: .rpc('function_name')
    rpc: vi.fn().mockReturnValue(queryBuilder),

    // Auth methods
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            id: "mock-subscription-id",
            unsubscribe: vi.fn(),
          },
        },
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      setSession: vi.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
    },

    // Realtime channel
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        status: "SUBSCRIBED",
        unsubscribe: vi.fn(),
      }),
      unsubscribe: vi.fn(),
    }),

    // Remove channel
    removeChannel: vi.fn().mockResolvedValue({ error: null }),

    // Storage
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: "mock/path" },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/mock/path" },
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed/mock/path" },
          error: null,
        }),
        createSignedUrls: vi.fn().mockResolvedValue({
          data: [{ signedUrl: "https://example.com/signed/mock/path" }],
          error: null,
        }),
      }),
    },

    // Functions (Edge Functions)
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
}

/**
 * Configure a specific response for a mock Supabase client.
 * This is useful when you need to set up specific test scenarios.
 *
 * @example
 * ```typescript
 * const client = createMockSupabaseClient()
 *
 * // Set up a specific response for a table query
 * mockSupabaseResponse(client, {
 *   table: 'users',
 *   method: 'select',
 *   data: [{ id: '1', name: 'Test User' }],
 * })
 *
 * // Set up an error response
 * mockSupabaseResponse(client, {
 *   table: 'users',
 *   method: 'insert',
 *   error: { message: 'Duplicate key', code: '23505' },
 * })
 * ```
 */
export function mockSupabaseResponse(
  client: ReturnType<typeof createMockSupabaseClient>,
  config: ResponseConfig,
) {
  const { data = null, error = null, count = null } = config;

  const response = {
    data,
    error,
    count,
    status: error ? 400 : 200,
    statusText: error ? "Bad Request" : "OK",
  };

  const promise = Promise.resolve(response);

  // Create a new query builder with the configured response
  const queryBuilder = createMockQueryBuilder();

  // Override terminal methods with the configured response
  queryBuilder.single = vi.fn().mockResolvedValue(response);
  queryBuilder.maybeSingle = vi.fn().mockResolvedValue(response);

  // Make queryBuilder thenable by binding to the response promise
  // This allows `await supabase.from('table').select()` to work in tests
  const thenableMethods = {
    /* biome-ignore lint/suspicious/noThenProperty: Required for Promise-like behavior */
    then: vi.fn().mockImplementation((onFulfilled) =>
      promise.then(onFulfilled)
    ),
    catch: vi.fn().mockImplementation((onRejected) =>
      promise.catch(onRejected)
    ),
    finally: vi.fn().mockImplementation((onFinally) =>
      promise.finally(onFinally)
    ),
  };
  Object.assign(queryBuilder, thenableMethods);

  // Update the client's from method to return this builder
  if (config.table) {
    client.from.mockImplementation((table: string) => {
      if (table === config.table) {
        return queryBuilder;
      }
      return createMockQueryBuilder();
    });
  }

  // Handle RPC calls
  if (config.method === "rpc") {
    client.rpc.mockResolvedValue(response);
    const schemaBuilder = client.schema();
    if (schemaBuilder?.rpc) {
      schemaBuilder.rpc.mockResolvedValue(response);
    }
  }

  return queryBuilder;
}

/**
 * Creates a mock authenticated user for testing auth-dependent features.
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  role: string;
}> = {}) {
  return {
    id: overrides.id ?? "mock-user-id",
    email: overrides.email ?? "test@example.com",
    phone: overrides.phone ?? "",
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: overrides.user_metadata ?? {},
    aud: overrides.aud ?? "authenticated",
    role: overrides.role ?? "authenticated",
  };
}

/**
 * Creates a mock session for testing auth-dependent features.
 */
export function createMockSession(overrides: Partial<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: ReturnType<typeof createMockUser>;
}> = {}) {
  const user = overrides.user ?? createMockUser();

  return {
    access_token: overrides.access_token ?? "mock-access-token",
    refresh_token: overrides.refresh_token ?? "mock-refresh-token",
    expires_in: overrides.expires_in ?? 3600,
    expires_at: overrides.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    token_type: overrides.token_type ?? "bearer",
    user,
  };
}

/**
 * Resets all mocks on a Supabase client.
 * Call this in beforeEach() to ensure clean state between tests.
 */
export function resetSupabaseMocks(
  client: ReturnType<typeof createMockSupabaseClient>,
) {
  vi.clearAllMocks();

  // Reset all top-level mocks
  client.schema.mockClear();
  client.from.mockClear();
  client.rpc.mockClear();

  // Reset auth mocks
  Object.values(client.auth).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      mock.mockClear();
    }
  });

  // Reset storage mocks
  client.storage.from.mockClear();

  // Reset functions mocks
  client.functions.invoke.mockClear();
}

// Re-export types for convenience
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
export type MockQueryBuilder = ReturnType<typeof createMockQueryBuilder>;
export type MockSchemaBuilder = ReturnType<typeof createMockSchemaBuilder>;
