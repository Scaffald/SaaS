import { vi } from 'vitest';

// Create a comprehensive Supabase mock that supports the full query builder API
function createSupabaseQueryBuilder() {
  // Create a promise-like object that can be awaited
  const createPromiseLike = (defaultValue = { data: null, error: null }) => {
    const promise = Promise.resolve(defaultValue);
    return Object.assign(promise, {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
    });
  };

  const builder = {
    // Query builder methods - all return the builder for chaining
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    
    // Filter methods
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    
    // Ordering and pagination
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    csv: vi.fn().mockReturnThis(),
    geojson: vi.fn().mockReturnThis(),
    explain: vi.fn().mockReturnThis(),
    rollback: vi.fn().mockReturnThis(),
  };
  
  // Make the builder thenable (promise-like) - can be awaited
  return Object.assign(builder, createPromiseLike());
}

function createSupabaseSchemaBuilder() {
  const queryBuilder = createSupabaseQueryBuilder();
  
  // RPC handler that returns a promise directly (for schema().rpc() calls)
  // This is the correct behavior: schema().rpc() returns a promise, not a builder
  const rpcHandler = vi.fn().mockResolvedValue({ data: null, error: null });
  
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    // rpc should return a promise directly when called on schema builder
    rpc: rpcHandler,
  };
}

// Create the main Supabase client mock
const mockSupabaseClient = {
  schema: vi.fn().mockReturnValue(createSupabaseSchemaBuilder()),
  from: vi.fn().mockReturnValue(createSupabaseQueryBuilder()),
  rpc: vi.fn().mockReturnValue(createSupabaseQueryBuilder()),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: null }, unsubscribe: vi.fn() }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED', unsubscribe: vi.fn() }),
  }),
};

// Mock the Supabase client module
vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

export { mockSupabaseClient, createSupabaseQueryBuilder, createSupabaseSchemaBuilder };

